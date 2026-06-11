# ✅ CHECKLIST DE VALIDACIÓN - Integración FastAPI

## 📋 VERIFICACIONES CRÍTICAS

### Fase 1: Consolidación de Tipos ✅
- [x] Unificar `restaurant.types.ts` como fuente única
- [x] Redireccionar `src/models/types.ts` a restaurant.types.ts
- [x] Agregar `isAvailable` a Dish (opcional, con default true)
- [x] Crear alias `Announcement = RestaurantEvent`

### Fase 2: Backend - Soporte de Campos ✅
- [x] Agregar `isAvailable` a `DishCreate` (schemas.py)
- [ ] Probar endpoint POST /restaurants/me/menu con { ..., isAvailable: true }
- [ ] Validar que MongoDB guarde el campo correctamente
- [ ] Probar GET /restaurants/ devuelve `isAvailable` en cada platillo

### Fase 3: Frontend - Contextos (⏳ EN PROGRESO)
- [ ] Refactorizar `RestaurantsContext.tsx`
  - Eliminar fetch directo a /restaurants/
  - Usar `MenuService.updateRestaurant()`
  - Usar `AnnouncementService.addAnnouncement()`
- [ ] Eliminar duplicación de lógica de sincronización
- [ ] Validar que `processSyncQueue` usa servicios

### Fase 4: Frontend - Pantallas
- [ ] Actualizar `OwnerCreateAnnouncement.tsx` para usar RestaurantEvent
- [ ] Actualizar `OwnerAddDish.tsx` para incluir `isAvailable`
- [ ] Verificar que `OwnerMenuList.tsx` muestra estado de disponibilidad

### Fase 5: Testing E2E
- [ ] Login → Crear restaurante → Ver en lista
- [ ] Crear platillo con `isAvailable: true` → Verificar en BD
- [ ] Crear evento → Verificar sincronización
- [ ] Ir offline → Crear evento → Volver online → Sincronizar
- [ ] Cambiar `isAvailable: false` → Verificar que se refleja en el restaurante

---

## 🎯 ARCHIVOS MODIFICADOS EN ESTA AUDITORÍA

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `types/restaurant.types.ts` | ✅ Consolidado + Documentación | 🔴 Crítico |
| `src/models/types.ts` | ✅ Re-exporta desde restaurant.types | 🔴 Crítico |
| `backend/schemas.py` | ✅ Agregado `isAvailable` a DishCreate | 🟡 Importante |
| `INTEGRATION_GUIDE.md` | ✅ Nuevo: Guía de concordancia | 📚 Referencia |

---

## 🚨 3 ARCHIVOS MÁS CRÍTICOS PARA REFACTORIZACIÓN

### **#1: RestaurantsContext.tsx** (Alto Impacto)
**Problema**: Realiza fetch directo en lugar de usar servicios  
**Ubicación**: [src/context/RestaurantsContext.tsx](src/context/RestaurantsContext.tsx#L1)

**Cambios necesarios**:
```typescript
// ANTES (Actual)
const response = await fetch(API_URL);
const rawList = await response.json();

// DESPUÉS (Propuesto)
import { MenuService } from "../services/menu.service";
const restaurant = await MenuService.getRestaurant(restaurantId);
```

### **#2: OwnerAddDish.tsx** (Funcionalidad Nueva)
**Problema**: No envía campo `isAvailable`  
**Ubicación**: [src/screens/owner/OwnerAddDish.tsx](src/screens/owner/OwnerAddDish.tsx)

**Cambios necesarios**:
```typescript
// Agregar campo isAvailable al formulario
const [isAvailable, setIsAvailable] = useState(true);

// Incluir en payload
const dish = {
  id: uuid.v4(),
  name,
  description,
  price,
  image,
  isAvailable,  // 🆕 Campo nuevo
};
```

### **#3: database.service.ts** (Sincronización)
**Problema**: La cola de sincronización no conoce sobre `isAvailable`  
**Ubicación**: [src/services/database.service.ts](src/services/database.service.ts)

**Cambios necesarios**:
```typescript
// Agregar operación para actualizar disponibilidad
export async function addToSyncQueue(operation, payload) {
  // Agregar nuevo tipo de operación:
  // "UPDATE_DISH_AVAILABILITY": { restaurantId, dishId, isAvailable }
}
```

---

## 📊 ESTADO POR SERVICIO

| Servicio | Estado | Notas |
|----------|--------|-------|
| `announcement.service.ts` | ✅ Listo | Envía eventos correctamente |
| `menu.service.ts` | ✅ Listo | Maneja menú completo |
| `database.service.ts` | ⚠️ Parcial | Falta soporte para isAvailable |
| `multimedia.service.ts` | ✅ Listo | Sube imágenes correctamente |

---

## 🔍 VALIDACIÓN DE NOMENCLATURA

| Aspecto | Decisión | Estado |
|--------|----------|--------|
| camelCase vs snake_case | Mantener camelCase (actual) | ✅ Consistente |
| Campos con ID | Usar "Id" (no "ID") | ✅ Consistente |
| Endpoints | URLs lowercase | ✅ FastAPI cumple |
| Arrays en JSON | Usar arrays [] | ✅ Correcto |

---

## 📝 PRÓXIMAS SESIONES

```
Sesión 2: Refactorizar RestaurantsContext.tsx
Sesión 3: Agregar isAvailable a pantallas del owner
Sesión 4: Testing E2E completo
Sesión 5: Optimización de rendimiento (caché, etc.)
```

---

## 💾 REFERENCIAS RÁPIDAS

**Donde copiar código de ejemplo**:
- [MenuService](src/services/menu.service.ts) - Modelo para refactorizar
- [announcement.service.ts](src/services/announcement.service.ts) - Patrón HTTP correcto
- [AuthContext.tsx](src/screens/auth/AuthContext.tsx) - Manejo de JWT

**Documentación del proyecto**:
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Tabla de concordancia
- [types/restaurant.types.ts](types/restaurant.types.ts) - Tipos únicos
- [backend/main.py](backend/main.py) - Endpoints disponibles
