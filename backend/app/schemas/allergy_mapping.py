from typing import Optional

from pydantic import BaseModel, Field


class AllergyCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None


class AllergyOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class AllergyIngredientMapCreate(BaseModel):
    ingredient_id: Optional[int] = None
    ingredient_name: Optional[str] = None


class MappedIngredientOut(BaseModel):
    ingredient_id: int
    ingredient_name: str


class AutoMapResponse(BaseModel):
    allergy_id: int
    mapped_count: int
    ingredient_ids: list[int]


class UserAllergySet(BaseModel):
    allergy_ids: list[int] = Field(default_factory=list)
