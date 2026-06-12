// src/screens/home/HomeScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FONT_SIZES } from "../../../types";
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { RootTabParamList } from "../../navigation/TabNavigator";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";

// Consumo de Contextos Globales
import { useLocationState } from "../../context/LocationContext";
import { useRestaurants } from "../../context/RestaurantsContext";

// 🔥 Importar categorías predefinidas del Owner
import { PREDEFINED_CATEGORIES } from "../owner/OwnerProfile";

type HomeTabNav = BottomTabNavigationProp<RootTabParamList, "HomeTab">;
type RootNav = StackNavigationProp<RootStackParamList>;
type HomeScreenNavigationProp = CompositeNavigationProp<HomeTabNav, RootNav>;

const doodleBg = require("../../../assets/Background.png");

// ---------- ALGORITMO DE DISTANCIA (Haversine) ----------
const toRad = (v: number) => (v * Math.PI) / 180;

const haversineMeters = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) => {
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
};

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

// 🔥 Mapeo de categorías a iconos
const CATEGORY_ICONS: Record<string, "pizza" | "restaurant" | "cafe" | "wine" | "ice-cream" | "fast-food" | "gift" | "flame"> = {
  "pizza": "pizza",
  "pizzería": "pizza",
  "tacos": "restaurant",
  "café": "cafe",
  "bar": "wine",
  "postres": "gift",
  "helados": "ice-cream",
  "restaurante": "restaurant",
  "general": "restaurant",
  "comida rápida": "fast-food",
  "comida rapida": "fast-food",
  "chino": "restaurant",
  "italiano": "restaurant",
  "mexicano": "restaurant",
  "variado": "restaurant",
  "parrilla": "flame",
  "mariscos": "restaurant",
  "comida china": "restaurant",
  "comida italiana": "restaurant",
};

const getIconForCategory = (category: string): "pizza" | "restaurant" | "cafe" | "wine" | "ice-cream" | "fast-food" | "gift" | "flame" => {
  return CATEGORY_ICONS[category?.toLowerCase()] || "restaurant";
};

