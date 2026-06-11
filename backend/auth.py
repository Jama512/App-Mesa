import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configuración del motor de encriptación
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Llave maestra para firmar los tokens (NUNCA la compartas en producción)
SECRET_KEY = os.getenv("SECRET_KEY", "llave_secreta_compucad_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # El token dura 7 días

security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    """Compara la contraseña en texto plano con el hash de la base de datos"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Convierte la contraseña en un texto encriptado irreversible"""
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """Genera el Token JWT que el celular usará para identificarse"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica que el token JWT sea válido y retorna el user_id"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")