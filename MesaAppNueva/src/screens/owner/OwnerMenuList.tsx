// src/screens/owner/OwnerMenuList.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image, // 🔥 Importamos Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { Dish } from "../../context/RestaurantsContext";

import { useMenu, FilterKey } from "../../hooks/useMenu";

type Nav = StackNavigationProp<RootStackParamList, "OwnerMenuList">;

const OwnerMenuList: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<Nav>();

  const {
    dishes,
    isOpen,
    subtitle,
    query,
    setQuery,
    filter,
    setFilter,
    toggleOpenStatus,
    toggleDishAvailability,
    deleteDish,
  } = useMenu();

  // Navegación
  const goToAddDish = () => {
    navigation.navigate("OwnerAddDish", { mode: "create" });
  };

  const goToEditDish = (item: Dish) => {
    navigation.navigate("OwnerAddDish", { mode: "edit", dish: item });
  };

  // --- SUBCOMPONENTES (StatusPill) ---
  const StatusPill = () => (
    <TouchableOpacity
      onPress={toggleOpenStatus}
      activeOpacity={0.9}
      style={[
        styles.statusPill,
        {
          backgroundColor: isOpen
            ? isDark
              ? "rgba(34,197,94,0.16)"
              : "rgba(34,197,94,0.12)"
            : isDark
            ? "rgba(239,68,68,0.18)"
            : "rgba(239,68,68,0.12)",
          borderColor: isOpen ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
        },
      ]}
    >
      <Ionicons
        name={isOpen ? "time-outline" : "alert-circle-outline"}
        size={14}
        color={isOpen ? "#16a34a" : "#ef4444"}
      />
      <Text
        style={[styles.statusText, { color: isOpen ? "#16a34a" : "#ef4444" }]}
      >
        {isOpen ? "Abierto" : "Cerrado"}
      </Text>
      <Text
        style={[styles.statusHint, { color: isOpen ? "#16a34a" : "#ef4444" }]}
      >
        (toca)
      </Text>
    </TouchableOpacity>
  );

  // --- SUBCOMPONENTES (FilterBar) ---
  const FilterBar = () => (
    <View
      style={[
        styles.filterBar,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {[
        { k: "all" as const, label: "Todos" },
        { k: "available" as const, label: "Disponibles" },
        { k: "unavailable" as const, label: "No disponibles" },
      ].map((it) => {
        const active = filter === it.k;
        return (
          <TouchableOpacity
            key={it.k}
            onPress={() => setFilter(it.k as FilterKey)}
            activeOpacity={0.9}
            style={[
              styles.filterBtn,
              {
                backgroundColor: active ? theme.colors.primary : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: active ? "#fff" : theme.colors.textSecondary },
              ]}
            >
              {it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <OwnerLayout title="Menú" subtitle={subtitle} showBack>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          onPress={goToAddDish}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Agregar platillo</Text>
        </TouchableOpacity>

        <StatusPill />
      </View>

      {/* Buscador de texto */}
      <View
        style={[
          styles.searchWrap,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={theme.colors.textSecondary}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Buscar platillo..."
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.8}>
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <FilterBar />

      {/* Lista de Resultados */}
      <FlatList
        data={dishes}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const available = item.isAvailable !== false;

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.cardTop}>
                
                {/* 🔥 AGREGAMOS LA IMAGEN DEL PLATILLO */}
                {item.image ? (
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.dishImage} 
                  />
                ) : (
                  <View style={[styles.dishImagePlaceholder, { backgroundColor: theme.colors.border }]}>
                    <Ionicons name="fast-food-outline" size={24} color={theme.colors.textSecondary} />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.title, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text
                      style={[
                        styles.price,
                        { color: theme.colors.primary },
                      ]}
                    >
                      ${item.price.toFixed(0)}
                    </Text>

                    <TouchableOpacity
                      onPress={() => toggleDishAvailability(item)}
                      activeOpacity={0.9}
                      style={[
                        styles.badge,
                        {
                          backgroundColor: available
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)",
                          borderColor: available
                            ? "rgba(34,197,94,0.35)"
                            : "rgba(239,68,68,0.35)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: available ? "#16a34a" : "#ef4444" },
                        ]}
                      >
                        {available ? "Disponible" : "No disponible"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {item.description ? (
                    <Text
                      style={[
                        styles.desc,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Acciones por ítem (Editar/Eliminar) */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isDark ? "#111111" : "#F3F4F6",
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => goToEditDish(item)}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={theme.colors.text}
                  />
                  <Text
                    style={[styles.actionText, { color: theme.colors.text }]}
                  >
                    Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: "rgba(239,68,68,0.10)",
                      borderColor: "rgba(239,68,68,0.35)",
                    },
                  ]}
                  onPress={() => deleteDish(item)}
                  activeOpacity={0.9}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={[styles.actionText, { color: "#ef4444" }]}>
                    Eliminar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="restaurant-outline"
              size={30}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Sin resultados
            </Text>
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.textSecondary },
              ]}
            >
              No encontramos platillos con ese filtro/búsqueda.
            </Text>

            <TouchableOpacity
              style={[
                styles.emptyBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                setQuery("");
                setFilter("all");
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.emptyBtnText}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </OwnerLayout>
  );
};

// --- ESTILOS ---
const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flex: 1,
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "900", fontSize: 13 },

  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
    gap: 2,
  },
  statusText: { fontSize: 12, fontWeight: "900" },
  statusHint: { fontSize: 9, fontWeight: "900", opacity: 0.85 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600" },

  filterBar: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    marginBottom: 12,
  },
  filterBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
  },
  filterText: { fontSize: 12, fontWeight: "900" },

  listContent: { paddingBottom: 18 },

  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  
  // 🔥 ESTILOS NUEVOS PARA LA IMAGEN DEL PLATILLO
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 2,
  },
  dishImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 14, fontWeight: "900" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  price: { fontSize: 13, fontWeight: "900" },

  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: { fontSize: 11, fontWeight: "900" },

  desc: { fontSize: 12, lineHeight: 16, opacity: 0.95 },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: "900" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
    marginTop: 30,
  },
  emptyTitle: { fontSize: 14, fontWeight: "900" },
  emptyText: { fontSize: 12, textAlign: "center" },
  emptyBtn: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  emptyBtnText: { color: "#fff", fontWeight: "900", fontSize: 13 },
});

export default OwnerMenuList;