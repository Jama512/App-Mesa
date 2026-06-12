import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Obtenemos la URL (de Render o la de tu Docker local)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://mesa_user:mesa_password@db:5432/mesa_db")

# 🔥 PARCHE CRÍTICO PARA RENDER + SQLALCHEMY 🔥
# Reemplaza 'postgres://' por 'postgresql://' si es necesario
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()