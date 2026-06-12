/**
 * src/models/types.ts
 * ⚠️ DEPRECADO: Esta es una capa de compatibilidad hacia atrás
 * Usa types/restaurant.types.ts directamente en nuevo código
 */

// Re-exportamos TODOS los tipos desde la fuente única de verdad
export {
  BaseEntity,
  User,
  Category,
  Dish,
  RestaurantEvent,
  Announcement,
  RestaurantFeatures,
  RestaurantBase,
  Restaurant,
} from "../../types/restaurant.types";

// ==========================================
// TIPOS PARA COMPONENTES UI (Específicos de UI)
// ==========================================
/**
 * Props para componentes de Card/Tarjeta
 * (Útil para nuestras tarjetas de categoría)
 */
export interface CardProps {
  titulo: string;
  subtitulo?: string;
  onPress?: () => void;
  icono?: string;
  imagen?: any; // Para require() de imágenes
}

/**
 * Props para componentes de Lista
 * (Útil para nuestra lista de platillos)
 */
export interface ListItemProps<T> {
  item: T;
  onPress?: (item: T) => void;
  onAdd?: (item: T) => void; // Específico para añadir al carrito
}

// ==========================================
// TIPOS PARA FORMULARIOS
// ==========================================
/**
 * Datos del formulario de Login 
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Datos del formulario de Sign Up (Nuevo)
 */
export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}