from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=True)
    unit = Column(String, nullable=False)  # g, ml, piece, etc.
    calories_per_unit = Column(Float, nullable=False)
    protein_per_unit = Column(Float, nullable=False)
    carbs_per_unit = Column(Float, nullable=False)
    fat_per_unit = Column(Float, nullable=False)
    
    # Relationships
    recipe_ingredients = relationship("RecipeIngredient", back_populates="ingredient")
    allergy_mappings = relationship("AllergyIngredientMap", back_populates="ingredient")
    
    def __repr__(self):
        return f"<Ingredient {self.name} ({self.id})>"

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    notes = Column(String, nullable=True)
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_ingredients")
    
    def __repr__(self):
        return f"<RecipeIngredient {self.quantity} {self.ingredient.unit} of {self.ingredient.name} for recipe {self.recipe_id}>"
