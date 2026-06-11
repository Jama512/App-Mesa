# 📋 Guía de Integración Frontend ↔ FastAPI

**Última actualización**: 2026-06-10  
**Estado**: ✅ Auditoría Completada | En Refactorización

---

## 🎯 TABLA DE CONCORDANCIA (Fuente Única de Verdad)

### **RESTAURANTE**
```typescript
// Frontend (TypeScript)
interface Restaurant {
  id: string;                    // UUID generado por backend
  name: string;                  // Nombre del negocio
  category?: string;             // Tipo de cocina
  ownerId?: string;              // ID del dueño (JWT sub)
  status?: string;               // "Abierto ahora" | "Cerrado"
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;               // 0-5
  images?: string[];             // URLs de /static/
  menu?: Dish[];                 // Array de platillos
  events?: RestaurantEvent[];    // Array de anuncios
  features?: RestaurantFeatures; // {wifi, parking, etc}
  logo?: string;                 // URL o null
  coverImage?: string;           // URL o null
}
```

### **PLATILLO (Dish)**
```typescript
interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;                 // En pesos/dólares (float)
  image?: string;                // URL del platillo
  categoryId?: string;           // Referencia a categoría (NUEVO)
  category?: string;             // Nombre en texto
  isAvailable?: boolean;         // 🆕 SOPORTE AGREGADO
}
```

### **EVENTO/ANUNCIO (RestaurantEvent)**
```typescript
interface RestaurantEvent {
  id: string;
  title: string;
  dateLabel: string;             // "Próximo viernes 8pm"
  description?: string;
  date?: string;                 // YYYY-MM-DD
  startTime?: string;            // HH:mm
  endTime?: string;              // HH:mm
  imageUrl?: string;             // URL del póster
  posterUri?: string;            // Para local (se convierte a imageUrl)
}
```

### **USUARIO**
```typescript
interface User {
  id: string;                    // Del JWT (sub)
  email: string;
  fullName?: string;
  role?: 'owner' | 'client';    // Tipo de usuario
}
```

---

## 🔄 ENDPOINTS CRÍTICOS (Resumen)

### **Autenticación**
```
POST /register            → { email, password } → { access_token, token_type }
POST /login               → { email, password } → { access_token, token_type }
```

### **Restaurantes**
```
GET  /restaurants/        → Lista todos los restaurantes
POST /restaurants/        → Crear/Actualizar restaurante (POST = UPSERT)
PATCH /restaurants/me     → Actualizar restaurante del propietario logueado
```

### **Menú**
```
POST /restaurants/me/menu                    → Agregar platillo
DELETE /restaurants/me/menu/{dishId}         → Eliminar platillo
PATCH /restaurants/me/menu/{dishId}          → Actualizar platillo (NUEVO)
```

### **Eventos**
```
POST /restaurants/me/events                  → Crear evento
DELETE /restaurants/me/events/{eventId}      → Eliminar evento
PATCH /restaurants/me/events/{eventId}       → Actualizar evento (NUEVO)
```

### **Multimedia**
```
POST /upload/image/       → Subir imagen → { filename, url }
```

---

## 📦 ESTRUCTURA DE IMPORTES

### ✅ **Correcto** (Usar siempre)
```typescript
// Importar desde tipos/restaurant.types.ts (Fuente única de verdad)
import { 
  Restaurant, 
  Dish, 
  RestaurantEvent, 
  User 
} from "../../types/restaurant.types";
```

### ❌ **DEPRECADO** (No usar en código nuevo)
```typescript
// src/models/types.ts solo re-exporta para compatibilidad hacia atrás
import { Restaurant } from "../models/types";  // 🚫 Usar solo en componentes legacy
```

---

## 🔐 AUTENTICACIÓN (JWT Pattern)

### **Flujo de Login**
```
1. Usuario ingresa email + password
2. POST /login → FastAPI
3. FastAPI devuelve: { access_token: "eyJhbGc...", token_type: "bearer" }
4. Frontend decodifica JWT sin librerías (función decodeJWT)
5. Extrae: userId = decoded.sub
6. Guarda sesión en SQLite (database.service)
7. En headers: Authorization: Bearer {token}
```

### **Renovación de Token**
```typescript
// Cada fetch importante incluye el token
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${session.token}`
}
```

---

## 🎯 PRÓXIMOS PASOS (En Proceso)

### **Refactorización de Contextos** (CRÍTICO)
```
[ ] RestaurantsContext.tsx
    - Usar MenuService en lugar de fetch directo
    - Usar AnnouncementService para eventos
    - Simplificar lógica de sincronización

[ ] Validación de Integración
    - Tests E2E de menú completo
    - Verificar sincronización offline

[ ] Nomenclatura
    - Decidir: ¿camelCase o snake_case?
    - Actualmente: camelCase en ambos (consistente)
```

---

## ⚠️ PROBLEMAS CONOCIDOS

| Problema | Severidad | Solución |
|----------|-----------|----------|
| `isAvailable` no se sincroniza offline | 🟡 Media | Agregar a sync queue en database.service |
| API_URL hardcodeado en múltiples archivos | 🟡 Media | Centralizar en config.ts |
| Duplicación de lógica en RestaurantsContext | 🔴 Alto | Refactorizar con servicios |

---

## 📝 NOTAS

- **ID Format**: Strings (UUID v4 del backend, cacheados localmente)
- **Timestamps**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Precios**: Números flotantes (para cálculos de carrito)
- **Imágenes**: URLs completas servidas por `/static/`
- **Offline Mode**: SQLite + sync queue en database.service

---

**Contacto de Dudas**: Revisa CLAUDE.md en la raíz del proyecto
