from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base
from .recipe import MealType
from datetime import date

class MealPlan(Base):
    __tablename__ = "meal_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=False, default=date.today)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    notes = Column(String, nullable=True)
    
    # Relationships
    meals = relationship("Meal", back_populates="meal_plan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<MealPlan {self.id} for user {self.user_id} ({self.start_date} to {self.end_date})>"

class Meal(Base):
    __tablename__ = "meals"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    meal_type = Column(Enum(MealType), nullable=False)
    notes = Column(String, nullable=True)
    
    # Relationships
    meal_plan = relationship("MealPlan", back_populates="meals")
    recipes = relationship("MealRecipe", back_populates="meal", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Meal {self.id} ({self.date} - {self.meal_type})>"

class MealRecipe(Base):
    __tablename__ = "meal_recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    servings = Column(Integer, default=1, nullable=False)
    
    # Relationships
    meal = relationship("Meal", back_populates="recipes")
    recipe = relationship("Recipe", back_populates="meal_recipes")
    
    def __repr__(self):
        return f"<MealRecipe {self.id}: {self.recipe.name} for meal {self.meal_id}>"
