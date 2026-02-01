from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import dependencies as deps
from app.db.session import get_db
from app.models.allergy import Allergy
from app.models.ingredient import Ingredient
from app.schemas.allergy_mapping import (
    AllergyCreate,
    AllergyIngredientMapCreate,
    AllergyOut,
    AutoMapResponse,
    MappedIngredientOut,
)


router = APIRouter()


@router.get("/", response_model=List[AllergyOut])
def list_allergies(
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
) -> Any:
    return db.query(Allergy).order_by(Allergy.name.asc()).all()


@router.post("/", response_model=AllergyOut)
def create_allergy(
    payload: AllergyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_superuser),
) -> Any:
    existing = db.query(Allergy).filter(Allergy.name.ilike(payload.name)).first()
    if existing is not None:
        return existing

    obj = Allergy(name=payload.name.strip(), description=payload.description)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{allergy_id}/mapped-ingredients", response_model=List[MappedIngredientOut])
def list_mapped_ingredients(
    allergy_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
) -> Any:
    allergy = db.get(Allergy, allergy_id)
    if allergy is None:
        raise HTTPException(status_code=404, detail="Allergy not found")

    out: list[MappedIngredientOut] = []
    for m in allergy.ingredient_mappings:
        if m.ingredient is None:
            continue
        out.append(MappedIngredientOut(ingredient_id=m.ingredient_id, ingredient_name=m.ingredient.name))
    return out


@router.post("/{allergy_id}/map-ingredient", response_model=List[MappedIngredientOut])
def map_ingredient(
    allergy_id: int,
    payload: AllergyIngredientMapCreate,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_superuser),
) -> Any:
    allergy = db.get(Allergy, allergy_id)
    if allergy is None:
        raise HTTPException(status_code=404, detail="Allergy not found")

    if payload.ingredient_id is None and not payload.ingredient_name:
        raise HTTPException(status_code=422, detail="Provide ingredient_id or ingredient_name")

    ingredient: Ingredient | None = None
    if payload.ingredient_id is not None:
        ingredient = db.get(Ingredient, payload.ingredient_id)
    else:
        ingredient = (
            db.query(Ingredient)
            .filter(Ingredient.name.ilike(payload.ingredient_name.strip()))
            .order_by(Ingredient.id.asc())
            .first()
        )

    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    allergy.add_ingredient_mapping(db=db, ingredient_id=ingredient.id)
    db.commit()
    db.refresh(allergy)

    out: list[MappedIngredientOut] = []
    for m in allergy.ingredient_mappings:
        if m.ingredient is None:
            continue
        out.append(MappedIngredientOut(ingredient_id=m.ingredient_id, ingredient_name=m.ingredient.name))
    return out


@router.post("/{allergy_id}/auto-map", response_model=AutoMapResponse)
def auto_map(
    allergy_id: int,
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_superuser),
) -> Any:
    allergy = db.get(Allergy, allergy_id)
    if allergy is None:
        raise HTTPException(status_code=404, detail="Allergy not found")

    name = (allergy.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Allergy name is empty")

    queries = {name}
    if name.endswith("s") and len(name) > 3:
        queries.add(name[:-1])

    mapped_ids: set[int] = set()
    for q in sorted(queries, key=len, reverse=True):
        like = f"%{q}%"
        rows = (
            db.query(Ingredient)
            .filter(Ingredient.name.ilike(like))
            .order_by(Ingredient.id.asc())
            .limit(limit)
            .all()
        )
        for ing in rows:
            mapped_ids.add(ing.id)
            if len(mapped_ids) >= limit:
                break
        if len(mapped_ids) >= limit:
            break

    for ing_id in sorted(mapped_ids):
        allergy.add_ingredient_mapping(db=db, ingredient_id=ing_id)

    db.commit()
    return AutoMapResponse(allergy_id=allergy_id, mapped_count=len(mapped_ids), ingredient_ids=sorted(mapped_ids))


@router.delete("/{allergy_id}/mapped-ingredients/{ingredient_id}", response_model=AutoMapResponse)
def unmap_ingredient(
    allergy_id: int,
    ingredient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_superuser),
) -> Any:
    allergy = db.get(Allergy, allergy_id)
    if allergy is None:
        raise HTTPException(status_code=404, detail="Allergy not found")

    removed = allergy.remove_ingredient_mapping(db=db, ingredient_id=ingredient_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Mapping not found")

    db.commit()
    return AutoMapResponse(allergy_id=allergy_id, mapped_count=0, ingredient_ids=[])
