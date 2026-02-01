from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Session, relationship
from app.db.session import Base

class Allergy(Base):
    __tablename__ = "allergies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    
    # Relationship
    user_profiles = relationship("UserAllergy", back_populates="allergy")
    ingredient_mappings = relationship(
        "AllergyIngredientMap",
        back_populates="allergy",
        cascade="all, delete-orphan",
    )

    def add_ingredient_mapping(self, db: Session, ingredient_id: int) -> None:
        existing = (
            db.query(AllergyIngredientMap)
            .filter(
                AllergyIngredientMap.allergy_id == self.id,
                AllergyIngredientMap.ingredient_id == ingredient_id,
            )
            .first()
        )
        if existing is not None:
            return
        db.add(AllergyIngredientMap(allergy_id=self.id, ingredient_id=ingredient_id))

    def remove_ingredient_mapping(self, db: Session, ingredient_id: int) -> bool:
        existing = (
            db.query(AllergyIngredientMap)
            .filter(
                AllergyIngredientMap.allergy_id == self.id,
                AllergyIngredientMap.ingredient_id == ingredient_id,
            )
            .first()
        )
        if existing is None:
            return False
        db.delete(existing)
        return True

class UserAllergy(Base):
    __tablename__ = "user_allergies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    allergy_id = Column(Integer, ForeignKey("allergies.id"), nullable=False)
    severity = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    
    # Relationships
    allergy = relationship("Allergy", back_populates="user_profiles")


class AllergyIngredientMap(Base):
    __tablename__ = "allergy_ingredient_map"

    id = Column(Integer, primary_key=True, index=True)
    allergy_id = Column(Integer, ForeignKey("allergies.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)

    __table_args__ = (UniqueConstraint("allergy_id", "ingredient_id", name="uq_allergy_ingredient"),)

    allergy = relationship("Allergy", back_populates="ingredient_mappings")
    ingredient = relationship("Ingredient", back_populates="allergy_mappings")
