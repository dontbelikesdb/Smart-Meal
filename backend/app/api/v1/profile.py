from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import dependencies as deps
from app.db.session import get_db
from app.models.allergy import Allergy, UserAllergy
from app.models.profile import UserProfile
from app.models.user import User
from app.schemas.allergy_mapping import UserAllergySet
from app.schemas.user import ProfileUpdate

router = APIRouter()

@router.post("/", response_model=Dict[str, Any])
def save_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    profile = (
        db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    )
    if profile is None:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(profile, field):
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return {"message": "profile saved", "user_id": current_user.id, "profile_id": profile.id}


@router.get("/allergies", response_model=UserAllergySet)
def get_my_allergies(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> UserAllergySet:
    rows = (
        db.query(UserAllergy.allergy_id)
        .filter(UserAllergy.user_id == current_user.id)
        .order_by(UserAllergy.allergy_id.asc())
        .all()
    )
    allergy_ids = [r[0] for r in rows if r and r[0] is not None]
    return UserAllergySet(allergy_ids=allergy_ids)


@router.post("/allergies", response_model=UserAllergySet)
def set_my_allergies(
    payload: UserAllergySet,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> UserAllergySet:
    ids = sorted({int(x) for x in (payload.allergy_ids or [])})

    if ids:
        existing = (
            db.query(Allergy.id)
            .filter(Allergy.id.in_(ids))
            .all()
        )
        existing_ids = {r[0] for r in existing}
        missing = [i for i in ids if i not in existing_ids]
        if missing:
            raise HTTPException(status_code=404, detail=f"Unknown allergy_id(s): {missing}")

    db.query(UserAllergy).filter(UserAllergy.user_id == current_user.id).delete()

    for allergy_id in ids:
        db.add(UserAllergy(user_id=current_user.id, allergy_id=allergy_id))

    db.commit()
    return UserAllergySet(allergy_ids=ids)
