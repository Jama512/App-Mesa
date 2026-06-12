// src/screens/owner/OwnerLocationPicker.tsx
import React, { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import MapView, { Region, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { useAuth } from "../auth/AuthContext";
import { useRestaurants } from "../../context/RestaurantsContext";
import { Ionicons } from "@expo/vector-icons";

const forkPin = require("../../../assets/fork-pin.png");

const DEFAULT_REGION: Region = {
  latitude: 19.984146, // Zamora Centro
  longitude: -102.282539,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const OwnerLocationPicker: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  const { state, updateRestaurant } = useAuth();
  const { upsertOwnerRestaurant } = useRestaurants();
  const mapRef = useRef<MapView>(null);

  // 🔥 Validación defensiva de propiedades
  const savedLat = (() => {
    const lat = (state.restaurant as any)?.latitude;
    return typeof lat === "number" ? lat : undefined;
  })();
  
  const savedLng = (() => {
    const lng = (state.restaurant as any)?.longitude;
    return typeof lng === "number" ? lng : undefined;
  })();

  const initialRegion = useMemo<Region>(() => {
    if (typeof savedLat === "number" && typeof savedLng === "number") {
      return {
        latitude: savedLat,
        longitude: savedLng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    return DEFAULT_REGION;
  }, [savedLat, savedLng]);

  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number }>({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  });

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 🔥 ELIMINADO: El useEffect que pedía ubicación automáticamente al entrar.
  // Ahora la pantalla carga al instante sin trabarse.

  const handleUseCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      setSaved(false);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Activa la ubicación para seleccionar el pin de tu restaurante.");
        return;
      }

      // 🔥 FIX: Plan B para el emulador (igual que en CityMapScreen)
      let loc;
      try {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch (e) {
        loc = null;
      }

      if (!loc) {
        loc = await Location.getLastKnownPositionAsync() as Location.LocationObject;
      }

      if (loc && loc.coords) {
        const newCenter = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setMapCenter(newCenter);
        mapRef.current?.animateToRegion({
          ...newCenter,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }, 800);
      } else {
         Alert.alert("Sin GPS", "Inyecta una ubicación en tu emulador.");
      }

    } catch (err) {
      Alert.alert("Error", "No se pudo obtener tu ubicación.");
    } finally {
      setLoadingLocation(false); // Siempre quitamos el circulo de carga
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      // 🔥 Corrección TS: Pasamos los campos explícitos que espera Partial<RestaurantProfile>
      updateRestaurant({ latitude: mapCenter.latitude, longitude: mapCenter.longitude });
      await upsertOwnerRestaurant(mapCenter);

      setSaved(true);
      Alert.alert("Listo", "Ubicación guardada correctamente.");
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar la ubicación.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerLayout
      title="Ubicación del restaurante"
      subtitle="Mueve el mapa para colocar el pin sobre tu local."
      showBack
    >
      <View style={styles.container}>
        <View style={[styles.mapWrap, { borderColor: theme.colors.border }]}>
          
          <MapView
            ref={mapRef}
            style={styles.mapAbsolute}
            initialRegion={initialRegion}
            onRegionChangeComplete={(region) => {
              setMapCenter({ latitude: region.latitude, longitude: region.longitude });
              setSaved(false);
            }}
            mapType="standard"
            showsPointsOfInterests={false}
          >
          </MapView>

          {/* EL PIN FLOTANTE FALSO */}
          <View pointerEvents="none" style={styles.floatingPinContainer}>
             <Image source={forkPin} style={styles.pinImg} />
          </View>

          <View style={styles.fabColumn}>
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={handleUseCurrentLocation}
              disabled={loadingLocation}
              activeOpacity={0.85}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="locate-outline" size={18} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.primary, backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "transparent" }]}
            onPress={handleUseCurrentLocation}
            disabled={loadingLocation}
            activeOpacity={0.85}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>Usar mi ubicación</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Centro del mapa</Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Lat: {mapCenter.latitude.toFixed(5)} · Lng: {mapCenter.longitude.toFixed(5)}
          </Text>
          <Text style={[styles.infoHint, { color: theme.colors.textSecondary }]}>
            Arrastra el mapa para que el pin quede exactamente sobre tu negocio.
          </Text>
          {saved && (
            <Text style={[styles.savedText, { color: theme.colors.primary }]}>✓ Guardado en tu perfil</Text>
          )}
        </View>
      </View>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrap: { height: 280, borderRadius: 18, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, marginBottom: 14, position: 'relative' },
  mapAbsolute: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
  },
  floatingPinContainer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 34, 
  },
  pinImg: { width: 34, height: 34, resizeMode: "contain" },
  fabColumn: { position: "absolute", right: 10, top: 10, gap: 10 },
  fab: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, gap: 10 },
  secondaryButton: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  secondaryButtonText: { fontSize: 12, fontWeight: "700" },
  primaryButton: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  infoCard: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: StyleSheet.hairlineWidth },
  infoTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  infoText: { fontSize: 12, marginBottom: 4 },
  infoHint: { fontSize: 11 },
  savedText: { marginTop: 6, fontSize: 12, fontWeight: "700" },
});

export default OwnerLocationPicker;