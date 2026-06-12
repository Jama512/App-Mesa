// src/navigation/StackNavigator.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigatorScreenParams } from "@react-navigation/native";

// Auth
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";

// Tabs (Navegación Principal)
import TabNavigator, { RootTabParamList } from "./TabNavigator";

// Guest detail
import CategoryDetailScreen from "../screens/home/CategoryDetailScreen";

// Owner flow (Pantallas administrativas)
import OwnerDashboard from "../screens/owner/OwnerDashboard";
import OwnerCreateAnnouncement from "../screens/owner/OwnerCreateAnnouncement";
import OwnerMenuList from "../screens/owner/OwnerMenuList";
import OwnerProfile from "../screens/owner/OwnerProfile";
import OwnerAddDish from "../screens/owner/OwnerAddDish";
import OwnerLocationPicker from "../screens/owner/OwnerLocationPicker";
// 🔥 NUEVA PANTALLA: Importamos el calendario del dueño
import OwnerEventsScreen from "../screens/owner/OwnerEventsScreen"; 

// Consumo el estado global de autenticación
import { useAuth } from "../screens/auth/AuthContext";
// Optimización: Importamos SOLO EL TIPO para evitar dependencias circulares en Metro Bundler
import type { Dish } from "../context/RestaurantsContext";

// --- TIPADO ESTRICTO DE RUTAS ---
export type RootStackParamList = {
  // Flujo de Invitado / Auth
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: NavigatorScreenParams<RootTabParamList>; 
  CategoryDetail: { restaurantId: string };

  // Flujo de Dueño (Admin)
  OwnerDashboard: undefined;
  OwnerCreateAnnouncement: undefined;
  OwnerMenuList: undefined;
  OwnerProfile: undefined;
  OwnerAddDish: { mode?: "create" | "edit"; dish?: Dish } | undefined;
  OwnerLocationPicker: undefined;
  // 🔥 NUEVA RUTA: Declaramos la pantalla en TypeScript
  OwnerEventsScreen: undefined; 
};

const Stack = createStackNavigator<RootStackParamList>();

const StackNavigator: React.FC = () => {
  const { state } = useAuth();
  const isOwner = state.isAuthenticated && state.role === "owner";

  return (
    <Stack.Navigator
      key={isOwner ? "owner-stack" : "guest-stack"}
      screenOptions={{ headerShown: false }}
    >
      {/* --- NAVEGACIÓN PROTEGIDA (RBAC) --- */}
      {isOwner ? (
        <>
          <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
          <Stack.Screen name="OwnerCreateAnnouncement" component={OwnerCreateAnnouncement} />
          <Stack.Screen name="OwnerMenuList" component={OwnerMenuList} />
          <Stack.Screen name="OwnerAddDish" component={OwnerAddDish} />
          <Stack.Screen name="OwnerProfile" component={OwnerProfile} />
          <Stack.Screen name="OwnerLocationPicker" component={OwnerLocationPicker} />
          
          {/* 🔥 NUEVO COMPONENTE: Registramos la pantalla en el Stack del Dueño */}
          <Stack.Screen name="OwnerEventsScreen" component={OwnerEventsScreen} />

          {/* El dueño también puede ver la vista de usuario para previsualizar */}
          <Stack.Screen name="Home" component={TabNavigator} />
          <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Home" component={TabNavigator} />
          <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackNavigator;