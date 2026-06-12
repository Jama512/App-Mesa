// src/screens/home/CategoryDetailScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ImageBackground,
  Image,
  Linking, // Modulo para abrir apps externas (Mapas, Teléfono, Web)
  Platform, // Para detectar iOS vs Android
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useTheme } from "../../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

// Consumo de datos centralizados (Contexto)
import { useRestaurants } from "../../context/RestaurantsContext";
import { useLocationState } from "../../context/LocationContext";

type Nav = StackNavigationProp<RootStackParamList, "CategoryDetail">;
type Rte = RouteProp<RootStackParamList, "CategoryDetail">;

type Props = { navigation: Nav; route: Rte };

type TabKey = "menu" | "events" | "info";

const headerDoodles = require("../../../assets/Background.png");
const bgDoodles = require("../../../assets/Background.png");

// --- UTILERIA: FORMULA HAVERSINE ---
// Calcula la distancia en linea recta entre dos puntos (Usuario - Restaurante)
// sin necesidad de usar APIs de pago.
const toRad = (x: number) => (x * Math.PI) / 180;
const haversineKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) => {
  const R = 6371; // Radio de la tierra en km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const CategoryDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { restaurantId } = route.params;
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  const { restaurants, favorites, toggleFavorite } = useRestaurants();
  const { location } = useLocationState();

  // 1. OBTENCIÓN DE DATOS
  // Busco el restaurante en memoria (Contexto) usando el ID recibido por navegación.
  const restaurant = useMemo(
    () => restaurants.find((r) => r.id === restaurantId),
    [restaurants, restaurantId]
  );

  // 2. PREPARACIÓN DEL MENÚ
  // Extraigo el array de platillos para renderizarlo
  const dishes = useMemo(() => restaurant?.menu || [], [restaurant]);

  const isFav = favorites.includes(restaurantId);

  // Calculo la distancia en tiempo real si tengo la ubicación del usuario
  const distanceLabel = useMemo(() => {
    if (!restaurant?.latitude || !restaurant?.longitude) return null;
    if (!location.coords) return null;

    const km = haversineKm(location.coords, {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    });

    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  }, [restaurant?.latitude, restaurant?.longitude, location.coords]);

  const [activeTab, setActiveTab] = useState<TabKey>("menu");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Extraer categorías únicas del menú
  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    dishes.forEach((dish) => {
      if (dish.category && !cats.has(dish.category)) {
        cats.set(dish.category, dish.category);
      }
    });
    return Array.from(cats.values()).sort();
  }, [dishes]);

  // Filtrar platillos por categoría seleccionada
  const filteredDishes = useMemo(() => {
    if (!selectedCategory) return dishes;
    return dishes.filter((d) => d.category === selectedCategory);
  }, [dishes, selectedCategory]);

  // 3. INTEGRACIÓN CON MAPAS EXTERNOS
  const handleOpenMaps = () => {
    if (!restaurant?.latitude || !restaurant?.longitude) {
      Alert.alert(
        "Lo sentimos",
        "Este restaurante no tiene ubicación registrada."
      );
      return;
    }

    const lat = restaurant.latitude;
    const lng = restaurant.longitude;
    const label = encodeURIComponent(restaurant.name);

    let url = "";

    // Lógica condicional por Sistema Operativo
    if (Platform.OS === "ios") {
      // Esquema para Apple Maps
      url = `maps:0,0?q=${label}@${lat},${lng}`;
    } else {
      // Esquema universal 'geo' para Android (abre Google Maps, Waze, etc.)
      url = `geo:0,0?q=${lat},${lng}(${label})`;
    }

    // Intento abrir la URL profunda
    Linking.openURL(url).catch((err) => {
      console.error("Error abriendo mapa:", err);
      Alert.alert("Error", "No se pudo abrir la aplicación de mapas.");
    });
  };

  // Manejo de caso error (si el ID no existe)
  if (!restaurant) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            Restaurante no encontrado
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: theme.colors.primary }}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const coverUri = (restaurant as any).coverImage;

  return (
    <ImageBackground
      source={bgDoodles}
      style={{ flex: 1 }}
      imageStyle={{ opacity: isDark ? 0.1 : 0.18 }}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />

        <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
          {/* HERO IMAGE: Portada del restaurante */}
          <ImageBackground
            source={coverUri ? { uri: coverUri } : headerDoodles}
            style={styles.hero}
            imageStyle={{ opacity: coverUri ? 1 : 0.35 }}
          >
            <View style={styles.heroOverlay} />

            <View style={styles.heroTopRow}>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => toggleFavorite(restaurantId)}
              >
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={20}
                  color={isFav ? theme.colors.primary : "#fff"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.heroBottom}>
              <Text style={styles.heroTitle}>{restaurant.name}</Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroRating}>
                  <Ionicons name="star" size={16} color="#FFD166" />
                  <Text style={styles.heroRatingText}>
                    {restaurant.rating ?? "4.8"}
                  </Text>
                </View>

                <Text style={styles.heroMetaText}>
                  {distanceLabel ? `${distanceLabel} · ` : ""}
                  {restaurant.status ?? "Abierto ahora"}
                </Text>
              </View>
            </View>
          </ImageBackground>

          {/* TABS: Menú / Eventos / Info */}
          <View style={[styles.tabBar, { backgroundColor: theme.colors.card }]}>
            {[
              { key: "menu", label: "Menú" },
              { key: "events", label: "Eventos" },
              { key: "info", label: "Info" },
            ].map((t) => {
              const selected = activeTab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(t.key as TabKey)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: selected
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                  {selected && (
                    <View
                      style={[
                        styles.tabIndicator,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CONTENIDO DE LAS TABS */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {activeTab === "menu" && (
              <View>
                {/* FILTRO DE CATEGORÍAS */}
                {categories.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      <TouchableOpacity
                        onPress={() => setSelectedCategory(null)}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor:
                              selectedCategory === null
                                ? theme.colors.primary
                                : theme.colors.background,
                            borderColor:
                              selectedCategory === null
                                ? theme.colors.primary
                                : theme.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            {
                              color:
                                selectedCategory === null
                                  ? "#fff"
                                  : theme.colors.text,
                            },
                          ]}
                        >
                          Todos ({dishes.length})
                        </Text>
                      </TouchableOpacity>

                      {categories.map((cat) => {
                        const count = dishes.filter(
                          (d) => d.category === cat
                        ).length;
                        return (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            style={[
                              styles.categoryChip,
                              {
                                backgroundColor:
                                  selectedCategory === cat
                                    ? theme.colors.primary
                                    : theme.colors.background,
                                borderColor:
                                  selectedCategory === cat
                                    ? theme.colors.primary
                                    : theme.colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryChipText,
                                {
                                  color:
                                    selectedCategory === cat
                                      ? "#fff"
                                      : theme.colors.text,
                                },
                              ]}
                            >
                              {cat} ({count})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {filteredDishes.length === 0 ? (
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: theme.colors.card },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        textAlign: "center",
                      }}
                    >
                      Este menú aún no tiene platillos registrados.
                    </Text>
                  </View>
                ) : (
                  filteredDishes.map((dish) => (
                    <View
                      key={dish.id}
                      style={[
                        styles.dishCard,
                        {
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          opacity: dish.isAvailable !== false ? 1 : 0.6,
                        },
                      ]}
                    >
                      {/* Imagen opcional del platillo */}
                      {dish.image && (
                        <Image
                          source={{ uri: dish.image }}
                          style={styles.dishImage}
                        />
                      )}

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dishName,
                            { color: theme.colors.text },
                          ]}
                        >
                          {dish.name}
                        </Text>
                        {!!dish.description && (
                          <Text
                            style={[
                              styles.dishDesc,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {dish.description}
                          </Text>
                        )}
                        {dish.isAvailable === false && (
                          <Text
                            style={{
                              color: "#ef4444",
                              fontSize: 11,
                              fontWeight: "700",
                              marginTop: 4,
                            }}
                          >
                            Agotado
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.dishPrice,
                          { color: theme.colors.primary },
                        ]}
                      >
                        ${dish.price.toFixed(0)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}

{/* TAB DE EVENTOS CON LÓGICA DE IMAGEN ROBUSTA */}
{activeTab === "events" && (
  (restaurant.events ?? []).length === 0 ? (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <Text style={{ color: theme.colors.textSecondary }}>No hay eventos registrados.</Text>
    </View>
  ) : (
    (restaurant.events ?? []).map((e: any) => {
      // 🔥 BUSQUEDA ROBUSTA: Prioriza imageUrl (nuevo), luego los campos viejos
      const imageUrl = e.imageUrl || e.posterUri || e.image;
      const hasImage = !!imageUrl;

      return (
        <View
          key={e.id}
          style={[
            styles.eventRow,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              flexDirection: "column",
              alignItems: "stretch",
              padding: 0,
              overflow: "hidden",
            },
          ]}
        >
          {/* 🌟 FLYER PROMOCIONAL */}
          {hasImage && (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: 140, resizeMode: "cover" }}
            />
          )}

          <View style={{ flexDirection: "row", padding: 12, alignItems: "center" }}>
            {/* Si no hay imagen, mostramos el ícono de megáfono */}
            {!hasImage && (
              <View
                style={[
                  styles.eventIconCircle,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Ionicons name="megaphone" size={18} color="#fff" />
              </View>
            )}
            
            <View style={{ flex: 1 }}>
              <Text style={[styles.eventTitle, { color: theme.colors.text }]}>
                {e.title}
              </Text>
              
              {/* Mostramos fecha y horas (inicio - fin) */}
              <Text style={[styles.eventDate, { color: theme.colors.textSecondary }]}>
                {e.dateLabel || e.date} 
                {e.startTime ? ` · ${e.startTime}${e.endTime ? ` - ${e.endTime}` : ""}` : ""}
              </Text>

              {e.description && (
                <Text style={[styles.eventDate, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                  {e.description}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    })
  )
)}

            {activeTab === "info" && (
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                {!!restaurant.address && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[styles.infoText, { color: theme.colors.text }]}
                    >
                      {restaurant.address}
                    </Text>
                  </View>
                )}

                {!!restaurant.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[styles.infoText, { color: theme.colors.text }]}
                    >
                      {restaurant.phone}
                    </Text>
                  </View>
                )}

                {!!restaurant.description && (
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: "transparent", paddingHorizontal: 0 },
                    ]}
                  >
                    <Text style={{ color: theme.colors.textSecondary }}>
                      {restaurant.description}
                    </Text>
                  </View>
                )}

                {/* Features (Wifi, Parking, etc.) */}
                <View style={{ marginTop: 10 }}>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontWeight: "700",
                      marginBottom: 8,
                    }}
                  >
                    Servicios
                  </Text>

                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {restaurant.features?.wifi && <Chip label="Wifi" />}
                    {restaurant.features?.outdoorSeating && (
                      <Chip label="Aire libre" />
                    )}
                    {restaurant.features?.parking && <Chip label="Parking" />}
                    {restaurant.features?.reservations && (
                      <Chip label="Reservaciones" />
                    )}
                    {restaurant.features?.delivery && <Chip label="Delivery" />}
                    {restaurant.features?.cardPayment && (
                      <Chip label="Tarjeta" />
                    )}

                    {!Object.values(restaurant.features || {}).some(
                      Boolean
                    ) && (
                      <Text style={{ color: theme.colors.textSecondary }}>
                        (Sin servicios especificados)
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* FAB: Botón Flotante "Cómo llegar" */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.85}
          onPress={handleOpenMaps} // Conecta la lógica de mapas aquí
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.fabText}>Cómo llegar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
};

const Chip = ({ label }: { label: string }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: 230, justifyContent: "space-between" },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroBottom: { paddingHorizontal: 16, paddingBottom: 16 },
  heroTitle: { color: "#fff", fontWeight: "800", fontSize: 20 },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  heroRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  heroRatingText: {
    color: "#FFD166",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 13,
  },
  heroMetaText: { color: "#fff", fontSize: 12 },

  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 13, fontWeight: "600" },
  tabIndicator: { marginTop: 4, height: 3, borderRadius: 999, width: 40 },

  card: { borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: "700" },

  dishCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
  dishName: { fontSize: 14, fontWeight: "700" },
  dishDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  dishPrice: { fontSize: 13, fontWeight: "800", marginLeft: 10 },

  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  eventIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  eventTitle: { fontSize: 15, fontWeight: "600" },
  eventDate: { fontSize: 12, marginTop: 2 },

  infoCard: { borderRadius: 14, padding: 14, gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13 },

  chip: {
    backgroundColor: "rgba(0,0,0,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { fontSize: 12, fontWeight: "600" },

  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 12, fontWeight: "600" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    elevation: 4,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

export default CategoryDetailScreen;