import json
import logging
import re
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.core.allergy_catalog import expand_allergy_terms, get_allergy_aliases
from app.core.config import settings
from app.models.allergy import Allergy, UserAllergy
from app.models.ingredient import Ingredient, RecipeIngredient
from app.models.profile import UserProfile
from app.models.recipe import Recipe, RecipeNutritionalInfo
from app.models.user import User

from .schemas import CalorieBucket, DietType, ParsedQuery, RecipeResult


logger = logging.getLogger(__name__)


_LOW_MAX = 400.0
_MEDIUM_MAX = 700.0
_BMI_LOW_CAL_CUTOFF = 22.9

# Nutrition heuristic thresholds (per serving) used when the user asks for
# high-protein / low-carb type queries.
_HIGH_PROTEIN_MIN_G = 20.0
_LOW_CARB_MAX_G = 30.0
_HIGH_FIBER_MIN_G = 8.0
_LOW_SODIUM_MAX_MG = 500.0
_LOW_SUGAR_MAX_G = 10.0
_HIGH_SUGAR_MIN_G = 20.0

_UNSUPPORTED_QUERY_HINTS: Dict[str, str] = {
    "budget": "Budget-aware filtering is not supported yet.",
    "cheap": "Budget-aware filtering is not supported yet.",
    "spicy": "Spice-level filtering is not supported yet; using text relevance only.",
    "mild": "Spice-level filtering is not supported yet; using text relevance only.",
}

_STOPWORDS: Set[str] = {
    "a",
    "an",
    "and",
    "are",
    "dish",
    "dishes",
    "food",
    "for",
    "give",
    "i",
    "in",
    "is",
    "it",
    "me",
    "please",
    "recipe",
    "recipes",
    "recommend",
    "recommended",
    "suggest",
    "some",
    "the",
    "to",
    "want",
    "with",
    "without",
    "option",
    "options",
}


def _normalize_term(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())


def _extract_search_terms(query: str, parsed: ParsedQuery) -> List[str]:
    # Prefer structured include_terms from the LLM when present.
    terms: List[str] = []
    for t in parsed.include_terms:
        nt = _normalize_term(str(t))
        if nt:
            terms.append(nt)

    excluded = {_normalize_term(t) for t in parsed.exclude_terms if t}

    # Fall back to tokenization of the original query.
    tokens = re.findall(r"[a-zA-Z]{3,}", query.lower())
    for tok in tokens:
        if tok in _STOPWORDS:
            continue
        if tok in excluded:
            continue
        # Don't use these as content search terms since they're handled by filters.
        if tok in {"veg", "vegetarian", "non", "nonveg", "non-veg", "calorie", "calories", "kcal", "low", "high", "medium"}:
            continue
        terms.append(tok)

    # Deduplicate while preserving order.
    seen: Set[str] = set()
    out: List[str] = []
    for t in terms:
        if t in seen:
            continue
        seen.add(t)
        out.append(t)
    return out


def list_recipes(db: Session, limit: int = 10) -> List[RecipeResult]:
    q0 = _build_base_recipe_query(db).order_by(Recipe.id.asc())
    return _fetch_results(q0, limit)


def _fallback_parse(query: str) -> ParsedQuery:
    q = _normalize_term(query)

    diet: Optional[DietType] = None
    if "non-veg" in q or "non veg" in q or "nonvegetarian" in q or "non vegetarian" in q:
        diet = DietType.NON_VEG
    elif "veg" in q or "vegetarian" in q:
        diet = DietType.VEG

    calorie_bucket: Optional[CalorieBucket] = None
    wants_high_calorie = False

    if (
        "low calorie" in q
        or "low calories" in q
        or "low-calorie" in q
        or "low-calories" in q
        or "low kcal" in q
        or "light" in q
    ):
        calorie_bucket = CalorieBucket.LOW
    elif (
        "high calorie" in q
        or "high calories" in q
        or "high-calorie" in q
        or "high-calories" in q
        or "high kcal" in q
    ):
        calorie_bucket = CalorieBucket.HIGH
        wants_high_calorie = True
    elif "medium calorie" in q or "moderate calorie" in q:
        calorie_bucket = CalorieBucket.MEDIUM

    exclude_terms: List[str] = []
    for m in re.finditer(r"\b(no|without|exclude)\s+([a-zA-Z][a-zA-Z\s_-]{1,30})", q):
        term = _normalize_term(m.group(2))
        if term:
            exclude_terms.append(term)

    return ParsedQuery(
        diet=diet,
        calorie_bucket=calorie_bucket,
        include_terms=[],
        exclude_terms=exclude_terms,
        wants_high_calorie=wants_high_calorie,
    )


def _try_parse_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None

    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, flags=re.IGNORECASE | re.DOTALL)
    if fenced:
        cleaned = fenced.group(1).strip()

    decoder = json.JSONDecoder()

    for i, ch in enumerate(cleaned):
        if ch != "{":
            continue
        try:
            obj, _end = decoder.raw_decode(cleaned[i:])
        except Exception:
            continue
        if isinstance(obj, dict):
            return obj

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    snippet = cleaned[start : end + 1]
    try:
        obj = json.loads(snippet)
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


