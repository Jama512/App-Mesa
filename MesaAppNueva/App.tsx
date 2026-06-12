// App.tsx
import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";

// Importación de Contextos Globales
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { AuthProvider } from "./src/screens/auth/AuthContext";
import { LocationProvider } from "./src/context/LocationContext";
import { RestaurantsProvider } from "./src/context/RestaurantsContext";
import { initDB } from "./src/services/database.service"; // Importa tu función

// Componente intermedio para manejar el Tema de la Navegación
const AppNavigator: React.FC = () => {
  // Consumo mi propio contexto de tema
  const { theme } = useTheme();

  // Sincronizo mi tema personalizado con el tema nativo de React Navigation
  // Esto asegura que los headers y fondos de transición coincidan con mi diseño.
  const navigationTheme = {
    ...(theme.name === "light" ? DefaultTheme : DarkTheme),
    colors: {
      ...(theme.name === "light" ? DefaultTheme.colors : DarkTheme.colors),
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StackNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  // Inicializamos la BD local una sola vez al montar la app
  React.useEffect(() => {
    const setupDB = async () => {
      try {
        await initDB();
      } catch (error) {
        console.warn('Warning: SQLite initialization failed (may be expected in dev mode)', error);
      }
    };
    setupDB();
  }, []);

  return (
    // --- ARQUITECTURA DE PROVEEDORES (Provider Pattern) ---
    // Envuelvo la app capa por capa. El orden es CRÍTICO para las dependencias.

    <ThemeProvider>
      {/* 1. AuthProvider: Primero determino la identidad del usuario */}
      <AuthProvider>
        {/* 2. RestaurantsProvider: Necesita leer el usuario del AuthProvider */}
        <RestaurantsProvider>
          {/* 3. LocationProvider: Provee coordenadas a toda la app */}
          <LocationProvider>
            {/* 4. Finalmente, renderizo la navegación */}
            <AppNavigator />
          </LocationProvider>
        </RestaurantsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
