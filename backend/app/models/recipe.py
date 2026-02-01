from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class MealType(enum.Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"
    DESSERT = "dessert"
    
class CuisineType(enum.Enum):
    INDIAN = "indian"
    ITALIAN = "italian"
    MEXICAN = "mexican"
    CHINESE = "chinese"
    JAPANESE = "japanese"
    THAI = "thai"
    MEDITERRANEAN = "mediterranean"
    AMERICAN = "american"
    OTHER = "other"

class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=False)
    prep_time = Column(Integer, nullable=True)  # in minutes
    cook_time = Column(Integer, nullable=True)   # in minutes
    servings = Column(Integer, nullable=False, default=1)
    cuisine_type = Column(Enum(CuisineType), nullable=True)
    is_vegetarian = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    is_gluten_free = Column(Boolean, default=False)
    is_dairy_free = Column(Boolean, default=False)
    image_url = Column(String, nullable=True)
    
    # Relationships
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    meal_recipes = relationship("MealRecipe", back_populates="recipe")
    nutritional_info = relationship("RecipeNutritionalInfo", back_populates="recipe", uselist=False)
    
    def __repr__(self):
        return f"<Recipe {self.name} ({self.id})>"

class RecipeNutritionalInfo(Base):
    __tablename__ = "recipe_nutritional_info"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), unique=True, nullable=False)
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)
    fiber_g = Column(Float, nullable=True)
    sugar_g = Column(Float, nullable=True)
    sodium_mg = Column(Float, nullable=True)
    
    # Relationship
    recipe = relationship("Recipe", back_populates="nutritional_info")
    
    def __repr__(self):
        return f"<NutritionalInfo for Recipe {self.recipe_id}: {self.calories} calories>"