def _coerce_diet(value: Any) -> Optional[DietType]:
    if value is None:
        return None
    s = _normalize_term(str(value))
    s = s.replace("-", " ")
    s = re.sub(r"\s+", " ", s).strip()
    if not s:
        return None
    if s in {"veg", "vegetarian", "vegan"}:
        return DietType.VEG
    if s in {"non veg", "nonveg", "non vegetarian", "nonvegetarian"}:
        return DietType.NON_VEG
    if s.replace(" ", "_") == "non_veg":
        return DietType.NON_VEG
    return None


def _coerce_calorie_bucket(value: Any) -> Optional[CalorieBucket]:
    if value is None:
        return None
    s = _normalize_term(str(value))
    s = s.replace("-", " ")
    s = re.sub(r"\s+", " ", s).strip()
    if not s:
        return None
    if s.startswith("low"):
        return CalorieBucket.LOW
    if s.startswith("med") or s.startswith("moderate"):
        return CalorieBucket.MEDIUM
    if s.startswith("high"):
        return CalorieBucket.HIGH
    if s in {"400-700", "400 to 700", "mid"}:
        return CalorieBucket.MEDIUM
    return None


def _coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    s = _normalize_term(str(value))
    if s in {"true", "yes", "y", "1"}:
        return True
    if s in {"false", "no", "n", "0"}:
        return False
    return False


def _sanitize_terms(value: Any, *, max_items: int = 12) -> List[str]:
    if not value:
        return []
    items: List[str]
    if isinstance(value, (list, tuple, set)):
        items = [str(x) for x in value]
    else:
        items = [str(value)]

    out: List[str] = []
    seen: Set[str] = set()
    for raw in items:
        t = _normalize_term(raw)
        if not t:
            continue
        if len(t) > 64:
            t = t[:64].strip()
        if not t:
            continue
        if t in seen:
            continue
        seen.add(t)
        out.append(t)
        if len(out) >= max_items:
            break
    return out


def parse_query(query: str) -> ParsedQuery:
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    model_name = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")

    if not api_key:
        logger.debug("parse_query: missing GEMINI_API_KEY, using fallback")
        return _fallback_parse(query)

    try:
        try:
            from google import genai  # type: ignore

            client = genai.Client(api_key=api_key)
            use_new_sdk = True
        except Exception:
            use_new_sdk = False

        prompt = (
            "You are a parser for a recipe search API. Convert the user query into a compact JSON object. "
            "Return ONLY JSON, no extra text.\n\n"
            "Schema:\n"
            "{\n"
            "  \"diet\": null | \"veg\" | \"non_veg\",\n"
            "  \"calorie_bucket\": null | \"low\" | \"medium\" | \"high\",\n"
            "  \"include_terms\": [string],\n"
            "  \"exclude_terms\": [string],\n"
            "  \"wants_high_calorie\": boolean\n"
            "}\n\n"
            f"User query: {query}\n"
        )

        if use_new_sdk:
            resp = client.models.generate_content(model=model_name, contents=prompt)
            raw = getattr(resp, "text", "") or ""
        else:
            try:
                import google.generativeai as genai_old  # type: ignore

                genai_old.configure(api_key=api_key)
                model = genai_old.GenerativeModel(model_name)
                resp = model.generate_content(prompt)
                raw = getattr(resp, "text", "") or ""
            except Exception:
                logger.debug("parse_query: Gemini SDK import failed, using fallback")
                return _fallback_parse(query)

        data = _try_parse_json_from_text(raw)
        if not isinstance(data, dict):
            logger.debug("parse_query: Gemini did not return JSON, using fallback")
            return _fallback_parse(query)

        diet = _coerce_diet(data.get("diet"))
        calorie_bucket = _coerce_calorie_bucket(data.get("calorie_bucket"))
        include_terms = _sanitize_terms(data.get("include_terms"))
        exclude_terms = _sanitize_terms(data.get("exclude_terms"))
        wants_high_calorie = _coerce_bool(data.get("wants_high_calorie"))

        parsed = ParsedQuery(
            diet=diet,
            calorie_bucket=calorie_bucket,
            include_terms=include_terms,
            exclude_terms=exclude_terms,
            wants_high_calorie=wants_high_calorie,
        )

        if parsed.calorie_bucket is None and re.search(r"\b(high[-\s]?cal|high[-\s]?calorie|high[-\s]?calories|high\s+kcal)\b", _normalize_term(query)):
            parsed.calorie_bucket = CalorieBucket.HIGH
            parsed.wants_high_calorie = True

        return parsed
    except Exception:
        logger.debug("parse_query: Gemini parse failed, using fallback", exc_info=True)
        return _fallback_parse(query)


def compute_bmi(profile: Optional[UserProfile]) -> Optional[float]:
    if profile is None:
        return None
    if profile.bmi is not None:
        return float(profile.bmi)
    if profile.height_cm is None or profile.weight_kg is None:
        return None
    height_m = float(profile.height_cm) / 100.0
    if height_m <= 0:
        return None
    return float(profile.weight_kg) / (height_m * height_m)


def _calorie_bucket_for_recipe(calories: Optional[float]) -> Optional[CalorieBucket]:
    if calories is None:
        return None
    if calories < _LOW_MAX:
        return CalorieBucket.LOW
    if calories <= _MEDIUM_MAX:
        return CalorieBucket.MEDIUM
    return CalorieBucket.HIGH


