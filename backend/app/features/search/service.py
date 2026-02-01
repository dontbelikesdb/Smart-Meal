import json
import re
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.allergy import Allergy, UserAllergy
from app.models.ingredient import Ingredient, RecipeIngredient
from app.models.profile import UserProfile
from app.models.recipe import Recipe, RecipeNutritionalInfo
from app.models.user import User

from .schemas import CalorieBucket, DietType, ParsedQuery, RecipeResult


_LOW_MAX = 400.0
_MEDIUM_MAX = 700.0
_BMI_LOW_CAL_CUTOFF = 22.9

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
    # Try to locate the first JSON object in the text.
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    snippet = text[start : end + 1]
    try:
        return json.loads(snippet)
    except Exception:
        return None


def parse_query(query: str) -> ParsedQuery:
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    model_name = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")

    if not api_key:
        return _fallback_parse(query)

    try:
        import google.generativeai as genai  # type: ignore
    except Exception:
        return _fallback_parse(query)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)

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

        resp = model.generate_content(prompt)
        raw = getattr(resp, "text", "") or ""
        data = _try_parse_json_from_text(raw)
        if not isinstance(data, dict):
            return _fallback_parse(query)

        return ParsedQuery(
            diet=data.get("diet"),
            calorie_bucket=data.get("calorie_bucket"),
            include_terms=list(data.get("include_terms") or []),
            exclude_terms=list(data.get("exclude_terms") or []),
            wants_high_calorie=bool(data.get("wants_high_calorie") or False),
        )
    except Exception:
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


def _apply_text_search_terms(base_query, terms: List[str]):
    # Make text filtering lenient: match ANY term across name/description/instructions.
    if not terms:
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


def _get_mapped_ingredient_ids(db: Session, allergy_terms: Set[str], user: User) -> Set[int]:
    # Map using both:
    # - normalized user allergies via UserAllergy
    # - ad-hoc terms (e.g. "no peanuts") matched to Allergy.name
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
    return base_query


def _build_base_recipe_query(db: Session):
    return (
        db.query(Recipe, RecipeNutritionalInfo)
        .outerjoin(RecipeNutritionalInfo, RecipeNutritionalInfo.recipe_id == Recipe.id)
    )


def _fetch_results(db_query, limit: int) -> List[RecipeResult]:
    rows = db_query.limit(limit).all()
    out: List[RecipeResult] = []
    for recipe, nut in rows:
        calories = None
        if nut is not None and nut.calories is not None:
            calories = float(nut.calories)
        out.append(RecipeResult(id=recipe.id, name=recipe.name, calories=calories, reasons=[]))
    return out


def search_nl(db: Session, user: User, query: str, limit: int) -> Tuple[ParsedQuery, Dict[str, Any], List[RecipeResult]]:
    parsed = parse_query(query)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    bmi = compute_bmi(profile)

    allergy_terms = _get_user_allergy_terms(db, user)
    # Merge explicit "exclude" terms from query into allergy terms.
    allergy_terms |= {_normalize_term(t) for t in parsed.exclude_terms if t}
    # Expand simple plural variants so "peanuts" can match ingredient "peanut".
    expanded_allergy_terms: Set[str] = set(allergy_terms)
    for t in list(allergy_terms):
        if t.endswith("s") and len(t) > 3:
            expanded_allergy_terms.add(t[:-1])
    allergy_terms = expanded_allergy_terms

    mapped_ingredient_ids = _get_mapped_ingredient_ids(db, allergy_terms, user)

    applied: Dict[str, Any] = {
        "parsed": parsed.dict(),
        "bmi": bmi,
        "bmi_cutoff": _BMI_LOW_CAL_CUTOFF,
        "default_activity": "sedentary",
        "allergy_terms": sorted(allergy_terms),
        "mapped_ingredient_ids": sorted(mapped_ingredient_ids),
    }

    search_terms = _extract_search_terms(query, parsed)
    # Never use exclusions as positive search terms.
    search_terms = [t for t in search_terms if _normalize_term(t) not in allergy_terms]
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

    def run_once(bucket: Optional[CalorieBucket]) -> List[RecipeResult]:
        q0 = _build_base_recipe_query(db)

        # Diet filter
        if parsed.diet == DietType.VEG:
            q0 = q0.filter(Recipe.is_vegetarian.is_(True))
        elif parsed.diet == DietType.NON_VEG:
            q0 = q0.filter(
                (Recipe.is_vegetarian.is_(False)) | (Recipe.is_vegetarian.is_(None))
            )

        # Text search: only apply if we extracted meaningful terms.
        q0 = _apply_text_search_terms(q0, search_terms)

        # Allergy / exclusions
        q0 = _apply_allergy_exclusions(q0, allergy_terms, mapped_ingredient_ids)

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
        return _fetch_results(q0, limit)

    if preferred_buckets:
        for b in preferred_buckets:
            for r in run_once(b):
                if r.id in seen:
                    continue
                r.reasons.append(f"calorie_bucket={_calorie_bucket_for_recipe(r.calories)}")
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
        for r in run_once(None):
            if r.id in seen:
                continue
            r.reasons.append("fallback_no_bucket")
            results.append(r)
            seen.add(r.id)
            if len(results) >= limit:
                break

    return parsed, applied, results
