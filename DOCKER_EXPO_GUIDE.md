# 🚀 Guía: Levantando Docker + Expo Sin Conflictos

**Fecha**: 2026-06-10  
**Objetivo**: Backend FastAPI + Frontend Expo funcionando juntos

---

## 📋 PREREQUISITOS

✅ Docker Desktop instalado y corriendo  
✅ Node.js instalado  
✅ Ngrok instalado (si quieres exponer la API)  

---

## 🔧 PASO 1: Levantar Docker (Backend + PostgreSQL)

### En PowerShell (como administrador):

```powershell
# Navega a la carpeta backend
cd c:\Users\jesma\Desktop\Proyectos\Mesa-App\backend

# Levanta Docker Compose
docker-compose up --build

# Esperado (5-10 segundos):
# ✅ mesa_postgres creado
# ✅ mesa_backend creado
# ✅ FastAPI corriendo en http://localhost:8000
```

### Señales de que está bien:

```
mesa_backend | INFO:     Uvicorn running on http://0.0.0.0:8000
mesa_backend | INFO:     Application startup complete
```

**Si sale error**: Verifica que:
- No hay otro servicio en puerto 8000: `netstat -ano | findstr :8000`
- Docker Desktop está corriendo

---

## 🌐 PASO 2: Exponer con Ngrok (DESDE OTRA TERMINAL)

### En PowerShell (nueva ventana):

```powershell
# Expone localhost:8000 públicamente
ngrok http 8000

# Esperado:
# Forwarding https://aware-dramatic-manatee.ngrok-free.dev -> http://localhost:8000
```

**⚠️ IMPORTANTE**: Copia la URL que genera (ej. `https://aware-dramatic-manatee.ngrok-free.dev`)

---

## 📱 PASO 3: Levantar Expo (DESDE OTRA TERMINAL)

### En PowerShell (tercera ventana):

```powershell
# Navega al proyecto Expo
cd c:\Users\jesma\Desktop\Proyectos\Mesa-App\MesaAppNueva

# Inicia Expo
npx expo start

# Verás:
# › Press 'a' to open Android
# › Scan this QR code...
```

**Presiona `a`** para abrir en emulador/teléfono

---

## 🧪 PASO 4: Probar que TODO Está Conectado

### Test 1: Backend responde

```powershell
# En cualquier terminal, prueba:
curl http://localhost:8000/restaurants/

# Esperado:
# [] (lista vacía o restaurantes)
# NO error 404
```

### Test 2: Frontend se conecta

En la app Expo (en el teléfono/emulador):
1. Navega a **Search** o **Home**
2. Deberías ver restaurantes cargando
3. Si no hay error = ✅ Conectado

### Test 3: Login funciona

En la app:
1. Ve a **ProfileScreen** o **LoginScreen**
2. Intenta loguearte con:
   - Email: `test@mesa.app`
   - Password: `test123`
3. Si entra = ✅ Backend y JWT funcionan

---

## 📊 Arquitectura de Puertos

```
┌─────────────────────────────────────────────┐
│           TU COMPUTADORA (LOCALHOST)        │
├─────────────────────────────────────────────┤
│                                             │
│  Puerto 5432: PostgreSQL (Docker)           │
│  Puerto 8000: FastAPI (Docker)              │
│  Puerto 19000: Metro bundler (Expo)         │
│                                             │
├─────────────────────────────────────────────┤
│           INTERNET (NGROK)                  │
├─────────────────────────────────────────────┤
│                                             │
│  https://aware-dramatic-manatee.ngrok...    │
│           ↓ (redirige a puerto 8000)        │
│                                             │
├─────────────────────────────────────────────┤
│           TELÉFONO/EMULADOR                 │
├─────────────────────────────────────────────┤
│                                             │
│  App Expo conecta a ngrok URL               │
│  Funciona offline-first (SQLite)            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🛑 Detener TODO

### Si quieres detener Docker:

```powershell
# En la terminal de Docker:
# Presiona Ctrl+C

# O en otra terminal:
cd c:\Users\jesma\Desktop\Proyectos\Mesa-App\backend
docker-compose down
```

### Si quieres detener Expo:

```powershell
# En la terminal de Expo:
# Presiona Ctrl+C
```

### Si quieres detener Ngrok:

```powershell
# En la terminal de Ngrok:
# Presiona Ctrl+C
```

---

## ❌ PROBLEMAS COMUNES

### ❌ Error: "Port 8000 is already in use"

```powershell
# Encuentra qué proceso usa el puerto
netstat -ano | findstr :8000

# Mata el proceso (reemplaza PID)
taskkill /PID 12345 /F

# O usa otro puerto en docker-compose.yml:
ports:
  - "8001:8000"  # Usa 8001 en vez de 8000
```

### ❌ Error: "Connection refused" en app

```
Solución:
1. Verifica que docker-compose está corriendo (docker ps)
2. Verifica que ngrok está activo
3. Verifica que la URL en src/config/api.config.ts es la correcta
4. Reinicia Expo: Ctrl+C y npx expo start nuevamente
```

### ❌ Error: "Cannot find module 'main.py'"

```powershell
# Verifica que estás en la carpeta backend:
cd c:\Users\jesma\Desktop\Proyectos\Mesa-App\backend
docker-compose up --build
```

### ❌ PostgreSQL no conecta

```powershell
# Verifica los logs:
docker-compose logs db

# Reinicia:
docker-compose down
docker-compose up --build
```

---

## 🔄 FLUJO COMPLETO (desde cero)

### Terminal 1 - Docker:
```powershell
cd c:\Users\jesma\Desktop\Proyectos\Mesa-App\backend
docker-compose up --build
# Espera a que veas: "Application startup complete"
```

### Terminal 2 - Ngrok:
```powershell
ngrok http 8000
# Copia la URL que genera
```

### Terminal 3 - Expo:
```powershell
cd c:\Users\jesma\Desktop\Proyectos\Mesa-App\MesaAppNueva
npx expo start
# Presiona 'a' para Android
```

### Resultado:
✅ Docker corriendo en puerto 8000  
✅ Ngrok exponiendo public URL  
✅ Expo conectando a ngrok  
✅ App funcionando con backend en nube  

---

## 📝 Resumen de Cambios

- ✅ Creado `backend/docker-compose.yml`
- ✅ PostgreSQL automáticamente levantado
- ✅ FastAPI conecta a PostgreSQL
- ✅ Ngrok expone el backend
- ✅ Expo conecta a ngrok
- ✅ **No hay conflictos de puertos**

---

## 🎯 ¿Qué Significa Todo?

| Componente | Propósito | Puerto | Comando |
|-----------|----------|--------|---------|
| PostgreSQL | Base de datos | 5432 | `docker-compose up` |
| FastAPI | Backend API | 8000 | `docker-compose up` |
| Ngrok | Expone público | - | `ngrok http 8000` |
| Metro | Bundler Expo | 19000+ | `npx expo start` |

---

## ✅ Checklist Final

- [ ] Docker Desktop corriendo
- [ ] `docker-compose up --build` ejecutado en `backend/`
- [ ] PostgreSQL conectado (sin errores)
- [ ] Ngrok levantado (`ngrok http 8000`)
- [ ] Expo iniciado (`npx expo start`)
- [ ] App abierta en emulador/teléfono
- [ ] Presionaste 'a' para Android (si Expo)
- [ ] Ves la app cargando

---

**Estado**: 🚀 **Listo para testing**
