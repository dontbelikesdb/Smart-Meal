from __future__ import annotations

import re
from typing import Dict, Iterable, List, Set, Tuple


_DEFAULT_ALLERGY_CATALOG: Dict[str, Dict[str, object]] = {
    "milk": {
        "description": "Dairy / milk proteins",
        "aliases": [
            "milk",
            "dairy",
            "cheese",
            "butter",
            "cream",
            "yogurt",
            "yoghurt",
            "paneer",
            "curd",
            "ghee",
            "whey",
            "casein",
            "buttermilk",
        ],
    },
    "egg": {
        "description": "Eggs and egg products",
        "aliases": [
            "egg",
            "eggs",
            "egg white",
            "egg yolk",
            "mayonnaise",
            "mayo",
            "meringue",
        ],
    },
    "chicken": {
        "description": "Chicken and chicken products",
        "aliases": [
            "chicken",
            "chicken breast",
            "chicken thigh",
            "chicken thighs",
            "chicken wing",
            "chicken wings",
            "chicken stock",
            "chicken broth",
        ],
    },
    "peanut": {
        "description": "Peanuts and peanut products",
        "aliases": [
            "peanut",
            "peanuts",
            "peanut butter",
            "groundnut",
            "groundnuts",
        ],
    },
    "tree nut": {
        "description": "Almonds, cashews, walnuts, etc.",
        "aliases": [
            "tree nut",
            "tree nuts",
            "almond",
            "almonds",
            "cashew",
            "cashews",
            "walnut",
            "walnuts",
            "pistachio",
            "pistachios",
            "pecan",
            "pecans",
            "hazelnut",
            "hazelnuts",
            "macadamia",
            "macadamias",
            "brazil nut",
            "brazil nuts",
            "pine nut",
            "pine nuts",
        ],
    },
    "soy": {
        "description": "Soybeans and soy products",
        "aliases": [
            "soy",
            "soya",
            "soybean",
            "soybeans",
            "tofu",
            "edamame",
            "miso",
            "tempeh",
            "soy sauce",
            "tamari",
        ],
    },
    "wheat": {
        "description": "Wheat and wheat products",
        "aliases": [
            "wheat",
            "flour",
            "whole wheat",
            "atta",
            "semolina",
            "durum",
            "farina",
            "bulgur",
        ],
    },
    "gluten": {
        "description": "Gluten-containing grains",
        "aliases": [
            "gluten",
            "barley",
            "rye",
            "malt",
            "seitan",
        ],
    },
    "fish": {
        "description": "Fish and fish products",
        "aliases": [
            "fish",
            "salmon",
            "tuna",
            "cod",
            "tilapia",
            "halibut",
            "trout",
            "anchovy",
            "anchovies",
            "sardine",
            "sardines",
            "mackerel",
            "haddock",
            "snapper",
            "mahi mahi",
            "eel",
            "bonito",
            "fish sauce",
        ],
    },
    "shellfish": {
        "description": "Shrimp, crab, lobster, etc.",
        "aliases": [
            "shellfish",
            "shrimp",
            "shrimps",
            "prawn",
            "prawns",
            "crab",
            "crabs",
            "lobster",
            "lobsters",
            "crawfish",
            "crayfish",
            "oyster",
            "oysters",
            "mussel",
            "mussels",
            "clam",
            "clams",
            "scallop",
            "scallops",
            "calamari",
            "squid",
            "octopus",
        ],
    },
    "sesame": {
        "description": "Sesame and sesame products",
        "aliases": [
            "sesame",
            "sesame seed",
            "sesame seeds",
            "tahini",
            "sesame oil",
        ],
    },
    "tomato": {
        "description": "Tomatoes and tomato-based products",
        "aliases": [
            "tomato",
            "tomatoes",
            "tomato sauce",
            "tomato paste",
            "tomato puree",
            "passata",
            "marinara",
            "ketchup",
            "sun-dried tomato",
            "sun dried tomato",
            "cherry tomato",
            "cherry tomatoes",
        ],
    },
    "olive": {
        "description": "Olives and olive-based products",
        "aliases": [
            "olive",
            "olives",
            "olive oil",
            "black olive",
            "green olive",
            "tapenade",
        ],
    },
    "corn": {
        "description": "Corn / maize ingredients",
        "aliases": [
            "corn",
            "maize",
            "cornmeal",
            "corn flour",
            "cornstarch",
            "polenta",
            "popcorn",
            "corn syrup",
        ],
    },
    "coconut": {
        "description": "Coconut and coconut-based products",
        "aliases": [
            "coconut",
            "coconut milk",
            "coconut cream",
            "coconut oil",
            "desiccated coconut",
        ],
    },
    "mustard": {
        "description": "Mustard seeds and prepared mustard",
        "aliases": [
            "mustard",
            "mustard seed",
            "mustard seeds",
            "dijon",
            "yellow mustard",
        ],
    },
    "celery": {
        "description": "Celery and celery-derived ingredients",
        "aliases": [
            "celery",
            "celery salt",
            "celeriac",
        ],
    },
    "garlic": {
        "description": "Garlic and garlic-based ingredients",
        "aliases": [
            "garlic",
            "garlic powder",
            "garlic paste",
            "garlic cloves",
        ],
    },
    "onion": {
        "description": "Onion and onion-family ingredients",
        "aliases": [
            "onion",
            "onions",
            "shallot",
            "shallots",
            "scallion",
            "scallions",
            "green onion",
            "green onions",
            "spring onion",
            "spring onions",
            "leek",
            "leeks",
        ],
    },
    "mushroom": {
        "description": "Mushrooms and mushroom varieties",
        "aliases": [
            "mushroom",
            "mushrooms",
            "shiitake",
            "portobello",
            "cremini",
            "button mushroom",
            "button mushrooms",
        ],
    },
    "chickpea": {
        "description": "Chickpeas / garbanzo-based ingredients",
        "aliases": [
            "chickpea",
            "chickpeas",
            "garbanzo",
            "garbanzos",
            "garbanzo bean",
            "garbanzo beans",
            "hummus",
            "besan",
        ],
    },
}


