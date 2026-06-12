/**
 * src/config/api.config.ts
 * Configuración centralizada de URLs y endpoints de la API FastAPI
 * 
 * Usando ngrok para desarrollo online:
 * https://aware-dramatic-manatee.ngrok-free.dev
 */

// 🌐 URL BASE DE LA API (Ngrok)
const NGROK_URL = "https://app-mesa.onrender.com";

// ==========================================
// ENDPOINTS PRINCIPALES
// ==========================================
export const API_ENDPOINTS = {
  // Autenticación
  REGISTER: `${NGROK_URL}/register`,
  LOGIN: `${NGROK_URL}/login`,

  // Restaurantes
  RESTAURANTS_LIST: `${NGROK_URL}/restaurants/`,
  RESTAURANTS_CREATE: `${NGROK_URL}/restaurants/`,
  RESTAURANTS_ME: `${NGROK_URL}/restaurants/me`,
  RESTAURANTS_GET_ID: (id: string) => `${NGROK_URL}/restaurants/${id}`,
  RESTAURANTS_DELETE: (id: string) => `${NGROK_URL}/restaurants/${id}`,
  RESTAURANTS_DELETE_ALL: `${NGROK_URL}/restaurants/`,

  // Menú
  MENU_ADD: `${NGROK_URL}/restaurants/me/menu`,
  MENU_UPDATE: (dishId: string) => `${NGROK_URL}/restaurants/me/menu/${dishId}`,
  MENU_DELETE: (dishId: string) => `${NGROK_URL}/restaurants/me/menu/${dishId}`,

  // Eventos
  EVENTS_ADD: `${NGROK_URL}/restaurants/me/events`,
  EVENTS_UPDATE: (eventId: string) => `${NGROK_URL}/restaurants/me/events/${eventId}`,
  EVENTS_DELETE: (eventId: string) => `${NGROK_URL}/restaurants/me/events/${eventId}`,

  // Multimedia
  UPLOAD_IMAGE: `${NGROK_URL}/upload/image/`,
};

// ==========================================
// HEADERS COMUNES
// ==========================================
export const getHeaders = (token?: string, isFormData: boolean = false) => {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  // Solo agregar Content-Type si NO es FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Agregar token de autenticación si se proporciona
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// ==========================================
// TIMEOUTS Y REINTENTOS
// ==========================================
export const API_CONFIG = {
  TIMEOUT_MS: 10000,
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1000,
};
