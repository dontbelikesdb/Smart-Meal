from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import dependencies as deps
from app.db.session import get_db
from app.models.user import User

from .schemas import RecipeResult, SearchNLRequest, SearchResponse
from .service import list_recipes, search_nl


router = APIRouter()


@router.get("/recipes", response_model=list[RecipeResult])
def get_recipes(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    # current_user kept to match existing auth patterns; not used yet.
    return list_recipes(db=db, limit=limit)


@router.post("/nl", response_model=SearchResponse)
def search_natural_language(
    payload: SearchNLRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    parsed, applied, results = search_nl(db=db, user=current_user, query=payload.query, limit=payload.limit)
    return {"applied": applied, "results": results}
