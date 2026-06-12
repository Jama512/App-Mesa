/**
 * types/restaurant.types.ts
 * FUENTE ÚNICA DE VERDAD para todos los tipos de MESA
 * Consolidada de src/models/types.ts y types/restaurant.types.ts
 */

// ==========================================
// 1. TIPOS BASE
// ==========================================
export interface BaseEntity {
  id: string;
}

// ==========================================
// 2. ENTIDADES DE USUARIO
// ==========================================
export interface User extends BaseEntity {
  fullName: string;
  email: string;
  role?: 'owner' | 'client';
}

// ==========================================
// 3. CATEGORÍAS
// ==========================================
export interface Category extends BaseEntity {
  title: string;
  image?: string; // URL de la imagen servida por tu backend
}

// ==========================================
// 4. PLATILLOS/DISHES (Fuente única de verdad)
// ==========================================
/**
 * Platillo del menú. Puede pertenecer a una categoría.
 * - name: Nombre del platillo (ej. "Pizza Pepperoni")
 * - price: Precio en número para cálculos
 * - isAvailable: ⚠️ CRÍTICO: Indica si está disponible en el momento
 * - categoryId: Referencia al ID de la categoría (nuevo en Backend)
 */
export type Dish = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId?: string; // Referencia al ID de la categoría
  category?: string; // Nombre en texto de la categoría
  isAvailable?: boolean; // ⚠️ NUEVO: Soporte para disponibilidad
};

// ==========================================
// 5. EVENTOS/ANUNCIOS
// ==========================================
/**
 * Evento o anuncio publicado por un restaurante
 * Combina campos de RestaurantEvent + Announcement
 */
export type RestaurantEvent = {
  id: string;
  title: string;
  dateLabel: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  imageUrl?: string;
  image?: string; // Para retrocompatibilidad
  posterUri?: string; // Para retrocompatibilidad (local)
  createdAt?: Date;
};

// Alias para compatibilidad
export type Announcement = RestaurantEvent;

// ==========================================
// 6. CARACTERÍSTICAS DEL RESTAURANTE
// ==========================================
export type RestaurantFeatures = {
  wifi?: boolean;
  outdoorSeating?: boolean;
  parking?: boolean;
  reservations?: boolean;
  delivery?: boolean;
  cardPayment?: boolean;
};

// ==========================================
// 7. RESTAURANTE (Entidad principal)
// ==========================================
export interface RestaurantBase {
  id: string;
  name: string;
  category?: string;
  latitude?: number;
  longitude?: number;
}

export interface Restaurant extends RestaurantBase {
  address?: string;
  phone?: string;
  description?: string;
  rating?: number;
  status?: string; // "Abierto ahora" | "Cerrado"
  features?: RestaurantFeatures;
  images?: string[];
  events?: RestaurantEvent[];
  menu?: Dish[];
  isOwnerRestaurant?: boolean;
  ownerId?: string;
  logo?: string | null;
  coverImage?: string | null;
}