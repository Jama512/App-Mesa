// src/screens/owner/OwnerLayout.tsx
import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ImageBackground,
  Image,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useAuth } from "../auth/AuthContext";

type Nav = StackNavigationProp<RootStackParamList>;

interface OwnerLayoutProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  children: React.ReactNode; // Permite inyectar contenido dinámico dentro
}

const doodleBg = require("../../../assets/Background.png");
const logoMesa = require("../../../assets/LogoMesa.png");

const OwnerLayout: React.FC<OwnerLayoutProps> = ({
  title,
  subtitle,
  showBack = false,
  children,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { state } = useAuth();
  const isDark = theme.name === "dark";

  // Ajuste fino de UI según el tema
  const bgOpacity = isDark ? 0.06 : 0.12;
  const headerBg = isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.55)";
  const headerBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      {/* Fondo Global con marca de agua */}
      <ImageBackground
        source={doodleBg}
        style={styles.bg}
        imageStyle={{ opacity: bgOpacity }}
      >
        {/* HEADER UNIFICADO */}
        <View
          style={[
            styles.headerWrap,
            {
              backgroundColor: headerBg,
              borderBottomColor: headerBorder,
            },
          ]}
        >
          <View style={styles.headerRow}>
            {/* Botón de regreso condicional */}
            {showBack ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.05)",
                    borderColor: headerBorder,
                  },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} /> // Espaciador para mantener centrado
            )}

            {/* Información del Negocio (Siempre visible) */}
            <View style={styles.headerCenter}>
              <Image
                source={logoMesa}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text
                style={[
                  styles.headerRole,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Administrador
              </Text>

              <Text
                style={[styles.headerRestaurant, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {/* Nombre dinámico traído del AuthContext */}
                {state.restaurant?.name || "Restaurante no configurado"}
              </Text>
            </View>

            {/* Espaciador derecho para equilibrio visual */}
            <View style={{ width: 36 }} />
          </View>

          {/* Título de la Sección actual (ej: "Agregar Platillo") */}
          {title ? (
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* CONTENIDO INYECTADO (Children) */}
        <View style={styles.content}>{children}</View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  bg: { flex: 1 },

  headerWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  logo: { width: 72, height: 36 },

  headerRole: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },

  headerRestaurant: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },

  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
  },

  subtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
});

export default OwnerLayout;