def _get_user_allergy_terms(db: Session, user: User) -> Set[str]:
    # Existing normalized allergy table is already present.
    rows: Sequence[Tuple[str]] = (
        db.query(Allergy.name)
        .join(UserAllergy, UserAllergy.allergy_id == Allergy.id)
        .filter(UserAllergy.user_id == user.id)
        .all()
    )
    terms = {_normalize_term(r[0]) for r in rows if r and r[0]}
    return {t for t in terms if t}


def _apply_text_search(base_query, q: str):
    like = f"%{q}%"
    return base_query.filter(
        (Recipe.name.ilike(like))
        | (Recipe.description.ilike(like))
        | (Recipe.instructions.ilike(like))
    )


def _apply_text_search_terms(base_query, terms: List[str], *, require_all: bool = False):
    # Default behavior remains lenient (ANY term). When require_all=True, enforce ALL terms.
    if not terms:
        return base_query

    if require_all:
        for t in terms:
            like = f"%{t}%"
            base_query = base_query.filter(
                (Recipe.name.ilike(like))
                | (Recipe.description.ilike(like))
                | (Recipe.instructions.ilike(like))
            )
        return base_query

    clauses = []
    for t in terms:
        like = f"%{t}%"
        clauses.append(
            (Recipe.name.ilike(like))
            | (Recipe.description.ilike(like))
            | (Recipe.instructions.ilike(like))
        )
    return base_query.filter(or_(*clauses))


def _wants_vegan(query: str, parsed: ParsedQuery) -> bool:
    q = _normalize_term(query)
    if "vegan" in q:
        return True
    for t in parsed.include_terms or []:
        if _normalize_term(str(t)) == "vegan":
            return True
    return False


def _ingredient_term_clauses(term: str):
    t = _normalize_term(term)
    if not t:
        return None
    return or_(
        Ingredient.name.ilike(t),
        Ingredient.name.ilike(f"{t} %"),
        Ingredient.name.ilike(f"% {t}"),
        Ingredient.name.ilike(f"% {t} %"),
    )


def _exclude_ingredient_terms(base_query, terms: List[str]):
    clauses = []
    for term in terms:
        c = _ingredient_term_clauses(term)
        if c is not None:
            clauses.append(c)
    if not clauses:
        return base_query
    return base_query.filter(
        ~Recipe.ingredients.any(
            RecipeIngredient.ingredient.has(or_(*clauses))
        )
    )


def _text_term_clauses(col, term: str):
    t = _normalize_term(term)
    if not t:
        return None
    return or_(
        col.ilike(t),
        col.ilike(f"{t} %"),
        col.ilike(f"% {t}"),
        col.ilike(f"% {t} %"),
    )


def _exclude_recipe_text_terms(base_query, terms: List[str]):
    # Exclude recipes where name/description/instructions explicitly mention a forbidden term.
    # This complements ingredient-based exclusion for datasets with incomplete ingredient parsing.
    if not terms:
        return base_query

    cols = [Recipe.name, Recipe.description, Recipe.instructions]
    out_clauses = []
    for term in terms:
        per_term = []
        for col in cols:
            c = _text_term_clauses(col, term)
            if c is not None:
                per_term.append(c)
        if per_term:
            out_clauses.append(or_(*per_term))

    if not out_clauses:
        return base_query
    return base_query.filter(~or_(*out_clauses))


