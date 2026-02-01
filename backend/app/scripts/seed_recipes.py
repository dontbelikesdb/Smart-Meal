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
    create_ingredients: bool,
    backfill_nutrition: bool,
    backfill_ingredients: bool,
    backfill_diet: bool,
    commit_every: int,
) -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ing_cache: dict[str, int] = {}

        inserted = 0
        nutrition_upserts = 0
        ingredient_links = 0
        diet_updates = 0
        ops = 0
        seen = 0

        for row in _iter_rows(csv_path):
            if limit and seen >= limit:
                break

            seen += 1
            rid = row.get("RecipeId")
            if not rid:
                continue

            try:
                recipe_id = int(float(rid))
            except ValueError:
                continue

            existing = db.get(Recipe, recipe_id)
            if existing is not None and not (backfill_nutrition or backfill_ingredients or backfill_diet):
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

            cuisine_type = _guess_cuisine(category, keywords)
            is_vegetarian = _classify_is_vegetarian(
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
                    is_gluten_free=False,
                    is_dairy_free=False,
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
                for part in ingredient_parts:
                    try:
                        ing_id = _get_or_create_ingredient(db, ing_cache, part)
                    except ValueError:
                        continue

                    if ing_id in existing_links:
                        continue

                    db.add(
                        RecipeIngredient(
                            recipe_id=recipe_id,
                            ingredient_id=ing_id,
                            quantity=1.0,
                            notes=None,
                        )
                    )
                    ingredient_links += 1
                    ops += 1
            if commit_every and ops and ops % commit_every == 0:
                db.commit()

        db.commit()
        print(
            f"Seed complete. Seen rows: {seen}, inserted recipes: {inserted}, "
            f"nutrition upserts: {nutrition_upserts}, ingredient links: {ingredient_links}, "
            f"diet updates: {diet_updates}"
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
    parser.add_argument("--create-ingredients", action="store_true")
    parser.add_argument("--backfill-nutrition", action="store_true")
    parser.add_argument("--backfill-ingredients", action="store_true")
    parser.add_argument("--backfill-diet", action="store_true")
    parser.add_argument("--commit-every", type=int, default=250)
    args = parser.parse_args()

    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(str(csv_path))

    seed_recipes(
        csv_path=csv_path,
        limit=args.limit,
        create_ingredients=args.create_ingredients,
        backfill_nutrition=bool(args.backfill_nutrition),
        backfill_ingredients=bool(args.backfill_ingredients),
        backfill_diet=bool(args.backfill_diet),
        commit_every=args.commit_every,
    )


if __name__ == "__main__":
    main()
