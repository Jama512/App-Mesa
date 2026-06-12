// src/screens/auth/SignUpScreen.tsx
import React, { useState } from "react";
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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useAuth } from "./AuthContext";

type SignUpNav = StackNavigationProp<RootStackParamList, "SignUp">;

interface SignUpErrors {
  ownerName?: string;
  restaurantName?: string;
  email?: string;
  password?: string;
}

const SignUpScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<SignUpNav>();

  // Consumo la funcion de registro del Contexto Global (Conectada a FastAPI)
  const { registerOwner } = useAuth();

  // Estados locales para los campos del formulario
  const [ownerName, setOwnerName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validacion de integridad de datos antes de enviar
  const validate = () => {
    const newErrors: SignUpErrors = {};

    if (!ownerName.trim()) newErrors.ownerName = "Ingresa tu nombre";
    if (!restaurantName.trim())
      newErrors.restaurantName = "Ingresa el nombre del restaurante";

    if (!email.trim()) {
      newErrors.email = "Ingresa tu correo electrónico";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Correo electrónico inválido";
    }

    if (!password.trim()) {
      newErrors.password = "Ingresa una contraseña";
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // Llamada al servicio de registro (100% FastAPI + JWT)
      const success = await registerOwner({
        email,
        password,
        restaurantName,
      });

      if (!success) {
        // Liberar UI si falla
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error de Conexión", "No se pudo conectar con el servidor.");
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        {/* Tarjeta Principal */}
        <View style={styles.card}>
          {/* Encabezado con Logo */}
          <View style={styles.header}>
            <Image
              source={require("../../../assets/LogoMesa.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Registra tu negocio</Text>
          </View>

          {/* Campos del Formulario */}
          <View style={styles.form}>
            <TextInput
              placeholder="Nombre del dueño"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={ownerName}
              onChangeText={setOwnerName}
            />
            {errors.ownerName && (
              <Text style={styles.errorText}>{errors.ownerName}</Text>
            )}

            <TextInput
              placeholder="Nombre del restaurante"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={restaurantName}
              onChangeText={setRestaurantName}
            />
            {errors.restaurantName && (
              <Text style={styles.errorText}>{errors.restaurantName}</Text>
            )}

            <TextInput
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, { marginBottom: 0 }]}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
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
              style={styles.primaryButton}
              onPress={handleSignUp}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Pie de pagina con enlace al Login */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={goToLogin}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const ORANGE = "#FF7A00";
const BLACK = "#000000";
const CARD_BG = "#050505";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BLACK,
  },
  root: {
    flex: 1,
    backgroundColor: BLACK,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 150,
    height: 80,
    marginBottom: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  form: {
    marginTop: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: "#111827",
  },
  errorText: {
    color: "#F97373",
    fontSize: 12,
    marginBottom: 6,
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  footerLink: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
});

export default SignUpScreen;