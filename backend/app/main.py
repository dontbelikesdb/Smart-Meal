from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.allergy_catalog import get_allergy_aliases, get_default_allergies
from .core.config import settings
from .core.security import get_password_hash
from . import models
from .db.session import engine, SessionLocal, Base
from .api.v1.api import api_router
from .models.allergy import Allergy
from .models.ingredient import Ingredient
from .models.user import User

# Create database tables
_ = models
Base.metadata.create_all(bind=engine)

def _ensure_first_superuser() -> None:
    email = getattr(settings, "FIRST_SUPERUSER_EMAIL", "") or ""
    password = getattr(settings, "FIRST_SUPERUSER_PASSWORD", "") or ""
    email = email.strip()
    if not email or not password:
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name="Admin",
                is_active=True,
                is_superuser=True,
            )
            db.add(user)
            db.commit()
            return

        if not getattr(user, "is_superuser", False):
            user.is_superuser = True
            db.commit()
    finally:
        db.close()

def _ensure_default_allergies() -> None:
    if not getattr(settings, "SEED_DEFAULT_ALLERGIES", True):
        return

    default_allergies = get_default_allergies()

    limit = int(getattr(settings, "SEED_DEFAULT_ALLERGIES_AUTOMAP_LIMIT", 25) or 25)
    if limit < 1:
        limit = 1

    db = SessionLocal()
    try:
        created_or_existing: list[Allergy] = []
        for name, desc in default_allergies:
            existing = db.query(Allergy).filter(Allergy.name.ilike(name)).first()
            if existing is not None:
                created_or_existing.append(existing)
                continue
            obj = Allergy(name=name, description=desc)
            db.add(obj)
            created_or_existing.append(obj)

        db.commit()

        for allergy in created_or_existing:
            db.refresh(allergy)

        for allergy in created_or_existing:
            if allergy.id is None:
                continue
            if allergy.ingredient_mappings and len(allergy.ingredient_mappings) > 0:
                continue

            mapped_ids: set[int] = set()
            terms = get_allergy_aliases(allergy.name or "")
            for term in sorted(set(t.strip() for t in terms if t and t.strip()), key=len, reverse=True):
                like = f"%{term}%"
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
    finally:
        db.close()

_ensure_first_superuser()
_ensure_default_allergies()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",  # Enable Swagger UI at /docs
    redoc_url="/redoc",  # Enable ReDoc at /redoc
)

# Set up CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to the Meal Planner API!",
        "docs": "/docs",
        "redoc": "/redoc"
    }
