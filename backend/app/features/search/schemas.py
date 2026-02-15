from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CalorieBucket(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DietType(str, Enum):
    VEG = "veg"
    NON_VEG = "non_veg"


class SearchNLRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(10, ge=1, le=50)


class ParsedQuery(BaseModel):
    diet: Optional[DietType] = None
    calorie_bucket: Optional[CalorieBucket] = None
    include_terms: List[str] = []
    exclude_terms: List[str] = []
    wants_high_calorie: bool = False


class RecipeResult(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    calories: Optional[float] = None
    image_url: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    total_time: Optional[int] = None
    servings: Optional[int] = None
    cuisine_type: Optional[str] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    ingredient_lines: List[str] = []
    ingredients: List[str] = []
    instructions: Optional[str] = None
    reasons: List[str] = []


class SearchResponse(BaseModel):
    applied: Dict[str, Any]
    results: List[RecipeResult]