def _extract_time_limit_minutes(query: str, parsed: ParsedQuery) -> Optional[int]:
    q = _normalize_term(query)

    patterns = [
        r"\bunder\s+(\d{1,3})\s*(?:min|mins|minute|minutes)\b",
        r"\bwithin\s+(\d{1,3})\s*(?:min|mins|minute|minutes)\b",
        r"\bin\s+(\d{1,3})\s*(?:min|mins|minute|minutes)\b",
        r"\b(\d{1,3})\s*(?:min|mins|minute|minutes)\s+(?:meal|meals|dinner|lunch|breakfast|recipe|recipes)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, q)
        if match:
            try:
                minutes = int(match.group(1))
            except Exception:
                continue
            if 1 <= minutes <= 240:
                return minutes

    include = {_normalize_term(t) for t in (parsed.include_terms or [])}
    for term in include:
        match = re.search(r"(\d{1,3})\s*(?:min|mins|minute|minutes)", term)
        if match:
            minutes = int(match.group(1))
            if 1 <= minutes <= 240:
                return minutes
    return None


def _detect_nutrition_constraints(query: str, parsed: ParsedQuery) -> Dict[str, bool]:
    q = f" { _normalize_term(query) } "
    include = { _normalize_term(t) for t in (parsed.include_terms or []) }

    wants_high_protein = (
        " high protein " in q
        or " high-protein " in q
        or " protein rich " in q
        or "protein" in include and "high" in include
        or "high protein" in include
    )
    wants_low_carb = (
        " low carb " in q
        or " low-carb " in q
        or " low carbs " in q
        or " low carbohydrate " in q
        or " keto " in q
        or " keto-friendly " in q
        or "low carb" in include
        or "low carbohydrate" in include
    )
    wants_high_fiber = (
        " high fiber " in q
        or " high-fiber " in q
        or " fiber rich " in q
        or " fibre rich " in q
        or "fiber" in include and "high" in include
        or "high fiber" in include
    )
    wants_low_sodium = (
        " low sodium " in q
        or " low-sodium " in q
        or " low salt " in q
        or " low-salt " in q
        or " hypertension friendly " in q
        or " heart healthy " in q
        or "heart-healthy" in q
        or "low sodium" in include
        or "low salt" in include
    )
    wants_low_sugar = (
        " low sugar " in q
        or " low-sugar " in q
        or " sugar free " in q
        or " sugar-free " in q
        or " diabetic friendly " in q
        or " blood sugar friendly " in q
        or "low sugar" in include
        or "sugar free" in include
    )
    wants_high_sugar = (
        " high sugar " in q
        or " high-sugar " in q
        or " sugary " in q
        or " surgary " in q
        or " sugar rich " in q
        or " sugar-rich " in q
        or " sweetened " in q
        or "high sugar" in include
        or "sugary" in include
        or ("sugar" in include and "high" in include)
    )
    wants_gluten_free = (
        " gluten free " in q
        or " gluten-free " in q
        or " celiac " in q
        or " coeliac " in q
        or " celiac friendly " in q
        or " coeliac friendly " in q
        or "gluten free" in include
        or "gluten-free" in include
        or "celiac" in include
        or "coeliac" in include
    )

    # If multiple constraints are present, prefer AND matching.
    active_constraints = [
        wants_high_protein,
        wants_low_carb,
        wants_high_fiber,
        wants_low_sodium,
        wants_low_sugar,
        wants_high_sugar,
        wants_gluten_free,
    ]
    require_all_text_terms = sum(1 for c in active_constraints if c) > 1

    return {
        "high_protein": wants_high_protein,
        "low_carb": wants_low_carb,
        "high_fiber": wants_high_fiber,
        "low_sodium": wants_low_sodium,
        "low_sugar": wants_low_sugar,
        "high_sugar": wants_high_sugar,
        "gluten_free": wants_gluten_free,
        "require_all_text_terms": require_all_text_terms,
    }


def _collect_query_warnings(query: str) -> List[str]:
    q_norm = f" {_normalize_term(query)} "
    warnings: List[str] = []
    for token, message in _UNSUPPORTED_QUERY_HINTS.items():
        if f" {token} " in q_norm and message not in warnings:
            warnings.append(message)
    return warnings


def _get_mapped_ingredient_ids(db: Session, allergy_terms: Set[str], user: User) -> Set[int]:
    # Map using both:
    # - normalized user allergies via UserAllergy
    # - exact allergy names provided by the caller
    allergy_ids: Set[int] = set()

    rows = (
        db.query(UserAllergy.allergy_id)
        .filter(UserAllergy.user_id == user.id)
        .all()
    )
    for r in rows:
        if r and r[0]:
            allergy_ids.add(int(r[0]))

    if allergy_terms:
        clauses = [Allergy.name.ilike(t) for t in sorted(allergy_terms) if t]
        if clauses:
            term_rows = db.query(Allergy.id).filter(or_(*clauses)).all()
            for r in term_rows:
                if r and r[0]:
                    allergy_ids.add(int(r[0]))

    if not allergy_ids:
        return set()

    from app.models.allergy import AllergyIngredientMap

    mapped = (
        db.query(AllergyIngredientMap.ingredient_id)
        .filter(AllergyIngredientMap.allergy_id.in_(sorted(allergy_ids)))
        .all()
    )
    return {int(r[0]) for r in mapped if r and r[0]}


def _apply_allergy_exclusions(
    base_query,
    terms: Set[str],
    mapped_ingredient_ids: Set[int],
):
    if mapped_ingredient_ids:
        base_query = base_query.filter(
            ~Recipe.ingredients.any(
                RecipeIngredient.ingredient_id.in_(sorted(mapped_ingredient_ids))
            )
        )
    # Exclude recipes that have an ingredient name matching any allergy term.
    for t in sorted(terms):
        if not t:
            continue
        like = f"%{t}%"
        base_query = base_query.filter(
            ~Recipe.ingredients.any(
                RecipeIngredient.ingredient.has(Ingredient.name.ilike(like))
            )
        )
    return _exclude_recipe_text_terms(base_query, sorted(terms))


def _build_base_recipe_query(db: Session):
    return (
        db.query(Recipe, RecipeNutritionalInfo)
        .outerjoin(RecipeNutritionalInfo, RecipeNutritionalInfo.recipe_id == Recipe.id)
        .options(
            selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient)
        )
    )


