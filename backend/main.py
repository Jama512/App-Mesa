import os
import shutil
import uuid

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi import Request
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, RestaurantDB, UserDB
from schemas import RestaurantCreate, DishCreate, EventCreate, UserCreate, Token
import auth  # Tu escudo de seguridad

# ==========================================
# 1. INICIALIZACIÓN Y CONFIGURACIÓN
# ==========================================

# Crea todas las tablas en PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MESA API - Arquitectura Modular y Segura")

# Configuración de Archivos Estáticos (Para imágenes)
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# ==========================================
# 2. RUTAS DE AUTENTICACIÓN
# ==========================================

@app.post("/register", response_model=Token)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Verificar si el correo ya existe
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    # 2. Encriptar contraseña y generar ID único
    hashed_pwd = auth.get_password_hash(user.password)
    user_id = str(uuid.uuid4()) 
    
    # 3. Guardar en base de datos
    new_user = UserDB(id=user_id, email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 4. Generar el Token JWT de bienvenida
    access_token = auth.create_access_token(data={"sub": new_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Buscar usuario por correo
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    # 2. Verificar contraseña matemática
    if not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    # 3. Generar el pase de acceso temporal
    access_token = auth.create_access_token(data={"sub": db_user.id})
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# 3. RUTAS DE RESTAURANTES (CRUD)
# ==========================================

@app.post("/restaurants/")
def create_or_update_restaurant(restaurant: RestaurantCreate, db: Session = Depends(get_db)):
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant.id).first()
    
    if db_restaurant:
        for key, value in restaurant.dict().items():
            setattr(db_restaurant, key, value)
    else:
        db_restaurant = RestaurantDB(**restaurant.dict())
        db.add(db_restaurant)
        
    db.commit()
    db.refresh(db_restaurant)
    return {"mensaje": "Restaurante procesado", "datos": db_restaurant}

@app.get("/restaurants/")
def get_restaurants(db: Session = Depends(get_db)):
    """Retorna todos los restaurantes con sus datos completos (eventos, menú, etc)"""
    restaurants = db.query(RestaurantDB).all()
    
    result = []
    for rest in restaurants:
        result.append({
            "id": rest.id,
            "name": rest.name,
            "category": rest.category,
            "address": rest.address,
            "phone": rest.phone,
            "description": rest.description,
            "latitude": rest.latitude,
            "longitude": rest.longitude,
            "rating": rest.rating,
            "status": rest.status,
            "ownerId": rest.ownerId,
            "features": rest.features if isinstance(rest.features, dict) else {},
            "images": list(rest.images) if isinstance(rest.images, list) else [],
            "events": list(rest.events) if isinstance(rest.events, list) else [],
            "menu": list(rest.menu) if isinstance(rest.menu, list) else [],
            "logo": rest.logo,
            "coverImage": rest.coverImage,
        })
    
    return result

@app.get("/restaurants/me")
def get_own_restaurant(db: Session = Depends(get_db)):
    """Obtiene el restaurante del usuario autenticado con datos completos (eventos, menú, etc)"""
    # TODO: Implementar autenticación real cuando tengas JWT validado
    db_restaurant = db.query(RestaurantDB).first()  # Por ahora retorna el primero
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")
    
    # Retorna el restaurante completo con todos sus datos
    return {
        "id": db_restaurant.id,
        "name": db_restaurant.name,
        "category": db_restaurant.category,
        "address": db_restaurant.address,
        "phone": db_restaurant.phone,
        "description": db_restaurant.description,
        "latitude": db_restaurant.latitude,
        "longitude": db_restaurant.longitude,
        "rating": db_restaurant.rating,
        "status": db_restaurant.status,
        "ownerId": db_restaurant.ownerId,
        "features": db_restaurant.features,
        "images": db_restaurant.images,
        "events": list(db_restaurant.events) if isinstance(db_restaurant.events, list) else [],
        "menu": list(db_restaurant.menu) if isinstance(db_restaurant.menu, list) else [],
        "logo": db_restaurant.logo,
        "coverImage": db_restaurant.coverImage,
    }

@app.delete("/restaurants/{restaurant_id}")
def delete_restaurant(restaurant_id: str, db: Session = Depends(get_db)):
    """Elimina un restaurante por ID"""
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    
    db.delete(db_restaurant)
    db.commit()
    
    return {"mensaje": "Restaurante eliminado correctamente", "id": restaurant_id}

@app.delete("/restaurants/")
def delete_all_restaurants(db: Session = Depends(get_db)):
    """⚠️ ENDPOINT DE DESARROLLO: Elimina TODOS los restaurantes (usar con cuidado)"""
    try:
        count = db.query(RestaurantDB).delete()
        db.commit()
        return {"mensaje": f"Se eliminaron {count} restaurantes", "count": count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar: {str(e)}")


# ==========================================
# 4. RUTAS PARA EL MENÚ
# ==========================================

@app.post("/restaurants/{restaurant_id}/menu")
def add_dish(restaurant_id: str, dish: DishCreate, db: Session = Depends(get_db)):
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    if not db_restaurant:
        return {"error": "Restaurante no encontrado"}
    
    current_menu = list(db_restaurant.menu) if isinstance(db_restaurant.menu, list) else []
    current_menu.append(dish.dict())
    
    db_restaurant.menu = current_menu  # type: ignore
    db.commit()
    return {"mensaje": "Platillo agregado exitosamente", "menu": db_restaurant.menu}

@app.delete("/restaurants/{restaurant_id}/menu/{dish_id}")
def remove_dish(restaurant_id: str, dish_id: str, db: Session = Depends(get_db)):
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    if not db_restaurant:
        return {"error": "Restaurante no encontrado"}
    
    current_menu = list(db_restaurant.menu) if isinstance(db_restaurant.menu, list) else []
    updated_menu = [d for d in current_menu if d.get("id") != dish_id]
    
    db_restaurant.menu = updated_menu  # type: ignore
    db.commit()
    return {"mensaje": "Platillo eliminado"}


# ==========================================
# 5. RUTAS PARA LOS EVENTOS
# ==========================================

@app.get("/restaurants/{restaurant_id}/events")
def get_events(restaurant_id: str, db: Session = Depends(get_db)):
    """Obtiene todos los eventos de un restaurante"""
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    
    events = list(db_restaurant.events) if isinstance(db_restaurant.events, list) else []
    return {"events": events}

@app.get("/restaurants/me/events")
def get_my_events(db: Session = Depends(get_db)):
    """Obtiene eventos del restaurante del usuario (temp: primer restaurante)"""
    db_restaurant = db.query(RestaurantDB).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="No tienes restaurante")
    
    events = list(db_restaurant.events) if isinstance(db_restaurant.events, list) else []
    return {"events": events}

@app.post("/restaurants/{restaurant_id}/events")
def add_event(restaurant_id: str, event: EventCreate, db: Session = Depends(get_db)):
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    if not db_restaurant:
        return {"error": "Restaurante no encontrado"}
    
    current_events = list(db_restaurant.events) if isinstance(db_restaurant.events, list) else []
    current_events.append(event.dict())
    
    db_restaurant.events = current_events  # type: ignore
    db.commit()
    return {"mensaje": "Evento agregado exitosamente", "events": current_events}

@app.post("/restaurants/me/events")
def add_event_me(event: EventCreate, user_id: str = Depends(auth.verify_token), db: Session = Depends(get_db)):
    """Crear evento en el restaurante del usuario autenticado"""
    # Buscar el restaurante del usuario autenticado
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")
    
    current_events = list(db_restaurant.events) if isinstance(db_restaurant.events, list) else []
    event_dict = event.dict()
    current_events.append(event_dict)
    
    db_restaurant.events = current_events  # type: ignore
    db.commit()
    return {"mensaje": "Evento agregado exitosamente", "events": current_events}

@app.patch("/restaurants/{restaurant_id}/events/{event_id}")
def update_event(restaurant_id: str, event_id: str, event: EventCreate, db: Session = Depends(get_db)):
    """Actualiza un evento existente en un restaurante"""
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    
    current_events = list(db_restaurant.events) if isinstance(db_restaurant.events, list) else []
    updated = False
    
    for i, e in enumerate(current_events):
        if e.get("id") == event_id:
            # Actualizar el evento con los nuevos datos
            current_events[i].update(event.dict(exclude_unset=True))
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    db_restaurant.events = current_events  # type: ignore
    db.commit()
    return {"mensaje": "Evento actualizado exitosamente", "events": current_events}

@app.patch("/restaurants/me/events/{event_id}")
def update_event_me(event_id: str, event: EventCreate, user_id: str = Depends(auth.verify_token), db: Session = Depends(get_db)):
    """Actualizar evento del restaurante del usuario autenticado"""
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")
    
    current_events = list(db_restaurant.events) if isinstance(db_restaurant.events, list) else []
    updated = False
    
    for i, e in enumerate(current_events):
        if e.get("id") == event_id:
            # Actualizar el evento con los nuevos datos
            current_events[i].update(event.dict(exclude_unset=True))
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    db_restaurant.events = current_events  # type: ignore
    db.commit()
    return {"mensaje": "Evento actualizado exitosamente", "events": current_events}

@app.delete("/restaurants/{restaurant_id}/events/{event_id}")
def remove_event(restaurant_id: str, event_id: str, db: Session = Depends(get_db)):
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    if not db_restaurant:
        return {"error": "Restaurante no encontrado"}
    
    current_events = list(db_restaurant.events) if isinstance(db_restaurant.events, list) else []
    updated_events = [e for e in current_events if e.get("id") != event_id]
    
    db_restaurant.events = updated_events  # type: ignore
    db.commit()
    return {"mensaje": "Evento eliminado"}

@app.delete("/restaurants/me/events/{event_id}")
def remove_event_me(event_id: str, user_id: str = Depends(auth.verify_token), db: Session = Depends(get_db)):
    """Eliminar evento del restaurante del usuario autenticado"""
    db_restaurant = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")
    
    current_events = list(db_restaurant.events) if isinstance(db_restaurant.events, list) else []
    updated_events = [e for e in current_events if e.get("id") != event_id]
    
    if len(updated_events) == len(current_events):
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    db_restaurant.events = updated_events  # type: ignore
    db.commit()
    return {"mensaje": "Evento eliminado"}


# ==========================================
# 6. RUTAS PARA SUBIR IMÁGENES
# ==========================================

@app.post("/upload/image/")
async def upload_image(request: Request, file: UploadFile = File(...)):
    try:
        # Generamos la ruta donde se guardará físicamente
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_location = f"static/{unique_filename}"  # FIXED: Use unique_filename
        
        # Copiamos el archivo de la memoria RAM al disco duro
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        # Generamos la URL pública (10.0.2.2 es el alias del host para el emulador de Android)
        base_url = str(request.base_url).rstrip('/')
        image_url = f"{base_url}/static/{unique_filename}"
        
        return {"mensaje": "Imagen subida exitosamente", "url": image_url}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")