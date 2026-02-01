# Import all models here so they're registered with SQLAlchemy
from app.db.session import Base, engine, get_db
from .user import User
from .profile import UserProfile
from .chronic_disease import ChronicDisease, UserChronicDisease
from .allergy import Allergy, AllergyIngredientMap, UserAllergy
from .ingredient import Ingredient, RecipeIngredient
from .recipe import Recipe, RecipeNutritionalInfo, MealType, CuisineType
from .meal import MealPlan, Meal, MealRecipe

# This will be used to import all models in main.py
__all__ = [
    'Base', 'engine', 'get_db',
    'User', 'UserProfile',
    'ChronicDisease', 'UserChronicDisease',
    'Allergy', 'AllergyIngredientMap', 'UserAllergy',
    'Ingredient', 'RecipeIngredient',
    'Recipe', 'RecipeNutritionalInfo', 'MealType', 'CuisineType',
    'MealPlan', 'Meal', 'MealRecipe'
]