type RestaurantCardItem = {
  id: string;
  name: string;
  category: string;
  rating: number;
  status: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number | null;
  distanceLabel: string;
  imageUri?: string; // Logo
  coverImage?: string; // 🔥 Nueva propiedad para la foto grande
  isOwnerRestaurant?: boolean;
};

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const { location } = useLocationState();
  const { restaurants } = useRestaurants();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const searchBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.78)";
  const searchBorder = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.06)";

  // 🔥 EXTRAER CATEGORÍAS DINÁMICAS DE LOS RESTAURANTES REALES
  const dynamicCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    
    // Agregar categorías predefinidas
    PREDEFINED_CATEGORIES.forEach(cat => {
      categoriesSet.add(cat.name);
    });
    
    // Agregar categorías de restaurantes reales (por si hay custom)
    restaurants.forEach((r) => {
      if (r.category && r.category !== "null" && r.category.toLowerCase() !== "restaurante") {
        categoriesSet.add(r.category);
      }
    });

    const result = Array.from(categoriesSet)
      .sort()
      .map((name, index) => ({
        id: String(index),
        name,
        icon: getIconForCategory(name),
      }));

    // 🔍 DEBUG: Ver qué categorías se extrajeron
    console.log("✅ CATEGORÍAS DINÁMICAS EXTRAÍDAS:", result.map(c => c.name));
    console.log("   Restaurantes totales:", restaurants.length);
    restaurants.forEach(r => {
      if (r.category) console.log(`   - ${r.name}: ${r.category}`);
    });

    return result;
  }, [restaurants]);

  const todayEvents = useMemo(() => {
    const events: any[] = [];
    restaurants.forEach((r) => {
      if (r.events && r.events.length > 0) {
        r.events.forEach((e: any) => {
          const label = (e.dateLabel || "").toLowerCase();
          if (label.includes("hoy")) {
            events.push({
              id: e.id,
              title: e.title,
              subtitle: `${e.dateLabel} · ${r.name}`,
              badge: "Hoy",
              restaurantId: r.id,
              imageUrl: e.imageUrl || e.image || e.posterUri 
            });
          }
        });
      }
    });
    return events.reverse();
  }, [restaurants]);

  const computedRestaurants: RestaurantCardItem[] = useMemo(() => {
    const userCoords = location.coords;

    const base: RestaurantCardItem[] = restaurants.map((r: any) => {
      const hasCoords =
        userCoords &&
        typeof r.latitude === "number" &&
        typeof r.longitude === "number";

      const distanceMeters = hasCoords
        ? haversineMeters(userCoords!, {
            latitude: r.latitude,
            longitude: r.longitude,
          })
        : null;

      return {
        id: r.id,
        name: r.name,
        category: r.category ?? "Restaurante",
        rating: typeof r.rating === "number" ? r.rating : 4.7,
        status: r.isOwnerRestaurant ? "Administrando" : "Abierto ahora",
        latitude: r.latitude,
        longitude: r.longitude,
        distanceMeters,
        distanceLabel:
          distanceMeters != null ? formatDistance(distanceMeters) : "—",
        imageUri: r.logo,
        coverImage: r.coverImage || (r.images && r.images[0]), // 🔥 Intentamos sacar una foto grande
        isOwnerRestaurant: !!r.isOwnerRestaurant,
      };
    });

    if (location.coords) {
      const head = base.filter((r) => r.isOwnerRestaurant);
      const rest = base.filter((r) => !r.isOwnerRestaurant);

      rest.sort((a, b) => {
        const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
        const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
        return da - db;
      });

      return [...head, ...rest];
    }

    return base;
  }, [restaurants, location.coords]);

  const filteredRestaurants = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = selectedCategory?.toLowerCase().trim();

    return computedRestaurants.filter((r) => {
      const matchText =
        !q || `${r.name} ${r.category}`.toLowerCase().includes(q);
      
      // 🔥 Filtro de categoría: busca coincidencia exacta o parcial
      const matchCat = !cat || r.category.toLowerCase().trim() === cat || r.category.toLowerCase().includes(cat);
      
      return matchText && matchCat;
    });
  }, [query, computedRestaurants, selectedCategory]);

  const toggleCategory = (catName: string) => {
    if (selectedCategory === catName) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catName);
    }
  };

  return (
    <ImageBackground
      source={doodleBg}
      style={{ flex: 1 }}
      imageStyle={{ opacity: isDark ? 0.1 : 0.18 }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDark ? "light-content" : "dark-content"}
        />

        <View style={styles.header}>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={16}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.locationText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              Ubicación actual: {location.label}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: searchBg, borderColor: searchBorder },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar lugar, comida o evento"
              placeholderTextColor={theme.colors.textSecondary}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* EVENTOS DEL DÍA CON FLYER */}
          {todayEvents.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text, fontSize: FONT_SIZES.medium },
                ]}
              >
                Eventos de hoy
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {todayEvents.map((event) => (
                  <TouchableOpacity
                    key={`${event.restaurantId}-${event.id}`}
                    style={[
                      styles.eventCard,
                      { backgroundColor: theme.colors.card },
                    ]}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("CategoryDetail", {
                        restaurantId: event.restaurantId,
                      })
                    }
                  >
                    {/* 🔥 Si el evento tiene Flyer, lo mostramos como fondo */}
                    {event.imageUrl ? (
                       <ImageBackground 
                          source={{ uri: event.imageUrl }} 
                          style={styles.eventImageBg}
                          imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                       >
                         <View style={styles.eventOverlay}>
                           <View style={styles.eventBadge}>
                             <Text style={styles.eventBadgeText}>{event.badge}</Text>
                           </View>
                           <View>
                              <Text style={[styles.eventTitle, { color: "#fff" }]} numberOfLines={2}>
                                {event.title}
                              </Text>
                              <Text style={[styles.eventSubtitle, { color: "#eee" }]} numberOfLines={1}>
                                {event.subtitle}
                              </Text>
                           </View>
                         </View>
                       </ImageBackground>
                    ) : (
                      // Diseño original si no hay foto
                      <View style={{ padding: 14 }}>
                        <View style={styles.eventBadge}>
                          <Text style={styles.eventBadgeText}>{event.badge}</Text>
                        </View>
                        <Text
                          style={[styles.eventTitle, { color: theme.colors.text }]}
                          numberOfLines={2}
                        >
                          {event.title}
                        </Text>
                        <Text
                          style={[
                            styles.eventSubtitle,
                            { color: theme.colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {event.subtitle}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, fontSize: FONT_SIZES.medium },
              ]}
            >
              Categorías
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {dynamicCategories.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primary
                          : theme.colors.card,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => toggleCategory(cat.name)}
                  >
                    <View
                      style={[
                        styles.categoryIconCircle,
                        {
                          backgroundColor: isActive
                            ? "#FFFFFF"
                            : theme.colors.primary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={18}
                        color={isActive ? theme.colors.primary : "#FFFFFF"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        { color: isActive ? "#FFFFFF" : theme.colors.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, fontSize: FONT_SIZES.medium },
              ]}
            >
              Cerca de ti {selectedCategory ? `(${selectedCategory})` : ""}
            </Text>

            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((rest) => (
                <TouchableOpacity
                  key={rest.id}
                  style={[
                    styles.restaurantCardPremium, // 🔥 Usamos el nuevo estilo premium
                    { backgroundColor: theme.colors.card },
                  ]}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate("CategoryDetail", {
                      restaurantId: rest.id,
                    })
                  }
                >
                  {/* 🔥 Imagen de portada grande */}
                  {rest.coverImage ? (
                    <Image source={{ uri: rest.coverImage }} style={styles.premiumCover} />
                  ) : (
                    <View style={[styles.premiumCoverPlaceholder, { backgroundColor: theme.colors.border }]}>
                        <Ionicons name="restaurant-outline" size={32} color={theme.colors.textSecondary} />
                    </View>
                  )}

                  <View style={styles.premiumInfo}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.restaurantName,
                            { color: theme.colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {rest.name}
                        </Text>

                        {rest.isOwnerRestaurant && (
                          <View
                            style={[
                              styles.ownerPill,
                              { borderColor: theme.colors.primary },
                            ]}
                          >
                            <Text
                              style={[
                                styles.ownerPillText,
                                { color: theme.colors.primary },
                              ]}
                            >
                              Tu restaurante
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.restaurantMeta,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {rest.category} · {rest.distanceLabel}
                      </Text>
                      
                      <Text
                        style={[
                          styles.restaurantStatus,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {rest.status}
                      </Text>
                    </View>

                    <View style={styles.restaurantRight}>
                      <View
                        style={[
                          styles.ratingBadge,
                          { backgroundColor: searchBg },
                        ]}
                      >
                        <Ionicons name="star" size={14} color="#FFD166" />
                        <Text style={styles.ratingText}>
                          {rest.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: theme.colors.textSecondary }}>
                  No se encontraron lugares en esta categoría.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 46 : 8,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontSize: 13, fontWeight: "600", flexShrink: 1 },

  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },

  section: { marginTop: 4, marginBottom: 16 },
  sectionTitle: { fontWeight: "600", marginBottom: 10 },

  // 🔥 Estilos de evento actualizados para soportar fondo
  eventCard: {
    width: 220,
    height: 120, // Altura fija para que la foto se vea bien
    borderRadius: 16,
    marginRight: 12,
    overflow: "hidden",
  },
  eventImageBg: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  eventOverlay: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.4)', // Oscurecemos la foto para que resalte el texto blanco
    justifyContent: 'space-between',
  },
  eventBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E67E22",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 8,
  },
  eventBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  eventTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  eventSubtitle: { fontSize: 12 },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
  },
  categoryIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  categoryText: { fontSize: 13, fontWeight: "500" },

  // 🔥 Estilos de la tarjeta Premium de Restaurante
  restaurantCardPremium: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden", // Importante para que la imagen respete las esquinas redondas
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  premiumCover: {
    width: "100%",
    height: 140, // Foto grande y atractiva
    resizeMode: "cover",
  },
  premiumCoverPlaceholder: {
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  premiumInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  restaurantName: { fontSize: 16, fontWeight: "700", flexShrink: 1 },

  ownerPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  ownerPillText: { fontSize: 10, fontWeight: "700" },

  restaurantMeta: { fontSize: 13 },
  restaurantStatus: { fontSize: 12, marginTop: 2, fontWeight: "500" },

  restaurantRight: {
    alignItems: "flex-end",
    justifyContent: "flex-start", // Alineamos la estrella arriba
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: "#FFD166",
    fontSize: 13,
    marginLeft: 4,
    fontWeight: "700",
  },
});

export default HomeScreen;