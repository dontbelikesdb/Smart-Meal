from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class ChronicDisease(Base):
    __tablename__ = "chronic_diseases"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    
    # Relationship
    user_profiles = relationship("UserChronicDisease", back_populates="disease")

class UserChronicDisease(Base):
    __tablename__ = "user_chronic_diseases"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    disease_id = Column(Integer, ForeignKey("chronic_diseases.id"), nullable=False)
    severity = Column(String, nullable=True)
    diagnosis_date = Column(String, nullable=True)  # Storing as string for simplicity
    
    # Relationships
    disease = relationship("ChronicDisease", back_populates="user_profiles")
