import argparse
import csv
import re
from pathlib import Path
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.db.session import Base, SessionLocal, engine
from app.models.ingredient import Ingredient, RecipeIngredient
from app.models.recipe import CuisineType, Recipe, RecipeNutritionalInfo


_NON_VEG_KEYWORDS = {
    "anchovy",
    "anchovies",
    "bacon",
    "beef",
    "bratwurst",
    "chicken",
    "chorizo",
    "crab",
    "duck",
    "fish",
    "ham",
    "lamb",
    "lobster",
    "meat",
    "mutton",
    "pork",
    "pepperoni",
    "prawn",
    "prosciutto",
    "salami",
    "salmon",
    "sausage",
    "shrimp",
    "steak",
    "tuna",
    "turkey",
    "venison",
}

_NON_VEG_REGEXES = [
    # Use word boundaries so "ham" doesn't match "sham".
    re.compile(r"\b(?:" + "|".join(sorted(map(re.escape, _NON_VEG_KEYWORDS))) + r")\b", re.IGNORECASE),
    # Stock/broth signals (avoid flagging "vegetable stock").
    re.compile(r"\b(?:chicken|beef|fish)\s+(?:stock|broth)\b", re.IGNORECASE),
    re.compile(r"\b(?:chicken|beef|fish)\s+(?:bouillon)\b", re.IGNORECASE),
    # Common gelatin signal.
    re.compile(r"\bgelatin\b", re.IGNORECASE),
]

_GLUTEN_KEYWORDS = {
    "all purpose flour",
    "all-purpose flour",
    "barley",
    "bread flour",
    "bulgur",
    "couscous",
    "durum",
    "farina",
    "flour",
    "gluten",
    "malt",
    "rye",
    "seitan",
    "semolina",
    "spelt",
    "wheat",
    "wheat flour",
}

_GLUTEN_FREE_POSITIVE_REGEXES = [
    re.compile(r"\bgluten[-\s]?free\b", re.IGNORECASE),
    re.compile(r"\bceliac[-\s]?friendly\b", re.IGNORECASE),
    re.compile(r"\bcoeliac[-\s]?friendly\b", re.IGNORECASE),
]

_GLUTEN_REGEXES = [
    re.compile(r"\b(?:" + "|".join(sorted(map(re.escape, _GLUTEN_KEYWORDS), key=len, reverse=True)) + r")\b", re.IGNORECASE),
]

_GLUTEN_RISK_RECIPE_REGEX = re.compile(
    r"\b(?:bread|breadcrumb|breaded|pasta|noodle|cake|cookie|shortbread|pudding|pastry|dough|cracker|biscuit|bun|roll|muffin|pizza)\b",
    re.IGNORECASE,
)

_LOW_GLUTEN_RISK_RECIPE_REGEX = re.compile(
    r"\b(?:cornbread|corn bread|rice bread|buckwheat bread|gluten[-\s]?free)\b",
    re.IGNORECASE,
)

_DAIRY_KEYWORDS = {
    "butter",
    "buttermilk",
    "casein",
    "cheese",
    "cream",
    "curd",
    "dairy",
    "ghee",
    "milk",
    "paneer",
    "whey",
    "yogurt",
    "yoghurt",
}

_DAIRY_FREE_POSITIVE_REGEXES = [
    re.compile(r"\bdairy[-\s]?free\b", re.IGNORECASE),
]

_DAIRY_REGEXES = [
    re.compile(r"\b(?:" + "|".join(sorted(map(re.escape, _DAIRY_KEYWORDS), key=len, reverse=True)) + r")\b", re.IGNORECASE),
]

_CUISINE_HINTS: list[tuple[str, CuisineType]] = [
    ("indian", CuisineType.INDIAN),
    ("italian", CuisineType.ITALIAN),
    ("mexican", CuisineType.MEXICAN),
    ("chinese", CuisineType.CHINESE),
    ("japanese", CuisineType.JAPANESE),
    ("thai", CuisineType.THAI),
    ("mediterranean", CuisineType.MEDITERRANEAN),
    ("american", CuisineType.AMERICAN),
]


