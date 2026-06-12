/**
 * src/services/menu.service.ts
 * Servicio centralizado para operaciones de menú y restaurante
 */
import { Dish, Restaurant } from "../../types/restaurant.types";
import { getLocalSession } from "./database.service";
import { API_ENDPOINTS, getHeaders } from "../config/api.config";
import { generateUUID } from "../utils/uuid";

/**
 * Decodifica un JWT sin librerías externas (solo B64)
 */
const decodeJWT = (token: string): any => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

export const MenuService = {
  /**
   * Obtiene el restaurante del usuario autenticado
   */
  async getOwnRestaurant(): Promise<Restaurant | null> {
    const session = await getLocalSession();
    if (!session?.token) throw new Error("No autenticado");

    try {
      const response = await fetch(API_ENDPOINTS.RESTAURANTS_ME, {
        method: "GET",
        headers: getHeaders(session.token),
      });

      if (!response.ok) {
        if (response.status === 404) return null; // Restaurante no existe aún
        throw new Error(`Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getOwnRestaurant:", error);
      throw error;
    }
  },

  /**
   * Obtiene todos los restaurantes
   */
  async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      const response = await fetch(API_ENDPOINTS.RESTAURANTS_LIST, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error en getAllRestaurants:", error);
      throw error;
    }
  },

  /**
   * Crea o actualiza el restaurante del propietario (UPSERT)
   * Ahora recibe currentRestaurantId para garantizar que no crea duplicados
   */
  async upsertRestaurant(patch: Partial<Restaurant>, currentRestaurantId?: string): Promise<Restaurant> {
    const session = await getLocalSession();
    if (!session?.token) throw new Error("No autenticado");

    try {
      // 1. Obtener el restaurante actual
      let currentRestaurant: Restaurant | null = null;
      
      // Si pasaron el ID, lo buscamos primero (más eficiente)
      if (currentRestaurantId) {
        console.log("📍 Usando ID proporcionado:", currentRestaurantId);
        try {
          currentRestaurant = await this.getOwnRestaurant();
          if (currentRestaurant?.id !== currentRestaurantId) {
            console.warn("⚠️ IDs no coinciden, usando el proporcionado");
            // Forzar uso del ID proporcionado
            currentRestaurant = currentRestaurant || ({ id: currentRestaurantId } as any);
          }
        } catch (e) {
          // Si falla, al menos tenemos el ID
          currentRestaurant = { id: currentRestaurantId } as any;
        }
      } else {
        // Si no hay ID, obtener del servidor
        try {
          currentRestaurant = await this.getOwnRestaurant();
          console.log("✅ Restaurante actual encontrado:", currentRestaurant?.id);
        } catch (e) {
          console.warn("⚠️ No se encontró restaurante actual, creando uno nuevo");
          currentRestaurant = null;
        }
      }

      // Decodificar JWT para obtener ownerId
      const decoded = decodeJWT(session.token);
      const ownerId = decoded?.sub || "unknown";

      // Preparar payload unificado
      const payload = {
        // Si existe restaurante, mantener su ID; si no, generar uno nuevo
        id: currentRestaurant?.id || generateUUID(),
        ownerId: ownerId, // ID del propietario del JWT
        name: currentRestaurant?.name || "Mi Restaurante",
        status: currentRestaurant?.status || "Abierto ahora",
        menu: currentRestaurant?.menu || [],
        address: currentRestaurant?.address || "Sin dirección",
        phone: currentRestaurant?.phone || "0000000000",
        description: currentRestaurant?.description || "",
        latitude: currentRestaurant?.latitude ?? 0,
        longitude: currentRestaurant?.longitude ?? 0,
        features: currentRestaurant?.features || {},
        rating: currentRestaurant?.rating ?? 5.0,
        // Aplicar el patch SOBRE los datos existentes
        ...patch,
      };

      // Eliminar campos undefined
      Object.keys(payload).forEach(
        (key) => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]
      );

      console.log("📤 Enviando payload:", { id: payload.id, ...patch });

      const response = await fetch(API_ENDPOINTS.RESTAURANTS_CREATE, {
        method: "POST",
        headers: getHeaders(session.token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error("🚨 Error del servidor:", errorDetails);
        throw new Error(`Error ${response.status}: ${errorDetails}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error en upsertRestaurant:", error);
      throw error;
    }
  },

  /**
   * Agrega un platillo al menú
   */
  async addDish(dish: Omit<Dish, 'id'> & { id?: string }): Promise<Restaurant> {
    const session = await getLocalSession();
    if (!session?.token) throw new Error("No autenticado");

    try {
      // Generar ID si no existe
      const dishWithId = {
        id: dish.id || generateUUID(),
        ...dish,
      };

      const response = await fetch(API_ENDPOINTS.MENU_ADD, {
        method: "POST",
        headers: getHeaders(session.token),
        body: JSON.stringify(dishWithId),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error en addDish:", error);
      throw error;
    }
  },

  /**
   * Actualiza un platillo existente
   */
  async updateDish(dishId: string, patch: Partial<Dish>): Promise<Restaurant> {
    const session = await getLocalSession();
    if (!session?.token) throw new Error("No autenticado");

    try {
      const response = await fetch(API_ENDPOINTS.MENU_UPDATE(dishId), {
        method: "PATCH",
        headers: getHeaders(session.token),
        body: JSON.stringify(patch),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error en updateDish:", error);
      throw error;
    }
  },

  /**
   * Elimina un platillo del menú
   */
  async removeDish(dishId: string): Promise<Restaurant> {
    const session = await getLocalSession();
    if (!session?.token) throw new Error("No autenticado");

    try {
      const response = await fetch(API_ENDPOINTS.MENU_DELETE(dishId), {
        method: "DELETE",
        headers: getHeaders(session.token),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error en removeDish:", error);
      throw error;
    }
  },

  /**
   * Elimina un restaurante por ID
   */
  async deleteRestaurant(restaurantId: string): Promise<{ mensaje: string; id: string }> {
    try {
      const response = await fetch(API_ENDPOINTS.RESTAURANTS_DELETE(restaurantId), {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error("🚨 Error al eliminar:", errorDetails);
        throw new Error(`Error ${response.status}: ${errorDetails}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error en deleteRestaurant:", error);
      throw error;
    }
  },

  /**
   * ⚠️ Elimina TODOS los restaurantes (para cleanup de desarrollo)
   */
  async deleteAllRestaurants(): Promise<{ mensaje: string; count: number }> {
    try {
      const response = await fetch(API_ENDPOINTS.RESTAURANTS_DELETE_ALL, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error("🚨 Error al eliminar todos:", errorDetails);
        throw new Error(`Error ${response.status}: ${errorDetails}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error en deleteAllRestaurants:", error);
      throw error;
    }
  },
};