def _fetch_results(db_query, limit: int) -> List[RecipeResult]:
    rows = db_query.limit(limit).all()
    out: List[RecipeResult] = []
    for recipe, nut in rows:
        calories = None
        if nut is not None and nut.calories is not None:
            calories = float(nut.calories)
        reasons: List[str] = []
        if nut is not None:
            if nut.protein_g is not None:
                reasons.append(f"protein_g={float(nut.protein_g):.1f}")
            if nut.carbs_g is not None:
                reasons.append(f"carbs_g={float(nut.carbs_g):.1f}")

        ingredients: List[str] = []
        ingredient_lines: List[str] = []
        try:
            for ri in recipe.ingredients or []:
                if ri.ingredient is not None and ri.ingredient.name:
                    ingredients.append(ri.ingredient.name)
                    qty = (ri.notes or "").strip() if getattr(ri, "notes", None) else ""
                    ingredient_lines.append(f"{qty} {ri.ingredient.name}".strip())
        except Exception:
            ingredients = []
            ingredient_lines = []

        prep_time = recipe.prep_time
        cook_time = recipe.cook_time
        total_time = None
        if isinstance(prep_time, int) and isinstance(cook_time, int):
            total_time = prep_time + cook_time
        elif isinstance(prep_time, int):
            total_time = prep_time
        elif isinstance(cook_time, int):
            total_time = cook_time

        out.append(
            RecipeResult(
                id=recipe.id,
                name=recipe.name,
                description=recipe.description,
                calories=calories,
                image_url=recipe.image_url,
                prep_time=prep_time,
                cook_time=cook_time,
                total_time=total_time,
                servings=recipe.servings,
                cuisine_type=(recipe.cuisine_type.value if recipe.cuisine_type is not None else None),
                protein_g=(float(nut.protein_g) if nut is not None and nut.protein_g is not None else None),
                carbs_g=(float(nut.carbs_g) if nut is not None and nut.carbs_g is not None else None),
                fat_g=(float(nut.fat_g) if nut is not None and nut.fat_g is not None else None),
                fiber_g=(float(nut.fiber_g) if nut is not None and nut.fiber_g is not None else None),
                sugar_g=(float(nut.sugar_g) if nut is not None and nut.sugar_g is not None else None),
                sodium_mg=(float(nut.sodium_mg) if nut is not None and nut.sodium_mg is not None else None),
                ingredient_lines=ingredient_lines,
                ingredients=ingredients,
                instructions=recipe.instructions,
                reasons=reasons,
            )
        )
    return out


def _score_recipe_text(recipe: Recipe, terms: List[str]) -> Tuple[int, int, int, int]:
    if not terms:
        return 0, 0, 0, 0

    name_text = (recipe.name or "").lower()
    desc_text = (recipe.description or "").lower() if recipe.description else ""
    instr_text = (recipe.instructions or "").lower()

    name_hits = 0
    desc_hits = 0
    instr_hits = 0
    for t in terms:
        tt = (t or "").strip().lower()
        if not tt:
            continue
        if tt in name_text:
            name_hits += 1
        elif tt in desc_text:
            desc_hits += 1
        elif tt in instr_text:
            instr_hits += 1

    score = (name_hits * 5) + (desc_hits * 2) + instr_hits
    return score, name_hits, desc_hits, instr_hits


def _fetch_ranked_results(db_query, limit: int, terms: List[str]) -> List[RecipeResult]:
    if not terms:
        return _fetch_results(db_query, limit)

    fetch_limit = max(limit * 50, 500)
    fetch_limit = min(fetch_limit, 2000)

    rows = db_query.limit(fetch_limit).all()
    scored: List[Tuple[int, int, int, int, Recipe, Optional[RecipeNutritionalInfo]]] = []
    for recipe, nut in rows:
        score, name_hits, desc_hits, instr_hits = _score_recipe_text(recipe, terms)
        scored.append((score, name_hits, desc_hits, instr_hits, recipe, nut))

    scored.sort(key=lambda x: (-x[0], -x[1], -x[2], x[4].id))

    out: List[RecipeResult] = []
    for score, name_hits, desc_hits, instr_hits, recipe, nut in scored[:limit]:
        calories = None
        if nut is not None and nut.calories is not None:
            calories = float(nut.calories)
        reasons: List[str] = [f"score={score}"]
        if name_hits:
            reasons.append(f"name_matches={name_hits}")
        if desc_hits:
            reasons.append(f"desc_matches={desc_hits}")
        if instr_hits:
            reasons.append(f"instr_matches={instr_hits}")
        if nut is not None:
            if nut.protein_g is not None:
                reasons.append(f"protein_g={float(nut.protein_g):.1f}")
            if nut.carbs_g is not None:
                reasons.append(f"carbs_g={float(nut.carbs_g):.1f}")

        ingredients: List[str] = []
        ingredient_lines: List[str] = []
        try:
            for ri in recipe.ingredients or []:
                if ri.ingredient is not None and ri.ingredient.name:
                    ingredients.append(ri.ingredient.name)
                    qty = (ri.notes or "").strip() if getattr(ri, "notes", None) else ""
                    ingredient_lines.append(f"{qty} {ri.ingredient.name}".strip())
        except Exception:
            ingredients = []
            ingredient_lines = []

        prep_time = recipe.prep_time
        cook_time = recipe.cook_time
        total_time = None
        if isinstance(prep_time, int) and isinstance(cook_time, int):
            total_time = prep_time + cook_time
        elif isinstance(prep_time, int):
            total_time = prep_time
        elif isinstance(cook_time, int):
            total_time = cook_time

        out.append(
            RecipeResult(
                id=recipe.id,
                name=recipe.name,
                description=recipe.description,
                calories=calories,
                image_url=recipe.image_url,
                prep_time=prep_time,
                cook_time=cook_time,
                total_time=total_time,
                servings=recipe.servings,
                cuisine_type=(recipe.cuisine_type.value if recipe.cuisine_type is not None else None),
                protein_g=(float(nut.protein_g) if nut is not None and nut.protein_g is not None else None),
                carbs_g=(float(nut.carbs_g) if nut is not None and nut.carbs_g is not None else None),
                fat_g=(float(nut.fat_g) if nut is not None and nut.fat_g is not None else None),
                fiber_g=(float(nut.fiber_g) if nut is not None and nut.fiber_g is not None else None),
                sugar_g=(float(nut.sugar_g) if nut is not None and nut.sugar_g is not None else None),
                sodium_mg=(float(nut.sodium_mg) if nut is not None and nut.sodium_mg is not None else None),
                ingredient_lines=ingredient_lines,
                ingredients=ingredients,
                instructions=recipe.instructions,
                reasons=reasons,
            )
        )

    return out


