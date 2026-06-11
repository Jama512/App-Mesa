import os
import shutil
import uuid

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified  # ← soluciona el rojo

from database import engine, get_db
from models import Base, RestaurantDB, UserDB
from schemas import RestaurantCreate, DishCreate, EventCreate, UserCreate, Token
import auth

# ==========================================
# 1. INICIALIZACIÓN Y CONFIGURACIÓN
# ==========================================

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MESA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

IMAGE_BASE_URL = os.getenv("IMAGE_BASE_URL", "").rstrip("/")


# ==========================================
# HELPER: serializar un restaurante
# ==========================================

def serialize_restaurant(r: RestaurantDB) -> dict:
    return {
        "id": r.id,
        "name": r.name,
        "category": r.category,
        "address": r.address,
        "phone": r.phone,
        "description": r.description,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "rating": r.rating,
        "status": r.status,
        "ownerId": r.ownerId,
        "features": r.features if isinstance(r.features, dict) else {},
        "images": list(r.images) if isinstance(r.images, list) else [],
        "events": list(r.events) if isinstance(r.events, list) else [],
        "menu": list(r.menu) if isinstance(r.menu, list) else [],
        "logo": r.logo,
        "coverImage": r.coverImage,
    }


# ==========================================
# 2. AUTENTICACIÓN
# ==========================================

@app.post("/register", response_model=Token)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(UserDB).filter(UserDB.email == user.email).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    new_user = UserDB(
        id=str(uuid.uuid4()),
        email=user.email,
        hashed_password=auth.get_password_hash(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"access_token": auth.create_access_token({"sub": new_user.id}), "token_type": "bearer"}


@app.post("/login", response_model=Token)
def login_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    return {"access_token": auth.create_access_token({"sub": db_user.id}), "token_type": "bearer"}


# ==========================================
# 3. RESTAURANTES
# ==========================================

@app.get("/restaurants/")
def get_restaurants(db: Session = Depends(get_db)):
    return [serialize_restaurant(r) for r in db.query(RestaurantDB).all()]


@app.post("/restaurants/")
def create_or_update_restaurant(
    restaurant: RestaurantCreate,
    user_id: str = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant.id).first()
    if db_r:
        for key, value in restaurant.dict().items():
            setattr(db_r, key, value)
    else:
        db_r = RestaurantDB(**restaurant.dict())
        db.add(db_r)
    db.commit()
    db.refresh(db_r)
    return {"mensaje": "Restaurante procesado", "datos": serialize_restaurant(db_r)}


@app.get("/restaurants/me")
def get_own_restaurant(
    user_id: str = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")
    return serialize_restaurant(db_r)


@app.get("/restaurants/{restaurant_id}")
def get_restaurant_by_id(restaurant_id: str, db: Session = Depends(get_db)):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    return serialize_restaurant(db_r)


@app.delete("/restaurants/{restaurant_id}")
def delete_restaurant(
    restaurant_id: str,
    user_id: str = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    db.delete(db_r)
    db.commit()
    return {"mensaje": "Restaurante eliminado", "id": restaurant_id}


# ==========================================
# 4. MENÚ
# ==========================================

@app.post("/restaurants/me/menu")
def add_dish_me(
    dish: DishCreate,
    user_id: str = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")

    menu = list(db_r.menu) if isinstance(db_r.menu, list) else []
    menu.append(dish.dict())
    db_r.menu = menu
    flag_modified(db_r, "menu")  # ← le dice a SQLAlchemy que cambió
    db.commit()
    return {"mensaje": "Platillo agregado", "menu": db_r.menu}


@app.delete("/restaurants/me/menu/{dish_id}")
def remove_dish_me(
    dish_id: str,
    user_id: str = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")

    menu = list(db_r.menu) if isinstance(db_r.menu, list) else []
    db_r.menu = [d for d in menu if d.get("id") != dish_id]
    flag_modified(db_r, "menu")
    db.commit()
    return {"mensaje": "Platillo eliminado"}


# ==========================================
# 5. EVENTOS
# ==========================================

@app.get("/restaurants/me/events")
def get_my_events(
    user_id: str = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="No tienes restaurante")
    return {"events": list(db_r.events) if isinstance(db_r.events, list) else []}


@app.get("/restaurants/{restaurant_id}/events")
def get_events(restaurant_id: str, db: Session = Depends(get_db)):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.id == restaurant_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    return {"events": list(db_r.events) if isinstance(db_r.events, list) else []}


@app.post("/restaurants/me/events")
def add_event_me(
    event: EventCreate,
    user_id: str = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")

    events = list(db_r.events) if isinstance(db_r.events, list) else []
    events.append(event.dict())
    db_r.events = events
    flag_modified(db_r, "events")
    db.commit()
    return {"mensaje": "Evento agregado", "events": db_r.events}


@app.patch("/restaurants/me/events/{event_id}")
def update_event_me(
    event_id: str,
    event: EventCreate,
    user_id: str = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")

    events = list(db_r.events) if isinstance(db_r.events, list) else []
    updated = False
    for i, e in enumerate(events):
        if e.get("id") == event_id:
            events[i].update(event.dict(exclude_unset=True))
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    db_r.events = events
    flag_modified(db_r, "events")
    db.commit()
    return {"mensaje": "Evento actualizado", "events": db_r.events}


@app.delete("/restaurants/me/events/{event_id}")
def remove_event_me(
    event_id: str,
    user_id: str = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    db_r = db.query(RestaurantDB).filter(RestaurantDB.ownerId == user_id).first()
    if not db_r:
        raise HTTPException(status_code=404, detail="No tienes restaurante registrado")

    events = list(db_r.events) if isinstance(db_r.events, list) else []
    new_events = [e for e in events if e.get("id") != event_id]

    if len(new_events) == len(events):
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    db_r.events = new_events
    flag_modified(db_r, "events")
    db.commit()
    return {"mensaje": "Evento eliminado"}


# ==========================================
# 6. IMÁGENES
# ==========================================

@app.post("/upload/image/")
async def upload_image(request: Request, file: UploadFile = File(...)):
    try:
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_location = f"static/{unique_filename}"

        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

        base_url = IMAGE_BASE_URL or str(request.base_url).rstrip("/")
        image_url = f"{base_url}/static/{unique_filename}"

        return {"mensaje": "Imagen subida exitosamente", "url": image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")
