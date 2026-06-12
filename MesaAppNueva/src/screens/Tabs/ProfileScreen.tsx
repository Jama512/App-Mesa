// src/screens/Tabs/ProfileScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../screens/auth/AuthContext";

import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { CompositeNavigationProp } from "@react-navigation/native";

import { RootTabParamList } from "../../navigation/TabNavigator";
import { RootStackParamList } from "../../navigation/StackNavigator";

type TabNav = BottomTabNavigationProp<RootTabParamList, "ProfileTab">;
type StackNav = StackNavigationProp<RootStackParamList>;
type Nav = CompositeNavigationProp<TabNav, StackNav>;

const ProfileScreen: React.FC = () => {
  // Consumo el tema para el modo oscuro/claro
  const { theme, toggleTheme } = useTheme();
  const isDark = theme.name === "dark";

  // Consumo el estado de autenticación
  const { state, logout } = useAuth();
  const navigation = useNavigation<Nav>();

  const isOwner = state.role === "owner";
  const ownerEmail = state.email ?? "Usuario invitado";

  // 1. LÓGICA DE NAVEGACIÓN INTELIGENTE
  const handleMainButton = () => {
    if (isOwner) {
      // Si ya está autenticado como dueño, lo llevo a su panel de control
      navigation.navigate("OwnerDashboard"); // 🔥 Eliminado el 'as any' innecesario
    } else {
      // Si es un invitado, lo llevo al flujo de autenticación
      navigation.navigate("Login");
    }
  };

  // 2. CIERRE DE SESIÓN
  const handleLogout = () => {
    // Llama a la función del contexto que limpia el estado y desconecta el backend
    logout();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      {/* TARJETA DE CONFIGURACIÓN */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? "#111111" : "#FFFFFF" },
        ]}
      >
        <Text style={[styles.logoText, { color: theme.colors.primary }]}>
          MESA
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Apariencia
        </Text>

        {/* Toggle de Modo Oscuro */}
        <View
          style={[
            styles.toggleRow,
            { backgroundColor: isDark ? "#1E1E1E" : "#222222" },
          ]}
        >
          <Text style={[styles.toggleLabel, { color: "#FFFFFF" }]}>
            Modo oscuro
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? "#FFA726" : "#F5F5F5"}
            trackColor={{ false: "#888888", true: "#FFA726" }}
          />
        </View>
      </View>

      {/* SECCIÓN LEGAL (Placeholders funcionales) */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? "#111111" : "#FFFFFF" },
        ]}
      >
        <Text
          style={[
            styles.subSectionTitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          LEGAL Y SOPORTE
        </Text>

        <TouchableOpacity
          style={[
            styles.listItem,
            { backgroundColor: isDark ? "#1E1E1E" : "#F3F3F3" },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.listItemText, { color: theme.colors.text }]}>
            Términos y Condiciones
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
            &gt;
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.listItem,
            { backgroundColor: isDark ? "#1E1E1E" : "#F3F3F3" },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.listItemText, { color: theme.colors.text }]}>
            Política de privacidad
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
            &gt;
          </Text>
        </TouchableOpacity>
      </View>

      {/* ÁREA DE ACCIÓN DEL USUARIO (Renderizado Condicional) */}
      <View style={styles.footer}>
        <Text style={[styles.footerLabel, { color: theme.colors.text }]}>
          {isOwner ? "Administración" : "¿Eres dueño?"}
        </Text>

        {/* Botón Principal: Cambia su función según el rol */}
        <TouchableOpacity
          style={[
            styles.ownerButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleMainButton}
          activeOpacity={0.9}
        >
          <Text style={styles.ownerButtonText}>
            {isOwner
              ? "Ir a mi Panel de Restaurante"
              : "Inicia sesión como dueño"}
          </Text>
        </TouchableOpacity>

        {/* Botón de Logout: Solo visible si hay sesión activa */}
        {isOwner && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={[styles.logoutText, { color: "#EF4444" }]}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        )}

        {/* Indicador de estado de sesión */}
        <Text
          style={[styles.footerCaption, { color: theme.colors.textSecondary }]}
        >
          {isOwner
            ? `Sesión iniciada como: ${ownerEmail}`
            : "Estás navegando como invitado."}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleLabel: { fontSize: 14, fontWeight: "500" },
  subSectionTitle: { fontSize: 11, fontWeight: "600", marginBottom: 8 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  listItemText: { flex: 1, fontSize: 14, fontWeight: "500" },
  chevron: { fontSize: 18, fontWeight: "600" },
  footer: { marginTop: 24, alignItems: "center", paddingHorizontal: 24 },
  footerLabel: { fontSize: 13, marginBottom: 8 },

  ownerButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    width: "100%",
    alignItems: "center",
  },
  ownerButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  logoutButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  logoutText: { fontSize: 13, fontWeight: "600" },

  footerCaption: { fontSize: 11, marginTop: 6, textAlign: "center" },
});

export default ProfileScreen;