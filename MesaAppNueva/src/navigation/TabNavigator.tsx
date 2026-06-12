// src/navigation/TabNavigator.tsx
import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Importación de las pantallas principales
import HomeScreen from "../screens/home/HomeScreen";
import FavoritesScreen from "../screens/Tabs/FavoritesScreen";
import ProfileScreen from "../screens/Tabs/ProfileScreen";
import CalendarScreen from "../screens/Tabs/CalendarScreen";
import CityMapScreen from "../map/CityMapScreen";

import { useTheme } from "../theme/ThemeContext";

// --- TIPADO DE NAVEGACIÓN ---
// Defino qué pestañas existen para evitar errores de tipeo al navegar.
export type RootTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CalendarTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabNavigator: React.FC = () => {
  // Consumo el tema global para saber si es Dark Mode
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  // Calculo el color de fondo dinámicamente
  const tabBg = isDark ? theme.colors.header : theme.colors.card;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Oculto el header default porque uso mis propios headers
        tabBarActiveTintColor: theme.colors.primary, // Color de marca (Naranja/Morado)
        tabBarInactiveTintColor: theme.colors.textSecondary,

        // --- ESTILOS DE LA BARRA ---
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: theme.colors.border,
          // Ajuste fino: En Android el borde a veces se ve doble, lo quito.
          borderTopWidth: Platform.OS === "android" ? 0 : 0.5,
          height: 64, // Un poco más alto para mejor área táctil
          paddingBottom: 8,
          paddingTop: 6,

          // Sombra para Android (Elevation)
          // La apago en Dark Mode para que no se vea una línea gris fea
          elevation: isDark ? 0 : 8,

          // Sombra para iOS (ShadowProps)
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
        },

        // --- LÓGICA DE ÍCONOS ---
        // Función que decide qué ícono mostrar según la ruta activa
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "HomeTab") iconName = "home-outline";
          if (route.name === "SearchTab") iconName = "map-outline";
          if (route.name === "CalendarTab") iconName = "calendar-outline";
          if (route.name === "FavoritesTab") iconName = "heart-outline";
          if (route.name === "ProfileTab")
            iconName = "ellipsis-horizontal-outline";

          // Devuelvo el componente de ícono vectorial
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* Definición de las Pestañas */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Inicio" }}
      />

      <Tab.Screen
        name="SearchTab"
        component={CityMapScreen} // Integro aquí mi mapa "OpenStreetMap"
        options={{ tabBarLabel: "Mapa" }}
      />

      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{ tabBarLabel: "Calendario" }}
      />

      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{ tabBarLabel: "Favoritos" }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: "Más" }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;