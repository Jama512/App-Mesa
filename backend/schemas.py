from pydantic import BaseModel
from typing import List, Dict, Optional, Any

# --- ESQUEMAS DE RESTAURANTES ---
class RestaurantCreate(BaseModel):
    id: str
    ownerId: str
    name: str
    status: Optional[str] = "Abierto ahora"
    category: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rating: Optional[float] = 4.5
    features: Optional[Dict[str, bool]] = {}
    images: Optional[List[str]] = []
    events: Optional[List[Any]] = []
    menu: Optional[List[Any]] = []
    logo: Optional[str] = None
    coverImage: Optional[str] = None

class DishCreate(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    image: Optional[str] = None
    category: Optional[str] = None
    isAvailable: Optional[bool] = True  # 🔥 NUEVO: Soporte para disponibilidad

# 🔥 ESQUEMA DE EVENTOS ACTUALIZADO 🔥
class EventCreate(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    
    # --- NUEVOS CAMPOS AÑADIDOS ---
    dateLabel: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    imageUrl: Optional[str] = None
    
    # Mantenemos este por si tienes eventos viejos en la BD
    image: Optional[str] = None 

# --- NUEVOS ESQUEMAS DE USUARIO ---
class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str