// src/screens/auth/LoginScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useAuth } from "./AuthContext";

type LoginNav = StackNavigationProp<RootStackParamList, "Login">;

interface LoginErrors {
  email?: string;
  password?: string;
}

// Importacion de recursos graficos locales
const BG = require("../../../assets/Background.png");
const LOGO = require("../../../assets/LogoMesa.png");

const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<LoginNav>();

  // Consumo la funcion de login del Contexto (Conectada a FastAPI)
  const { loginAsOwner } = useAuth();

  // Estados locales para el manejo del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const ORANGE = theme.colors.primary ?? "#FF7A00";
  // Ajuste dinamico de opacidad segun el tema (Dark/Light)
  const bgOpacity = useMemo(() => (isDark ? 0.1 : 0.14), [isDark]);

  // Validacion local antes de contactar al servidor
  const validate = () => {
    const newErrors: LoginErrors = {};

    if (!email.trim()) newErrors.email = "Ingresa tu correo electrónico";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Correo inválido";

    if (!password.trim()) newErrors.password = "Ingresa tu contraseña";
    else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // Llamamos a FastAPI a traves de tu contexto
      const success = await loginAsOwner({ email, password });

      if (!success) {
        setIsSubmitting(false); // Detenemos la rueda de carga si el AuthContext devolvió false
      }
    } catch (error: any) {
      // Atrapamos si la red se cae por completo
      console.error(error);
      Alert.alert("Error de Conexión", "No se pudo conectar con el servidor.");
      setIsSubmitting(false);
    }
  };

  const goToSignUp = () => navigation.navigate("SignUp");

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Welcome");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#000" }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ImageBackground
        source={BG}
        style={styles.bg}
        imageStyle={{ opacity: bgOpacity }}
      >
        <View
          pointerEvents="none"
          style={[
            styles.overlay,
            {
              backgroundColor: isDark ? "rgba(0,0,0,0.70)" : "rgba(0,0,0,0.62)",
            },
          ]}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.root}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ width: 38 }} />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.headerSmall}>Inicio de sesión</Text>
                <Text style={styles.headerSmall}>Dueños</Text>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              </View>

              <View style={styles.form}>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email)
                      setErrors((p) => ({ ...p, email: undefined }));
                  }}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}

                <View style={styles.passwordWrapper}>
                  <TextInput
                    placeholder="Contraseña"
                    placeholderTextColor="#9CA3AF"
                    style={[
                      styles.input,
                      { marginBottom: 0, paddingRight: 44 },
                    ]}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errors.password)
                        setErrors((p) => ({ ...p, password: undefined }));
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}

                <TouchableOpacity
                  style={styles.forgotButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: ORANGE }]}
                  onPress={handleLogin}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Entrar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Aún no estás en MESA?</Text>
              <TouchableOpacity onPress={goToSignUp} activeOpacity={0.8}>
                <Text style={[styles.footerCta, { color: ORANGE }]}>
                  Registra tu restaurante
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  bg: { flex: 1 },  
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  root: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 18,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  card: {
    backgroundColor: "rgba(0,0,0,0.82)",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardHeader: { alignItems: "center", marginBottom: 18 },
  headerSmall: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  logo: { width: 150, height: 70, marginTop: 14 },

  form: { marginTop: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: "#111827",
  },
  passwordWrapper: { position: "relative" },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    marginBottom: 6,
    marginTop: -6,
  },
  forgotButton: { alignSelf: "flex-start", marginTop: 4, marginBottom: 16 },
  forgotText: { color: "#D1D5DB", fontSize: 12 },

  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  footer: { alignItems: "center", paddingTop: 10 },
  footerText: { color: "#FFFFFF", fontSize: 12, marginBottom: 4 },
  footerCta: { fontSize: 12, fontWeight: "700" },
});

export default LoginScreen;