def _normalize_term(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def _basic_variants(term: str) -> Set[str]:
    normalized = _normalize_term(term)
    if not normalized:
        return set()

    out = {normalized}
    if normalized.endswith("ies") and len(normalized) > 4:
        out.add(f"{normalized[:-3]}y")
    elif normalized.endswith("oes") and len(normalized) > 4:
        out.add(normalized[:-2])
    elif normalized.endswith("ves") and len(normalized) > 4:
        out.add(normalized[:-1])
    elif normalized.endswith("s") and len(normalized) > 3:
        out.add(normalized[:-1])
    elif not normalized.endswith("s"):
        out.add(f"{normalized}s")
    return {item for item in out if item}


def get_default_allergies() -> List[Tuple[str, str | None]]:
    return [
        (name, str(defn.get("description") or "") or None)
        for name, defn in _DEFAULT_ALLERGY_CATALOG.items()
    ]


def get_allergy_aliases(name: str) -> List[str]:
    normalized = _normalize_term(name)
    if not normalized:
        return []

    raw_terms: List[str] = [normalized]
    entry = _DEFAULT_ALLERGY_CATALOG.get(normalized)
    if entry is not None:
        raw_terms.extend(str(item) for item in entry.get("aliases", []) if item)

    seen: Set[str] = set()
    out: List[str] = []
    for raw in raw_terms:
        for variant in sorted(_basic_variants(raw)):
            if variant in seen:
                continue
            seen.add(variant)
            out.append(variant)
    return out


def expand_allergy_terms(
    terms: Iterable[str],
    *,
    include_catalog_aliases: bool = True,
) -> Set[str]:
    expanded: Set[str] = set()
    for raw in terms:
        normalized = _normalize_term(raw)
        if not normalized:
            continue
        expanded.update(_basic_variants(normalized))
        if include_catalog_aliases:
            expanded.update(get_allergy_aliases(normalized))
    return {term for term in expanded if term}
