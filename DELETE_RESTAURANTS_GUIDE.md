# Guía para Eliminar Restaurantes Duplicados

## ✅ Endpoints Agregados

### Backend (FastAPI)
```python
# Eliminar un restaurante específico por ID
DELETE /restaurants/{restaurant_id}

# Eliminar TODOS los restaurantes (para desarrollo)
DELETE /restaurants/
```

### Frontend (React Native)
```typescript
// Usar en el contexto
const { deleteRestaurant, deleteAllRestaurants } = useRestaurants();

// Eliminar un restaurante
await deleteRestaurant(restaurantId);

// Limpiar todos (CUIDADO!)
await deleteAllRestaurants();
```

---

## 🔧 Cómo Usar

### Opción 1: Desde la API directamente (Postman/curl)

**Eliminar un restaurante específico:**
```bash
curl -X DELETE https://aware-dramatic-manatee.ngrok-free.dev/restaurants/{ID_DEL_RESTAURANTE}
```

**Eliminar todos (PELIGRO - borra todo):**
```bash
curl -X DELETE https://aware-dramatic-manatee.ngrok-free.dev/restaurants/
```

### Opción 2: Desde el código de la app

Puedes agregar un botón de debug en el `OwnerDashboard` para limpiar:

```typescript
const handleDeleteAll = async () => {
  Alert.alert(
    "⚠️ Peligro",
    "¿Eliminar TODOS los restaurantes? Esto no se puede deshacer.",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAllRestaurants();
            Alert.alert("✅ Hecho", "Todos los restaurantes fueron eliminados");
          } catch (e) {
            Alert.alert("❌ Error", "No se pudo eliminar");
          }
        },
      },
    ]
  );
};
```

---

## 📝 Ejemplo: Obtener IDs de Restaurantes

Primero, lista todos los restaurantes para ver sus IDs:

```bash
curl https://aware-dramatic-manatee.ngrok-free.dev/restaurants/
```

Respuesta:
```json
[
  { "id": "abc-123", "name": "Restaurante 1", "ownerId": "user-1" },
  { "id": "xyz-789", "name": "Mi Restaurante", "ownerId": "user-1" },
  { "id": "dup-456", "name": "Mi Restaurante", "ownerId": "user-1" }
]
```

Luego elimina los duplicados:
```bash
curl -X DELETE https://aware-dramatic-manatee.ngrok-free.dev/restaurants/dup-456
```

---

## 🚀 Cambios Realizados

### Backend (`main.py`)
- ✅ `DELETE /restaurants/{restaurant_id}` - Elimina un restaurante por ID
- ✅ `DELETE /restaurants/` - Elimina todos (solo desarrollo)
- ✅ `GET /restaurants/me` - Obtiene el restaurante del usuario logueado

### Frontend

**Config (`api.config.ts`):**
- ✅ `RESTAURANTS_DELETE: (id) => ...` - URL para eliminar por ID
- ✅ `RESTAURANTS_DELETE_ALL` - URL para limpiar todo

**Service (`menu.service.ts`):**
- ✅ `deleteRestaurant(id)` - Llamada HTTP DELETE
- ✅ `deleteAllRestaurants()` - Limpieza total

**Context (`RestaurantsContext.tsx`):**
- ✅ `deleteRestaurant(id)` - Hook de contexto
- ✅ `deleteAllRestaurants()` - Hook de contexto
- ✅ Actualización automática del state local

---

## ⚠️ IMPORTANTE

- **El endpoint `DELETE /restaurants/` elimina TODO sin previo aviso**
- Úsalo solo en desarrollo
- En producción, considera agregar validaciones de permisos

---

## 🔍 Verificar si funcionó

Después de eliminar, lista nuevamente:
```bash
curl https://aware-dramatic-manatee.ngrok-free.dev/restaurants/
```

Deberías ver menos restaurantes.
