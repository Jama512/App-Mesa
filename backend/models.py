from typing import Any
from sqlalchemy import Column, String, Float, JSON
from sqlalchemy.ext.mutable import MutableList, MutableDict
from database import Base

class RestaurantDB(Base):
    __tablename__ = "restaurants"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, nullable=True) # Lo puse opcional por si no lo envías siempre
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    description = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    rating = Column(Float, default=4.5)
    status = Column(String, default="Abierto ahora")
    ownerId = Column(String, index=True)
    
    features: Any = Column(MutableDict.as_mutable(JSON), default=dict)
    images:   Any = Column(MutableList.as_mutable(JSON), default=list)
    events:   Any = Column(MutableList.as_mutable(JSON), default=list)
    menu:     Any = Column(MutableList.as_mutable(JSON), default=list)
    
    logo = Column(String, nullable=True)
    coverImage = Column(String, nullable=True)

# TABLA DE USUARIOS
class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="owner") # "owner" o "admin"