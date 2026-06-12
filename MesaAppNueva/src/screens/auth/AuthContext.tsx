// src/screens/auth/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Alert } from "react-native";

// IMPORTANTE: Nuestro servicio Offline-First (SQLite)
import { 
  initDB, 
  saveSessionLocally, 
  getLocalSession, 
  clearLocalSession 
} from "../../services/database.service";

// Definicion de Tipos
type UserRole = "guest" | "owner";

export interface RestaurantProfile {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  features?: any;
  images?: string[];
  latitude?: number;
  longitude?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  email?: string;
  restaurant?: RestaurantProfile;
  isLoading: boolean;
  userId?: string;
}

interface LoginPayload {
  email: string;
  password?: string;
  restaurantName?: string;
}

interface AuthContextValue {
  state: AuthState;
  loginAsOwner: (data: LoginPayload) => Promise<boolean>;
  registerOwner: (data: LoginPayload) => Promise<boolean>;
  continueAsGuest: () => void;
  logout: () => void;
  updateRestaurant: (data: Partial<RestaurantProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEFAULT_RESTAURANT_NAME = "Mi Restaurante";
const API_URL = "https://app-mesa.onrender.com";

const decodeJWT = (token: string) => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const atob = (input: string) => {
      let str = input.replace(/=+$/, '');
      let output = '';
      // Corrección TS: Doble paréntesis para asignaciones dentro de la condición del loop
      for (let bc = 0, bs = 0, buffer, i = 0;
        ((buffer = str.charAt(i++)));
        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
          bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
      ) {
        buffer = chars.indexOf(buffer);
      }
      return output;
    };
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: "guest",
    isLoading: true,
  });

  // 1. LISTENER DE SESION OFFLINE-FIRST (Sin Firebase)
  useEffect(() => {
    initDB();

    const loadOfflineSession = async () => {
      try {
        const session: any = await getLocalSession();
        if (session && session.token) {
          const decoded = decodeJWT(session.token);
          
          if (decoded && decoded.sub) {
            const userData = session.user_data ? JSON.parse(session.user_data) : {};
            setState({
              isAuthenticated: true,
              role: "owner",
              email: userData.email,
              userId: decoded.sub, // Extraemos el ID real del servidor Python
              restaurant: userData.restaurant,
              isLoading: false,
            });
            console.log("⚡ Sesión JWT cargada desde SQLite (Offline-First)");
            return;
          }
        }
      } catch (error) {
        console.log("No hay sesión local previa.");
      }
      // Si falla o no hay sesión, apagamos la carga y nos quedamos como invitados
      setState(prev => ({ ...prev, isLoading: false }));
    };

    loadOfflineSession();
  }, []);

  // 2. REGISTRO DE USUARIO (Conectado a FastAPI)
  const registerOwner = useCallback(async (data: LoginPayload) => {
    if (!data.password) {
      Alert.alert("Error", "La contraseña es obligatoria.");
      return false;
    }

    try {
      // 1️⃣ REGISTRAR USUARIO EN LA API
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "No se pudo crear la cuenta.");
      }

      const resData = await response.json();
      const token = resData.access_token;
      const decoded = decodeJWT(token);
      const userId = decoded.sub;

      // Función para generar UUID simple
      const generateSimpleUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // 2️⃣ CREAR RESTAURANTE INMEDIATAMENTE
      const restaurantId = generateSimpleUUID();
      const restaurantPayload = {
        id: restaurantId,
        ownerId: userId,
        name: data.restaurantName || DEFAULT_RESTAURANT_NAME,
        status: "Abierto ahora",
        category: "General",
        address: "Sin dirección",
        phone: "0000000000",
        description: "",
        latitude: 0,
        longitude: 0,
        rating: 5.0,
        features: {},
        images: [],
        menu: [],
        events: []
      };

      const restaurantResponse = await fetch(`${API_URL}/restaurants/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(restaurantPayload)
      });

      if (!restaurantResponse.ok) {
        const errData = await restaurantResponse.json().catch(() => ({}));
        console.warn("⚠️ No se pudo crear restaurante en SignUp:", errData);
        // No fallar el registro si falla el restaurante, continuaremos
      } else {
        console.log("✅ Restaurante creado en SignUp:", restaurantId);
      }

      // 3️⃣ GUARDAR SESIÓN LOCALMENTE
      const fullUserData = {
        email: data.email,
        userId: userId,
        restaurant: { name: data.restaurantName || DEFAULT_RESTAURANT_NAME }
      };

      saveSessionLocally(token, JSON.stringify(fullUserData));

      setState({
        isAuthenticated: true,
        role: "owner",
        email: data.email,
        userId: userId,
        restaurant: fullUserData.restaurant,
        isLoading: false,
      });

      return true;
    } catch (error: any) {
      Alert.alert("Error de registro", error.message);
      return false;
    }
  }, []);

  // 3. INICIO DE SESIÓN (Conectado a FastAPI)
  const loginAsOwner = useCallback(async (data: LoginPayload) => {
    if (!data.password) {
      Alert.alert("Error", "Ingresa tu contraseña.");
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password })
      });

      if (!response.ok) {
        throw new Error("Correo o contraseña incorrectos.");
      }

      const resData = await response.json();
      const token = resData.access_token;
      const decoded = decodeJWT(token);
      const userId = decoded.sub;

      const fullUserData = {
        email: data.email,
        userId: userId,
        restaurant: { name: DEFAULT_RESTAURANT_NAME }
      };

      saveSessionLocally(token, JSON.stringify(fullUserData));

      setState({
        isAuthenticated: true,
        role: "owner",
        email: data.email,
        userId: userId,
        restaurant: fullUserData.restaurant,
        isLoading: false,
      });

      return true;
    } catch (error: any) {
      Alert.alert("Error de acceso", error.message);
      return false;
    }
  }, []);

  // Acceso como invitado
  const continueAsGuest = useCallback(() => {
    setState((prev) => ({ ...prev, isAuthenticated: true, role: "guest" }));
  }, []);

  // Cierre de sesión (Destruye el JWT local)
  const logout = useCallback(async () => {
    try {
      clearLocalSession();
      setState({
        isAuthenticated: false,
        role: "guest",
        isLoading: false,
      });
    } catch (e) {
      Alert.alert("Error", "No se pudo cerrar sesión.");
    }
  }, []);

  const updateRestaurant = useCallback((data: Partial<RestaurantProfile>) => {
    setState((prev) => {
      const prevRest = prev.restaurant ?? { name: DEFAULT_RESTAURANT_NAME };
      return {
        ...prev,
        restaurant: { ...prevRest, ...data },
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      state,
      loginAsOwner,
      registerOwner,
      continueAsGuest,
      logout,
      updateRestaurant,
    }),
    [state, loginAsOwner, registerOwner, continueAsGuest, logout, updateRestaurant]
  );

  if (state.isLoading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};