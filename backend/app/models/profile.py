from sqlalchemy import Column, Integer, Float, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    age = Column(Integer)
    gender = Column(String)
    height_cm = Column(Float)
    weight_kg = Column(Float)
    bmi = Column(Float)
    blood_pressure_systolic = Column(Integer)
    blood_pressure_diastolic = Column(Integer)
    cholesterol_level = Column(Integer)
    blood_sugar_level = Column(Integer)
    daily_steps = Column(Integer)
    exercise_frequency = Column(Integer)  # times per week
    sleep_hours = Column(Float)
    alcohol_consumption = Column(Boolean)
    smoking_habit = Column(Boolean)
    dietary_habits = Column(String)  # Vegetarian, Vegan, Keto, etc.
    preferred_cuisine = Column(String)
    food_aversions = Column(String, nullable=True)
