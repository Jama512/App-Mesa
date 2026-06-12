// src/hooks/useMenu.ts
import { useState, useMemo } from "react";
import { useRestaurants, Dish } from "../context/RestaurantsContext";
import { Alert } from "react-native";

export type FilterKey = "all" | "available" | "unavailable";

export const useMenu = () => {
  // 1. Consumir datos Y ACCIONES del Global State (Conectado a FastAPI + Offline Sync)
  const { restaurants, upsertOwnerRestaurant, removeDish: contextRemoveDish } = useRestaurants();

  // 2. Lógica de selección del restaurante propio
  const ownerRestaurant = useMemo(
    () => restaurants.find((r) => r.isOwnerRestaurant) ?? null,
    [restaurants]
  );

  const dishes = useMemo(() => ownerRestaurant?.menu || [], [ownerRestaurant]);
  const ownerStatus = ownerRestaurant?.status ?? "Abierto ahora";
  const isOpen = /abierto/i.test(ownerStatus);

  // 3. Estados locales de la UI (Búsqueda y Filtros)
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  // 4. Lógica de Filtrado (Business Logic)
  const filteredDishes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((d) => {
      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q);

      const matchFilter =
        filter === "all"
          ? true
          : filter === "available"
          ? d.isAvailable !== false
          : d.isAvailable === false;

      return matchQuery && matchFilter;
    });
  }, [dishes, query, filter]);

  // 5. Estadísticas
  const totalCount = dishes.length;
  const availableCount = dishes.filter((d) => d.isAvailable !== false).length;
  const subtitle =
    totalCount === 0
      ? "Aún no tienes platillos registrados."
      : `Tienes ${totalCount} platillo${
          totalCount === 1 ? "" : "s"
        } (${availableCount} disponible${availableCount === 1 ? "" : "s"}).`;

  // 6. Manejadores de Acciones (Ahora pasan por tu Vigilante Offline)
  const toggleOpenStatus = async () => {
    try {
      await upsertOwnerRestaurant({
        status: isOpen ? "Cerrado" : "Abierto ahora",
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  const toggleDishAvailability = async (item: Dish) => {
    // Optimistic UI logic: calculamos el nuevo menú
    const newMenu = dishes.map((d) => {
      if (d.id === item.id) return { ...d, isAvailable: !d.isAvailable };
      return d;
    });
    
    try {
      await upsertOwnerRestaurant({ menu: newMenu });
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar la disponibilidad");
    }
  };

  const deleteDish = (item: Dish) => {
    Alert.alert(
      "Eliminar platillo",
      `¿Seguro que deseas eliminar "${item.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (contextRemoveDish) {
              await contextRemoveDish(item.id);
            }
          },
        },
      ]
    );
  };

  return {
    // Data
    dishes: filteredDishes,
    isOpen,
    subtitle,
    // UI State
    query,
    setQuery,
    filter,
    setFilter,
    // Actions
    toggleOpenStatus,
    toggleDishAvailability,
    deleteDish,
  };
};