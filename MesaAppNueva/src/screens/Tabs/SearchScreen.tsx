// src/screens/Tabs/SearchScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
// Importo el contexto para acceder a la "Base de Datos en Memoria"
import { useRestaurants } from "../../context/RestaurantsContext";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";

type SearchNav = StackNavigationProp<RootStackParamList>;

const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<SearchNav>();

  // Consumo los datos precargados (Single Source of Truth)
  const { restaurants } = useRestaurants();

  const [query, setQuery] = useState("");

  // --- MOTOR DE BÚSQUEDA ---
  // Filtra el array de restaurantes en tiempo real.
  // Es eficiente porque trabaja sobre datos ya descargados.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Si no hay texto, no muestro nada para mantener la pantalla limpia
    if (!q) return [];

    return restaurants.filter((item) => {
      // Búsqueda flexible: Coincidencia en Nombre O en Categoría
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = (item.category || "").toLowerCase().includes(q);
      return matchName || matchCat;
    });
  }, [query, restaurants]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      {/* Header Simple */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Explorar
        </Text>
      </View>

      {/* Input de Búsqueda Mejorado */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.textSecondary}
          />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Buscar restaurante o categoría..."
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de Resultados */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          // 🔥 FIX: Leemos el logo de forma segura priorizando logo > coverImage > images[0]
          const itemData = item as Record<string, any>;
          const imageUri = itemData.logo || itemData.coverImage || (itemData.images && itemData.images[0]);

          return (
            <TouchableOpacity
              style={[styles.item, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() =>
                // Navegación al detalle del restaurante seleccionado
                navigation.navigate("CategoryDetail", { restaurantId: item.id })
              }
              activeOpacity={0.85}
            >
              <View style={styles.row}>
                {/* Thumbnail Inteligente (Imagen o Emoji) */}
                <View
                  style={[
                    styles.thumb,
                    { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                  ]}
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                    />
                  ) : (
                    <Text style={{ fontSize: 18 }}>🍽️</Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.itemCat,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.category} • {item.address || "Ver mapa"}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          );
        }}
        // Componente visual cuando no hay resultados o búsqueda vacía
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={query.length > 0 ? "search-outline" : "compass-outline"} 
              size={40} 
              color={theme.colors.border} 
            />
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              {query.length > 0
                ? "No se encontraron resultados."
                : "Escribe arriba para buscar un lugar..."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontWeight: "900", fontSize: 20 },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 14 },
  
  // Estilo actualizado para alojar los iconos dentro del input
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  item: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemName: { fontWeight: "800", fontSize: 16, marginBottom: 2 },
  itemCat: { fontSize: 13, opacity: 0.9, fontWeight: "500" },
  
  emptyContainer: { 
    marginTop: 60, 
    alignItems: "center", 
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, fontWeight: "600" },
});

export default SearchScreen;