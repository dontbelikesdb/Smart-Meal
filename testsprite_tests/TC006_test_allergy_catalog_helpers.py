from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.allergy_catalog import expand_allergy_terms, get_allergy_aliases


def test_fish_aliases_include_common_species():
    aliases = set(get_allergy_aliases("fish"))
    assert "fish" in aliases
    assert "tuna" in aliases
    assert "salmon" in aliases
    assert "anchovy" in aliases


def test_basic_exclusion_expansion_keeps_direct_ingredient_scope():
    expanded = expand_allergy_terms(["olives", "tomatoes"], include_catalog_aliases=False)
    assert "olive" in expanded
    assert "olives" in expanded
    assert "tomato" in expanded
    assert "tomatoes" in expanded
    assert "oliv" not in expanded
    assert "tomatoe" not in expanded
    assert "olive oil" not in expanded


def test_catalog_expansion_adds_related_ingredient_terms():
    expanded = expand_allergy_terms(["olive", "tomato"])
    assert "olive oil" in expanded
    assert "ketchup" in expanded
    assert "tomato sauce" in expanded
