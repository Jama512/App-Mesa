// src/map/CityMapScreen.tsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";

import MapView, { Marker, Circle, Region, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useRestaurants, Restaurant } from "../context/RestaurantsContext";
import { useLocationState } from "../context/LocationContext";
import { useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootTabParamList } from "../navigation/TabNavigator";
import { RootStackParamList } from "../navigation/StackNavigator";
import { MapErrorBoundary } from "../components/MapErrorBoundary";

type MapTabNav = BottomTabNavigationProp<RootTabParamList, "SearchTab">;
type RootNav = StackNavigationProp<RootStackParamList>;
type MapNavigationProp = CompositeNavigationProp<MapTabNav, RootNav>;

// Zamora Centro
const DEFAULT_CENTER = { latitude: 19.984146, longitude: -102.282539 }; 
const USER_RADIUS_METERS = 2000;
const INITIAL_DELTA = 0.05;

const forkPin = require("../../assets/fork-pin.png");

const CityMapScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<MapNavigationProp>();
  const mapRef = useRef<MapView>(null);

  const { restaurants, upsertOwnerRestaurant, refreshRestaurants } = useRestaurants();
  const { setLocation } = useLocationState();

  const [mapLoading, setMapLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // 🔄 Refrescar datos cuando la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      console.log("🗺️ CityMapScreen ganó foco, refrescando restaurantes...");
      refreshRestaurants?.();
    }, [refreshRestaurants])
  );

  // 1. Encontrar el restaurante del dueño
  const myRestaurant = useMemo(() => restaurants.find((r) => r.isOwnerRestaurant), [restaurants]);

  // 2. Determinar la región inicial basada en si el dueño ya tiene ubicación guardada
  const initialRegionToSave = useMemo<Region>(() => {
    if (myRestaurant && myRestaurant.latitude && myRestaurant.longitude) {
      return {
        latitude: myRestaurant.latitude,
        longitude: myRestaurant.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    return {
      latitude: DEFAULT_CENTER.latitude,
      longitude: DEFAULT_CENTER.longitude,
      latitudeDelta: INITIAL_DELTA,
      longitudeDelta: INITIAL_DELTA,
    };
  }, [myRestaurant]);

  const [regionToSave, setRegionToSave] = useState<Region>(initialRegionToSave);
  const prevCoordinatesRef = useRef<{ lat: number; lng: number } | null>(null);

  // 3. Sincronizar si la región inicial cambió
  useEffect(() => {
    const currentCoords = { lat: initialRegionToSave.latitude, lng: initialRegionToSave.longitude };
    const prevCoords = prevCoordinatesRef.current;
    
    // Si las coordenadas cambiaron, actualizar
    if (!prevCoords || prevCoords.lat !== currentCoords.lat || prevCoords.lng !== currentCoords.lng) {
      console.log("📍 Coordinadas actualizadas, centrando mapa...");
      prevCoordinatesRef.current = currentCoords;
      setRegionToSave(initialRegionToSave);
      mapRef.current?.animateToRegion(initialRegionToSave, 500);
    }
  }, [initialRegionToSave]);

  const mapRestaurants = useMemo(() => {
    return restaurants.filter((r) => r.latitude !== undefined && r.longitude !== undefined);
  }, [restaurants]);

  const handleSaveLocation = async () => {
    try {
      await upsertOwnerRestaurant({
        latitude: regionToSave.latitude,
        longitude: regionToSave.longitude,
      });
      Alert.alert("¡Éxito!", "La ubicación de tu negocio ha sido fijada en el centro del mapa.");
    } catch (e) {
      Alert.alert("Error", "No pudimos actualizar la ubicación.");
    }
  };

  const askLocation = async () => {
    try {
      setLoading(true);
      
      // 1. Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("📍 Permiso de ubicación:", status);
      
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitas habilitar la ubicación en los permisos de la app para continuar."
        );
        setLoading(false);
        return;
      }

      // 2. Obtener ubicación actual con opciones mejoradas
      let loc: Location.LocationObject | null = null;
      
      try {
        console.log("⏳ Obteniendo ubicación actual...");
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log("✅ Ubicación obtenida:", loc.coords);
      } catch (currentError: any) {
        console.warn("⚠️ Error obteniendo ubicación actual:", currentError.message);
        
        // 3. Intentar con última ubicación conocida
        try {
          console.log("🔄 Intentando con última ubicación conocida...");
          loc = await Location.getLastKnownPositionAsync({});
          console.log("✅ Última ubicación:", loc?.coords);
        } catch (fallbackError: any) {
          console.error("❌ Error en fallback:", fallbackError.message);
          loc = null;
        }
      }

      // 4. Si tenemos ubicación, actualizar mapa
      if (loc && loc.coords && loc.coords.latitude && loc.coords.longitude) {
        const current = { 
          latitude: loc.coords.latitude, 
          longitude: loc.coords.longitude 
        };
        setUserLocation(current);
        mapRef.current?.animateToRegion(
          { ...current, latitudeDelta: 0.015, longitudeDelta: 0.015 }, 
          800
        );
        setLocation({ coords: current, label: "Ubicación actual" });
        console.log("🗺️ Mapa centrado en:", current);
      } else {
        Alert.alert(
          "Sin ubicación",
          "No pudimos obtener tu ubicación. En un emulador, asegúrate de simular una ubicación en las opciones del emulador."
        );
      }
    } catch (e: any) {
      console.error("❌ Error completo:", e);
      Alert.alert(
        "Error de ubicación",
        e.message || "No se pudo obtener la ubicación. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const circleCenter = userLocation ?? DEFAULT_CENTER;

  return (
    <MapErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.header} />

        <View style={[styles.header, { backgroundColor: theme.colors.header, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mapa / Exploración</Text>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={regionToSave}
            onRegionChangeComplete={setRegionToSave}
            mapType="standard"
            showsPointsOfInterests={false}
            onPress={() => setSelectedRestaurant(null)}
            onMapReady={() => {
              console.log("🗺️ Mapa listo");
              setMapLoading(false);
            }}
            zoomControlEnabled={true}
          >

          
          <Circle 
            center={circleCenter} 
            radius={USER_RADIUS_METERS} 
            strokeColor={theme.colors.primary} 
            fillColor="rgba(255,140,0,0.15)" 
          />

          {mapRestaurants.map((rest) => {
            // 🔥 Validación defensiva: Asegurarse de que tenemos coords válidas
            if (!rest || !rest.id || typeof rest.latitude !== "number" || typeof rest.longitude !== "number") {
              console.warn("⚠️ Restaurante inválido en mapa:", rest);
              return null;
            }
            
            try {
              return (
                <Marker
                  key={rest.id}
                  coordinate={{ latitude: rest.latitude, longitude: rest.longitude }}
                  anchor={{ x: 0.5, y: 1 }}
                  onPress={() => setSelectedRestaurant(rest)}
                  tracksViewChanges={false} 
                >
                  <Image source={forkPin} style={styles.restaurantMarkerImage} />
                </Marker>
              );
            } catch (error) {
              console.error("❌ Error renderizando Marker:", error, rest);
              return null;
            }
          })}
          {userLocation && (
            <Marker 
              coordinate={userLocation} 
              title="Tú" 
              pinColor="#00B894" 
              tracksViewChanges={false} 
            />
          )}
        </MapView>

        {/* Indicador de carga del mapa */}
        {mapLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              ⏳ Cargando mapa...
            </Text>
          </View>
        )}

        {/* 🔥 LA MIRA CENTRAL FLOTANTE */}
        {myRestaurant && !selectedRestaurant && (
          <View pointerEvents="none" style={styles.centerCrosshair}>
            <Ionicons name="add" size={30} color={theme.colors.primary} />
          </View>
        )}
      </View>

      <View style={[styles.bottom, { backgroundColor: theme.colors.header }]}>
        {myRestaurant && !selectedRestaurant && (
          <TouchableOpacity 
             style={[styles.button, { backgroundColor: theme.colors.primary, marginBottom: 10 }]} 
             onPress={handleSaveLocation}
          >
            <Ionicons name="pin-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: "#fff", fontWeight: "700" }}>Fijar mi negocio en la marca</Text>
          </TouchableOpacity>
        )}

        {selectedRestaurant && (
          <View style={[styles.previewContainer, { borderColor: theme.colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.previewCard, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate("CategoryDetail", { restaurantId: selectedRestaurant.id })}
            >
              <View style={styles.previewLeft}>
                <View style={[styles.previewIconCircle, { backgroundColor: theme.colors.primary }]}>
                  <Image source={forkPin} style={styles.previewIcon} />
                </View>
                <View>
                  <Text style={[styles.previewName, { color: theme.colors.text }]} numberOfLines={1}>{selectedRestaurant.name}</Text>
                  <Text style={[styles.previewCategory, { color: theme.colors.textSecondary }]} numberOfLines={1}>{selectedRestaurant.category}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.card }]} onPress={askLocation} disabled={loading}>
          <Ionicons name="locate-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            {loading ? "Obteniendo ubicación..." : "Usar mi ubicación"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </MapErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  mapContainer: { flex: 1 },
  centerCrosshair: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bottom: { padding: 16 },
  button: { borderRadius: 999, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 13, fontWeight: "600" },
  restaurantMarkerImage: { width: 34, height: 34, resizeMode: "contain" },
  previewContainer: { borderRadius: 16, borderWidth: 1, marginBottom: 4 },
  previewCard: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  previewIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  previewIcon: { width: 20, height: 20, tintColor: "#FFFFFF", resizeMode: "contain" },
  previewName: { fontSize: 14, fontWeight: "700" },
  previewCategory: { fontSize: 12, marginTop: 2 },
});

export default CityMapScreen;