from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

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

def _ensure_user_is_superuser_column() -> None:
    insp = inspect(engine)
    try:
        cols = {c.get("name") for c in insp.get_columns("users")}
    except Exception:
        return
    if "is_superuser" in cols:
        return
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN is_superuser BOOLEAN DEFAULT FALSE"))
        conn.execute(text("UPDATE users SET is_superuser = FALSE WHERE is_superuser IS NULL"))

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

    default_allergies: list[tuple[str, str | None]] = [
        ("milk", "Dairy / milk proteins"),
        ("egg", "Eggs and egg products"),
        ("peanut", "Peanuts and peanut products"),
        ("tree nut", "Almonds, cashews, walnuts, etc."),
        ("soy", "Soybeans and soy products"),
        ("wheat", "Wheat and wheat products"),
        ("gluten", "Gluten-containing grains"),
        ("fish", "Fish and fish products"),
        ("shellfish", "Shrimp, crab, lobster, etc."),
        ("sesame", "Sesame and sesame products"),
    ]

    aliases: dict[str, list[str]] = {
        "milk": ["milk", "dairy", "cheese", "butter", "cream", "yogurt"],
        "egg": ["egg", "eggs"],
        "peanut": ["peanut", "peanuts", "peanut butter"],
        "tree nut": [
            "tree nut",
            "almond",
            "cashew",
            "walnut",
            "pistachio",
            "pecan",
            "hazelnut",
        ],
        "soy": ["soy", "soya", "tofu", "edamame"],
        "wheat": ["wheat", "flour"],
        "gluten": ["gluten"],
        "fish": ["fish", "salmon", "tuna"],
        "shellfish": ["shellfish", "shrimp", "prawn", "crab", "lobster"],
        "sesame": ["sesame", "tahini"],
    }

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
            terms = aliases.get((allergy.name or "").strip().lower(), [])
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

_ensure_user_is_superuser_column()
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