def search_nl(db: Session, user: User, query: str, limit: int) -> Tuple[ParsedQuery, Dict[str, Any], List[RecipeResult]]:
    parsed = parse_query(query)
    wants_vegan = _wants_vegan(query, parsed)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    bmi = compute_bmi(profile)

    # Apply user's dietary restrictions from profile if present
    if profile and profile.dietary_restrictions:
        dr = profile.dietary_restrictions
        if isinstance(dr, str):
            try:
                dr = json.loads(dr)
            except Exception:
                dr = []
        if isinstance(dr, list):
            if "vegetarian" in dr and parsed.diet is None:
                parsed.diet = DietType.VEG
            if "vegan" in dr and parsed.diet is None:
                parsed.diet = DietType.VEG
                wants_vegan = True

    selected_allergy_terms = _get_user_allergy_terms(db, user)
    explicit_exclude_terms = {_normalize_term(t) for t in parsed.exclude_terms if t}
    allergy_terms = expand_allergy_terms(selected_allergy_terms)
    allergy_terms |= expand_allergy_terms(
        explicit_exclude_terms,
        include_catalog_aliases=False,
    )

    mapped_ingredient_ids = _get_mapped_ingredient_ids(db, selected_allergy_terms, user)

    q_norm = _normalize_term(query)
    q_tokens = set(re.findall(r"[a-zA-Z]{3,}", q_norm))
    warnings: List[str] = _collect_query_warnings(query)
    for a in sorted(selected_allergy_terms):
        syns = get_allergy_aliases(a)
        for s in syns:
            st = _normalize_term(s)
            if not st:
                continue
            if st in q_tokens or f" {st} " in f" {q_norm} ":
                warnings.append(f"Query seems to include '{st}' but you have selected allergy '{a}', so relevant recipes may be excluded.")
                break
    warnings = list(dict.fromkeys(warnings))

    constraints = _detect_nutrition_constraints(query, parsed)
    time_limit_minutes = _extract_time_limit_minutes(query, parsed)

    applied: Dict[str, Any] = {
        "parsed": parsed.dict(),
        "bmi": bmi,
        "bmi_cutoff": _BMI_LOW_CAL_CUTOFF,
        "default_activity": "sedentary",
        "selected_allergies": sorted(selected_allergy_terms),
        "allergy_terms": sorted(allergy_terms),
        "mapped_ingredient_ids": sorted(mapped_ingredient_ids),
        "warnings": warnings,
        "nutrition": {
            "high_protein": bool(constraints.get("high_protein")),
            "low_carb": bool(constraints.get("low_carb")),
            "high_fiber": bool(constraints.get("high_fiber")),
            "low_sodium": bool(constraints.get("low_sodium")),
            "low_sugar": bool(constraints.get("low_sugar")),
            "high_sugar": bool(constraints.get("high_sugar")),
            "gluten_free": bool(constraints.get("gluten_free")),
            "high_protein_min_g": _HIGH_PROTEIN_MIN_G,
            "low_carb_max_g": _LOW_CARB_MAX_G,
            "high_fiber_min_g": _HIGH_FIBER_MIN_G,
            "low_sodium_max_mg": _LOW_SODIUM_MAX_MG,
            "low_sugar_max_g": _LOW_SUGAR_MAX_G,
            "high_sugar_min_g": _HIGH_SUGAR_MIN_G,
        },
        "time_max_minutes": time_limit_minutes,
    }

    search_terms = _extract_search_terms(query, parsed)
    # Never use exclusions as positive search terms.
    search_terms = [t for t in search_terms if _normalize_term(t) not in allergy_terms]

    # If we detected nutrition constraints, don't let generic nutrition words become
    # required text terms (otherwise we'd filter out valid results that don't literally
    # contain the word 'protein' or 'carb' in the recipe text).
    if constraints.get("high_protein"):
        search_terms = [t for t in search_terms if t not in {"protein", "proteins"}]
    if constraints.get("low_carb"):
        search_terms = [t for t in search_terms if t not in {"carb", "carbs", "carbohydrate", "carbohydrates", "keto"}]
    if constraints.get("high_fiber"):
        search_terms = [t for t in search_terms if t not in {"fiber", "fibre", "gut", "healthy"}]
    if constraints.get("low_sodium"):
        search_terms = [t for t in search_terms if t not in {"sodium", "salt", "heart", "healthy", "hypertension"}]
    if constraints.get("low_sugar"):
        search_terms = [t for t in search_terms if t not in {"sugar", "diabetic", "blood"}]
    if constraints.get("high_sugar"):
        search_terms = [
            t
            for t in search_terms
            if t not in {"sugar", "sugary", "surgary", "sweet", "sweetened"}
        ]
    if constraints.get("gluten_free"):
        search_terms = [
            t
            for t in search_terms
            if t not in {"gluten", "free", "glutenfree", "celiac", "coeliac"}
        ]
    if time_limit_minutes is not None:
        search_terms = [t for t in search_terms if t not in {"minute", "minutes", "mins", "quick"}]

    applied["search_terms"] = search_terms

    # Soft enforcement: if BMI is high and user did NOT explicitly ask for high calorie,
    # prioritize low then medium.
    preferred_buckets: List[CalorieBucket] = []
    if bmi is not None and bmi > _BMI_LOW_CAL_CUTOFF and not parsed.wants_high_calorie:
        preferred_buckets = [CalorieBucket.LOW, CalorieBucket.MEDIUM]
    elif parsed.calorie_bucket is not None:
        preferred_buckets = [parsed.calorie_bucket]
    else:
        preferred_buckets = []

    results: List[RecipeResult] = []
    seen: Set[int] = set()

    def run_once(
        bucket: Optional[CalorieBucket],
        *,
        high_protein: bool = False,
        low_carb: bool = False,
        high_fiber: bool = False,
        low_sodium: bool = False,
        low_sugar: bool = False,
        high_sugar: bool = False,
        gluten_free: bool = False,
        require_all_text_terms: bool = False,
    ) -> List[RecipeResult]:
        q0 = _build_base_recipe_query(db)

        # Diet filter
        if parsed.diet == DietType.VEG:
            q0 = q0.filter(Recipe.is_vegetarian.is_(True))
            non_veg_terms = [
                "egg",
                "eggs",
                "chicken",
                "beef",
                "steak",
                "pork",
                "mutton",
                "lamb",
                "fish",
                "shrimp",
                "prawn",
                "bacon",
                "ham",
            ]
            q0 = _exclude_ingredient_terms(q0, non_veg_terms)
            q0 = _exclude_recipe_text_terms(q0, non_veg_terms)
            if wants_vegan:
                non_vegan_terms = [
                    "milk",
                    "dairy",
                    "cheese",
                    "butter",
                    "cream",
                    "yogurt",
                    "paneer",
                    "ghee",
                    "honey",
                ]
                q0 = _exclude_ingredient_terms(q0, non_vegan_terms)
                q0 = _exclude_recipe_text_terms(q0, non_vegan_terms)
        elif parsed.diet == DietType.NON_VEG:
            q0 = q0.filter(
                (Recipe.is_vegetarian.is_(False)) | (Recipe.is_vegetarian.is_(None))
            )

        # Text search: only apply if we extracted meaningful terms.
        q0 = _apply_text_search_terms(q0, search_terms, require_all=require_all_text_terms)

        # Allergy / exclusions
        q0 = _apply_allergy_exclusions(q0, allergy_terms, mapped_ingredient_ids)

        # Nutrition constraints
        if high_protein:
            q0 = q0.filter(RecipeNutritionalInfo.protein_g >= _HIGH_PROTEIN_MIN_G)
        if low_carb:
            q0 = q0.filter(RecipeNutritionalInfo.carbs_g <= _LOW_CARB_MAX_G)
        if high_fiber:
            q0 = q0.filter(RecipeNutritionalInfo.fiber_g >= _HIGH_FIBER_MIN_G)
        if low_sodium:
            q0 = q0.filter(RecipeNutritionalInfo.sodium_mg <= _LOW_SODIUM_MAX_MG)
        if low_sugar:
            q0 = q0.filter(RecipeNutritionalInfo.sugar_g <= _LOW_SUGAR_MAX_G)
        if high_sugar:
            q0 = q0.filter(RecipeNutritionalInfo.sugar_g >= _HIGH_SUGAR_MIN_G)
        if gluten_free:
            q0 = q0.filter(Recipe.is_gluten_free.is_(True))
            gluten_ingredient_terms = [
                "wheat",
                "gluten",
                "barley",
                "rye",
                "malt",
                "all-purpose flour",
                "bread flour",
                "wheat flour",
            ]
            q0 = _exclude_ingredient_terms(q0, gluten_ingredient_terms)
            q0 = _exclude_recipe_text_terms(
                q0,
                ["all-purpose flour", "bread flour", "wheat flour"],
            )
        if time_limit_minutes is not None:
            q0 = q0.filter(
                ((Recipe.prep_time + Recipe.cook_time) <= time_limit_minutes)
                | ((Recipe.prep_time.is_(None)) & (Recipe.cook_time <= time_limit_minutes))
                | ((Recipe.cook_time.is_(None)) & (Recipe.prep_time <= time_limit_minutes))
            )

        # Calorie bucket filter
        if bucket is not None:
            if bucket == CalorieBucket.LOW:
                q0 = q0.filter(RecipeNutritionalInfo.calories < _LOW_MAX)
            elif bucket == CalorieBucket.MEDIUM:
                q0 = q0.filter(
                    (RecipeNutritionalInfo.calories >= _LOW_MAX)
                    & (RecipeNutritionalInfo.calories <= _MEDIUM_MAX)
                )
            elif bucket == CalorieBucket.HIGH:
                q0 = q0.filter(RecipeNutritionalInfo.calories > _MEDIUM_MAX)

        q0 = q0.order_by(Recipe.id.asc())
        return _fetch_ranked_results(q0, limit, search_terms)

    # When user asks for multiple constraints like "high protein low carb", prefer
    # matching BOTH first, then gracefully relax.
    attempts: List[Tuple[bool, bool, bool, bool, bool, bool, bool, bool, str]] = []
    wants_hp = bool(constraints.get("high_protein"))
    wants_lc = bool(constraints.get("low_carb"))
    wants_hf = bool(constraints.get("high_fiber"))
    wants_lsod = bool(constraints.get("low_sodium"))
    wants_lsug = bool(constraints.get("low_sugar"))
    wants_hsug = bool(constraints.get("high_sugar"))
    wants_gf = bool(constraints.get("gluten_free"))
    wants_all = bool(constraints.get("require_all_text_terms"))
    requested_count = sum(1 for c in [wants_hp, wants_lc, wants_hf, wants_lsod, wants_lsug, wants_hsug, wants_gf] if c)
    if requested_count:
        attempts.append((wants_hp, wants_lc, wants_hf, wants_lsod, wants_lsug, wants_hsug, wants_gf, wants_all, "all_requested"))
        if requested_count > 1:
            if wants_hp:
                attempts.append((True, False, False, False, False, False, False, False, "high_protein_only"))
            if wants_lc:
                attempts.append((False, True, False, False, False, False, False, False, "low_carb_only"))
            if wants_hf:
                attempts.append((False, False, True, False, False, False, False, False, "high_fiber_only"))
            if wants_lsod:
                attempts.append((False, False, False, True, False, False, False, False, "low_sodium_only"))
            if wants_lsug:
                attempts.append((False, False, False, False, True, False, False, False, "low_sugar_only"))
            if wants_hsug:
                attempts.append((False, False, False, False, False, True, False, False, "high_sugar_only"))
            if wants_gf:
                attempts.append((False, False, False, False, False, False, True, False, "gluten_free_only"))
    else:
        attempts.append((False, False, False, False, False, False, False, False, "no_nutrition"))

    used_attempt: Optional[str] = None

    for hp, lc, hf, lsod, lsug, hsug, gf, req_all, label in attempts:
        if len(results) >= limit:
            break

        before_count = len(results)
        if preferred_buckets:
            for b in preferred_buckets:
                for r in run_once(
                    b,
                    high_protein=hp,
                    low_carb=lc,
                    high_fiber=hf,
                    low_sodium=lsod,
                    low_sugar=lsug,
                    high_sugar=hsug,
                    gluten_free=gf,
                    require_all_text_terms=req_all,
                ):
                    if r.id in seen:
                        continue
                    r.reasons.append(f"calorie_bucket={_calorie_bucket_for_recipe(r.calories)}")
                    if hp:
                        r.reasons.append("constraint=high_protein")
                    if lc:
                        r.reasons.append("constraint=low_carb")
                    if hf:
                        r.reasons.append("constraint=high_fiber")
                    if lsod:
                        r.reasons.append("constraint=low_sodium")
                    if lsug:
                        r.reasons.append("constraint=low_sugar")
                    if hsug:
                        r.reasons.append("constraint=high_sugar")
                    if gf:
                        r.reasons.append("constraint=gluten_free")
                    if time_limit_minutes is not None:
                        r.reasons.append(f"constraint=max_time_{time_limit_minutes}m")
                    if bmi is not None and bmi > _BMI_LOW_CAL_CUTOFF and not parsed.wants_high_calorie:
                        r.reasons.append("bmi_high_prioritized_low")
                    results.append(r)
                    seen.add(r.id)
                    if len(results) >= limit:
                        break
                if len(results) >= limit:
                    break

        # If still not enough results, run without calorie bucket restriction.
        if len(results) < limit:
            for r in run_once(
                None,
                high_protein=hp,
                low_carb=lc,
                high_fiber=hf,
                low_sodium=lsod,
                low_sugar=lsug,
                high_sugar=hsug,
                gluten_free=gf,
                require_all_text_terms=req_all,
            ):
                if r.id in seen:
                    continue
                if hp:
                    r.reasons.append("constraint=high_protein")
                if lc:
                    r.reasons.append("constraint=low_carb")
                if hf:
                    r.reasons.append("constraint=high_fiber")
                if lsod:
                    r.reasons.append("constraint=low_sodium")
                if lsug:
                    r.reasons.append("constraint=low_sugar")
                if hsug:
                    r.reasons.append("constraint=high_sugar")
                if gf:
                    r.reasons.append("constraint=gluten_free")
                if time_limit_minutes is not None:
                    r.reasons.append(f"constraint=max_time_{time_limit_minutes}m")
                if label != "no_nutrition":
                    r.reasons.append(f"fallback_attempt={label}")
                results.append(r)
                seen.add(r.id)
                if len(results) >= limit:
                    break

        if len(results) > before_count and used_attempt is None:
            used_attempt = label

    if used_attempt and used_attempt != "all_requested" and requested_count > 1:
        warnings.append(
            "No recipes matched all requested nutrition constraints. Showing best available matches."
        )

    return parsed, applied, results
