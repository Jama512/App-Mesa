from sqlalchemy import Column, String, Float, JSON
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
    
    features = Column(JSON, default=dict)
    images = Column(JSON, default=list)
    events = Column(JSON, default=list)
    menu = Column(JSON, default=list)
    
    # 🔥 NUEVOS CAMPOS: Para guardar los links del logo y portada
    logo = Column(String, nullable=True)
    coverImage = Column(String, nullable=True)

# TABLA DE USUARIOS
class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="owner") # "owner" o "admin"