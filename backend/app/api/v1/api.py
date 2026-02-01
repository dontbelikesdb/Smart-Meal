from fastapi import APIRouter

from app.api.endpoints import auth, users
from app.api.v1 import allergies, plan, profile
from app.features.search import router as search_router

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(plan.router, prefix="/plan", tags=["plan"])
api_router.include_router(search_router, prefix="/search", tags=["search"])
api_router.include_router(allergies.router, prefix="/allergies", tags=["allergies"])