def _safe_float(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    v = value.strip()
    if not v or v.upper() == "NA":
        return None
    try:
        return float(v)
    except ValueError:
        return None


_DURATION_RE = re.compile(r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$")


def _duration_to_minutes(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    v = value.strip()
    if not v or v.upper() == "NA":
        return None
    m = _DURATION_RE.match(v)
    if not m:
        return None
    hours = int(m.group(1) or 0)
    minutes = int(m.group(2) or 0)
    seconds = int(m.group(3) or 0)
    return hours * 60 + minutes + (1 if seconds >= 30 else 0)


def _parse_c_list(value: Optional[str]) -> list[str]:
    if value is None:
        return []
    v = value.strip()
    if not v or v.upper() == "NA" or v == "character(0)":
        return []
    # Most fields are like: c("a", "b")
    items = re.findall(r'"(.*?)"', v, flags=re.DOTALL)
    out: list[str] = []
    for it in items:
        s = it.replace("\\\"", '"').strip()
        if s:
            out.append(s)
    return out


def _first_image_url(images_field: Optional[str]) -> Optional[str]:
    items = _parse_c_list(images_field)
    return items[0] if items else None


def _guess_cuisine(*text_fields: str) -> Optional[CuisineType]:
    hay = " ".join(text_fields).lower()
    for token, cuisine in _CUISINE_HINTS:
        if token in hay:
            return cuisine
    return None


def _is_non_veg_text(hay: str) -> bool:
    for rx in _NON_VEG_REGEXES:
        if rx.search(hay):
            return True
    return False


def _classify_is_vegetarian(
    *,
    name: str,
    category: str,
    keywords: str,
    ingredient_parts: list[str],
) -> bool:
    # Deterministic ruleset:
    # - If any strong non-veg indicator appears in name/category/keywords/ingredients => non-veg.
    # - Otherwise treat as vegetarian.
    hay = " ".join([name, category, keywords, " ".join(ingredient_parts)]).lower()
    return not _is_non_veg_text(hay)


def _classify_free_from(
    *,
    positive_regexes: list[re.Pattern],
    allergen_regexes: list[re.Pattern],
    name: str,
    category: str,
    keywords: str,
    ingredient_parts: list[str],
) -> bool:
    descriptive_text = " ".join([name, category, keywords]).lower()
    if any(rx.search(descriptive_text) for rx in positive_regexes):
        return True

    ingredient_text = " ".join(ingredient_parts).lower()
    if not ingredient_text:
        return False
    if len(ingredient_text.strip()) < 3:
        return False
    return not any(rx.search(ingredient_text) for rx in allergen_regexes)


def _classify_is_gluten_free(
    *,
    name: str,
    category: str,
    keywords: str,
    ingredient_parts: list[str],
) -> bool:
    descriptive_text = " ".join([name, category, keywords]).lower()
    if (
        _GLUTEN_RISK_RECIPE_REGEX.search(descriptive_text)
        and not _LOW_GLUTEN_RISK_RECIPE_REGEX.search(descriptive_text)
        and not any(rx.search(descriptive_text) for rx in _GLUTEN_FREE_POSITIVE_REGEXES)
    ):
        return False

    return _classify_free_from(
        positive_regexes=_GLUTEN_FREE_POSITIVE_REGEXES,
        allergen_regexes=_GLUTEN_REGEXES,
        name=name,
        category=category,
        keywords=keywords,
        ingredient_parts=ingredient_parts,
    )


def _classify_is_dairy_free(
    *,
    name: str,
    category: str,
    keywords: str,
    ingredient_parts: list[str],
) -> bool:
    return _classify_free_from(
        positive_regexes=_DAIRY_FREE_POSITIVE_REGEXES,
        allergen_regexes=_DAIRY_REGEXES,
        name=name,
        category=category,
        keywords=keywords,
        ingredient_parts=ingredient_parts,
    )


def _iter_rows(csv_path: Path) -> Iterable[dict[str, str]]:
    csv.field_size_limit(2**31 - 1)
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row


def _get_or_create_ingredient(db: Session, cache: dict[str, int], name: str) -> int:
    key = name.strip().lower()
    if not key:
        raise ValueError("ingredient name empty")

    existing_id = cache.get(key)
    if existing_id is not None:
        return existing_id

    existing = db.query(Ingredient).filter(Ingredient.name.ilike(name)).first()
    if existing is not None:
        cache[key] = existing.id
        return existing.id

    ing = Ingredient(
        name=name.strip(),
        category=None,
        unit="unit",
        calories_per_unit=0.0,
        protein_per_unit=0.0,
        carbs_per_unit=0.0,
        fat_per_unit=0.0,
    )
    db.add(ing)
    db.flush()
    cache[key] = ing.id
    return ing.id


def seed_recipes(
    *,
    csv_path: Path,
    limit: int,
    skip_rows: int,
    create_ingredients: bool,
    backfill_nutrition: bool,
    backfill_ingredients: bool,
    backfill_diet: bool,
    backfill_images: bool,
    commit_every: int,
    progress_every: int,
) -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ing_cache: dict[str, int] = {}

        inserted = 0
        nutrition_upserts = 0
        ingredient_links = 0
        diet_updates = 0
        image_updates = 0
        ops = 0
        seen = 0
        skipped = 0

        for row in _iter_rows(csv_path):
            if skipped < skip_rows:
                skipped += 1
                continue

            if limit and seen >= limit:
                break

            seen += 1
            if progress_every and seen % progress_every == 0:
                print(
                    f"Progress: skipped={skipped}, seen={seen}, inserted={inserted}, "
                    f"ingredient_links={ingredient_links}, nutrition_upserts={nutrition_upserts}, "
                    f"diet_updates={diet_updates}, image_updates={image_updates}",
                    flush=True,
                )

            rid = row.get("RecipeId")
            if not rid:
                continue

            try:
                recipe_id = int(float(rid))
            except ValueError:
                continue

            existing = db.get(Recipe, recipe_id)
            if existing is not None and not (
                backfill_nutrition
                or backfill_ingredients
                or backfill_diet
                or backfill_images
            ):
                continue

            name = (row.get("Name") or "").strip()
            if not name:
                continue

            description = (row.get("Description") or "").strip() or None
            instructions_steps = _parse_c_list(row.get("RecipeInstructions"))
            instructions = "\n".join(instructions_steps).strip() if instructions_steps else (row.get("RecipeInstructions") or "").strip()
            if not instructions:
                instructions = name

            prep_time = _duration_to_minutes(row.get("PrepTime"))
            cook_time = _duration_to_minutes(row.get("CookTime"))

            servings_f = _safe_float(row.get("RecipeServings"))
            servings = int(servings_f) if servings_f and servings_f > 0 else 1

            image_url = _first_image_url(row.get("Images"))

            category = row.get("RecipeCategory") or ""
            keywords = " ".join(_parse_c_list(row.get("Keywords")))
            ingredient_parts = _parse_c_list(row.get("RecipeIngredientParts"))
            ingredient_quantities = _parse_c_list(row.get("RecipeIngredientQuantities"))

            cuisine_type = _guess_cuisine(category, keywords)
            is_vegetarian = _classify_is_vegetarian(
                name=name,
                category=category,
                keywords=keywords,
                ingredient_parts=ingredient_parts,
            )
            is_gluten_free = _classify_is_gluten_free(
                name=name,
                category=category,
                keywords=keywords,
                ingredient_parts=ingredient_parts,
            )
            is_dairy_free = _classify_is_dairy_free(
                name=name,
                category=category,
                keywords=keywords,
                ingredient_parts=ingredient_parts,
            )

            recipe = existing
            if recipe is None:
                recipe = Recipe(
                    id=recipe_id,
                    name=name,
                    description=description,
                    instructions=instructions,
                    prep_time=prep_time,
                    cook_time=cook_time,
                    servings=servings,
                    cuisine_type=cuisine_type,
                    is_vegetarian=is_vegetarian,
                    is_vegan=False,
                    is_gluten_free=is_gluten_free,
                    is_dairy_free=is_dairy_free,
                    image_url=image_url,
                )
                db.add(recipe)
                inserted += 1
                ops += 1
            elif backfill_diet:
                if recipe.is_vegetarian != is_vegetarian:
                    recipe.is_vegetarian = is_vegetarian
                    diet_updates += 1
                    ops += 1
                if recipe.is_gluten_free != is_gluten_free:
                    recipe.is_gluten_free = is_gluten_free
                    diet_updates += 1
                    ops += 1
                if recipe.is_dairy_free != is_dairy_free:
                    recipe.is_dairy_free = is_dairy_free
                    diet_updates += 1
                    ops += 1

            if recipe is not None and backfill_images and image_url and not recipe.image_url:
                recipe.image_url = image_url
                image_updates += 1
                ops += 1

            calories = _safe_float(row.get("Calories"))
            protein = _safe_float(row.get("ProteinContent"))
            carbs = _safe_float(row.get("CarbohydrateContent"))
            fat = _safe_float(row.get("FatContent"))
            fiber = _safe_float(row.get("FiberContent"))
            sugar = _safe_float(row.get("SugarContent"))
            sodium = _safe_float(row.get("SodiumContent"))

            # NutritionalInfo columns are non-null for calories/protein/carbs/fat.
            if calories is not None and protein is not None and carbs is not None and fat is not None:
                existing_nut = db.query(RecipeNutritionalInfo).filter(RecipeNutritionalInfo.recipe_id == recipe_id).first()
                if existing_nut is None:
                    nut = RecipeNutritionalInfo(
                        recipe_id=recipe_id,
                        calories=calories,
                        protein_g=protein,
                        carbs_g=carbs,
                        fat_g=fat,
                        fiber_g=fiber,
                        sugar_g=sugar,
                        sodium_mg=sodium,
                    )
                    db.add(nut)
                    nutrition_upserts += 1
                    ops += 1
                elif backfill_nutrition:
                    existing_nut.calories = calories
                    existing_nut.protein_g = protein
                    existing_nut.carbs_g = carbs
                    existing_nut.fat_g = fat
                    existing_nut.fiber_g = fiber
                    existing_nut.sugar_g = sugar
                    existing_nut.sodium_mg = sodium
                    nutrition_upserts += 1
                    ops += 1

            if create_ingredients and ingredient_parts and (recipe is not None) and (existing is None or backfill_ingredients):
                existing_links = set()
                if existing is not None:
                    existing_links = {
                        r[0]
                        for r in db.query(RecipeIngredient.ingredient_id)
                        .filter(RecipeIngredient.recipe_id == recipe_id)
                        .all()
                    }
                for idx, part in enumerate(ingredient_parts):
                    try:
                        ing_id = _get_or_create_ingredient(db, ing_cache, part)
                    except ValueError:
                        continue

                    qty_note = None
                    if idx < len(ingredient_quantities):
                        qv = (ingredient_quantities[idx] or "").strip()
                        if qv and qv.upper() != "NA":
                            qty_note = qv

                    if ing_id in existing_links:
                        if backfill_ingredients and qty_note:
                            link = (
                                db.query(RecipeIngredient)
                                .filter(
                                    RecipeIngredient.recipe_id == recipe_id,
                                    RecipeIngredient.ingredient_id == ing_id,
                                )
                                .first()
                            )
                            if link is not None and (link.notes is None or not str(link.notes).strip()):
                                link.notes = qty_note
                                ops += 1
                        continue
                    db.add(
                        RecipeIngredient(
                            recipe_id=recipe_id,
                            ingredient_id=ing_id,
                            quantity=1.0,
                            notes=qty_note,
                        )
                    )
                    ingredient_links += 1
                    ops += 1
            if commit_every and ops and ops % commit_every == 0:
                db.commit()

        db.commit()
        print(
            f"Seed complete. Skipped rows: {skipped}, seen rows: {seen}, inserted recipes: {inserted}, "
            f"nutrition upserts: {nutrition_upserts}, ingredient links: {ingredient_links}, "
            f"diet updates: {diet_updates}, image updates: {image_updates}"
        )

    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--csv",
        dest="csv_path",
        default=str(Path(__file__).resolve().parents[3] / "data" / "raw" / "recipes.csv"),
    )
    parser.add_argument("--limit", type=int, default=2000)
    parser.add_argument("--skip", type=int, default=0)
    parser.add_argument("--create-ingredients", action="store_true")
    parser.add_argument("--backfill-nutrition", action="store_true")
    parser.add_argument("--backfill-ingredients", action="store_true")
    parser.add_argument("--backfill-diet", action="store_true")
    parser.add_argument("--backfill-images", action="store_true")
    parser.add_argument("--commit-every", type=int, default=250)
    parser.add_argument("--progress-every", type=int, default=1000)
    args = parser.parse_args()

    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(str(csv_path))

    seed_recipes(
        csv_path=csv_path,
        limit=args.limit,
        skip_rows=max(0, args.skip),
        create_ingredients=args.create_ingredients,
        backfill_nutrition=bool(args.backfill_nutrition),
        backfill_ingredients=bool(args.backfill_ingredients),
        backfill_diet=bool(args.backfill_diet),
        backfill_images=bool(args.backfill_images),
        commit_every=args.commit_every,
        progress_every=max(0, args.progress_every),
    )


if __name__ == "__main__":
    main()
