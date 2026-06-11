# Guía de Troubleshooting - Mapa y Ubicación

## ✅ Cambios Realizados

### 1. **Permisos de Ubicación en `app.json`**
Se agregó configuración de permisos para iOS y Android:
```json
"android": {
  "permissions": [
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION"
  ]
},
"ios": {
  "infoPlist": {
    "NSLocationWhenInUseUsageDescription": "...",
    "NSLocationAlwaysAndWhenInUseUsageDescription": "..."
  }
}
```

### 2. **Mejoras en `CityMapScreen.tsx`**
- ✅ Mejor manejo de errores en `askLocation()`
- ✅ Logs detallados para debugging (console.log)
- ✅ Fallback mejorado: si `getCurrentPositionAsync` falla, intenta `getLastKnownPositionAsync`
- ✅ Mejor configuración del MapView (tileSize, minimumZ agregados)
- ✅ Indicador visual de carga del mapa

---

## 🧪 Cómo Probar en el Emulador

### **Android Emulator (AVD)**
1. Abre el emulador de Android
2. En la ventana del emulador, haz clic en los "..." (Más opciones) en la esquina derecha
3. Busca "Location" en el panel que se abre
4. Ingresa coordenadas de prueba:
   - **Latitud**: `19.984146` (Zamora Centro)
   - **Longitud**: `-102.282539`
5. Haz clic en "Send"

### **iOS Simulator**
1. En Xcode, ve a `Debug > Location > Custom Location`
2. Ingresa las mismas coordenadas
3. O usa `Features > Location > Custom Location` en el menú

### **Test Rápido**
Después de simular ubicación:
1. Abre la app
2. Ve a la pestaña "Mapa"
3. Presiona el botón "Usar mi ubicación"
4. Deberías ver en Console los logs:
   ```
   📍 Permiso de ubicación: granted
   ⏳ Obteniendo ubicación actual...
   ✅ Ubicación obtenida: {latitude: 19.984146, longitude: -102.282539}
   ```

---

## 🐛 Si Aún Hay Problemas

### Opción 1: Rebuild Completo
```bash
cd MesaAppNueva
npm install
npx expo start --clear
```

### Opción 2: Limpiar Caché
```bash
npx expo start --clear
# O en el menú interactivo, presiona: c
```

### Opción 3: Reinstalar Permisos
```bash
npm install expo-location@^56.0.16
```

---

## 📱 Verificar en Consola
Abre la consola mientras la app corre (F12 en web, o verifica los logs):
- Busca mensajes que empiezan con 📍, ⏳, ✅, ⚠️, ❌
- Estos te dirán exactamente qué está pasando

---

## 🗺️ Por qué el Mapa Podría Verse Vacío

### Causa 1: Tiles no cargan
- Verifica conexión a internet
- CartoDB puede tener CORS issues

### Causa 2: MapView no está ready
- Ahora hay un indicador "⏳ Cargando mapa..."
- Espera a que desaparezca

### Causa 3: Zoom muy alto o bajo
- El initialRegion tiene latitudeDelta: 0.05
- Esto corresponde a ~5 km de zoom

---

## 🎯 Ubicaciones de Prueba

| Lugar | Latitud | Longitud |
|-------|---------|----------|
| Zamora Centro | 19.984146 | -102.282539 |
| CDMX (Reforma) | 19.4326 | -99.1332 |
| Guadalajara Centro | 20.6596 | -103.2494 |

---

## 📝 Resumen de Cambios

| Archivo | Cambio | Razón |
|---------|--------|-------|
| `app.json` | Agregados permisos de ubicación | iOS/Android requieren explícitamente estos permisos |
| `CityMapScreen.tsx` | Mejorado manejo de errores en `askLocation()` | Mejor debugging y UX |
| `CityMapScreen.tsx` | Agregado indicador de carga del mapa | Feedback visual |
| `CityMapScreen.tsx` | Mejorada configuración de MapView | Mejor renderizado de tiles |
