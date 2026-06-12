// src/screens/Tabs/FavoritesScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useRestaurants } from "../../context/RestaurantsContext";
import { useLocationState } from "../../context/LocationContext";
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootTabParamList } from "../../navigation/TabNavigator";
import { RootStackParamList } from "../../navigation/StackNavigator";

type TabNav = BottomTabNavigationProp<RootTabParamList, "FavoritesTab">;
type StackNav = StackNavigationProp<RootStackParamList>;
type Nav = CompositeNavigationProp<TabNav, StackNav>;

const doodleBg = require("../../../assets/Background.png");

// --- UTILERÍA: CÁLCULO DE DISTANCIA (Haversine) ---
const toRad = (v: number) => (v * Math.PI) / 180;
const haversineKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
};

const formatDistance = (km: number) => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

const FavoritesScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<Nav>();

  // Consumo datos globales
  const { restaurants, favorites, toggleFavorite } = useRestaurants();
  const { location } = useLocationState();

  // --- FILTRADO DE FAVORITOS (Optimizado) ---
  const favoriteRestaurants = useMemo(() => {
    const set = new Set(favorites);
    return restaurants.filter((r) => set.has(r.id));
  }, [restaurants, favorites]);

  const hasFavorites = favoriteRestaurants.length > 0;

  const openRestaurant = (restaurantId: string) => {
    navigation.navigate("CategoryDetail", { restaurantId });
  };

  return (
    <ImageBackground
      source={doodleBg}
      style={{ flex: 1 }}
      imageStyle={{ opacity: isDark ? 0.08 : 0.14 }}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.header}
        />

        {/* HEADER */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.header,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Favoritos
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Guarda tus restaurantes para volver rápido
          </Text>
        </View>

        {/* LISTA O EMPTY STATE */}
        {hasFavorites ? (
          <FlatList
            data={favoriteRestaurants}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              // 🔥 FIX DE TS: Leemos el logo de forma segura
              const itemData = item as Record<string, any>;
              const imageUri = itemData.logo || itemData.coverImage || (itemData.images && itemData.images[0]);
              const coords = location.coords;

              // Calculo distancia si tengo ubicación del usuario
              const canCalcDistance =
                !!coords &&
                typeof item.latitude === "number" &&
                typeof item.longitude === "number";

              const distanceLabel = canCalcDistance
                ? formatDistance(
                    haversineKm(coords, {
                      latitude: item.latitude as number,
                      longitude: item.longitude as number,
                    })
                  )
                : null;

              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => openRestaurant(item.id)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.left}>
                    {/* Thumbnail del restaurante */}
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.thumb} />
                    ) : (
                      <View
                        style={[
                          styles.thumb,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Ionicons name="restaurant" size={18} color="#fff" />
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.itemName,
                            { color: theme.colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>

                        {itemData.isOwnerRestaurant ? (
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
                        ) : null}
                      </View>

                      <Text
                        style={[
                          styles.itemMeta,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.category}
                        {distanceLabel ? ` • ${distanceLabel}` : ""}
                        {itemData.status ? ` • ${itemData.status}` : ""}
                      </Text>
                    </View>
                  </View>

                  {/* Botón corazón */}
                  <TouchableOpacity
                    onPress={() => toggleFavorite(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.rightActions}
                  >
                    <Ionicons
                      name="heart"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="heart-outline"
              size={30}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              Todavía no tienes restaurantes favoritos.
            </Text>
            <Text
              style={[styles.emptyHint, { color: theme.colors.textSecondary }]}
            >
              Desde un restaurante, toca el corazón para guardarlo aquí.
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("Home", { screen: "HomeTab" })}
              style={[styles.cta, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaText}>Ir a Inicio</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontWeight: "bold", fontSize: 20 },
  headerSubtitle: { marginTop: 4, fontSize: 12 },
  listContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 24 },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 10 },
  thumb: { width: 42, height: 42, borderRadius: 14, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemName: { fontWeight: "800", maxWidth: 190, fontSize: 15 },
  itemMeta: { marginTop: 2, opacity: 0.85, fontSize: 12 },
  ownerPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  ownerPillText: { fontSize: 10, fontWeight: "800" },
  rightActions: { paddingHorizontal: 6, paddingVertical: 6, marginRight: 6 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 10 },
  emptyText: { textAlign: "center", fontWeight: "700" },
  emptyHint: { textAlign: "center", fontSize: 11, opacity: 0.85 },
  cta: { marginTop: 10, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

export default FavoritesScreen;