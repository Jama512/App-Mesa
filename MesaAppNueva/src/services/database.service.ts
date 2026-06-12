// src/services/database.service.ts
// Usando la API Moderna de Expo SQLite (SDK 50+) para persistencia offline y Sync Queue
import * as SQLite from 'expo-sqlite';

// Abrimos (o creamos) la base de datos local usando la API síncrona moderna
let db: SQLite.SQLiteDatabase | null = null;

try {
  db = SQLite.openDatabaseSync('mesa_offline.db');
} catch (error) {
  console.error("Error abriendo la base de datos SQLite:", error);
}

// 1. Inicializar Tablas
export const initDB = async () => {
  if (!db) {
    console.warn('SQLite database not available');
    return;
  }
  try {
    // execAsync es perfecto para comandos DDL (Create Table)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS session (id INTEGER PRIMARY KEY NOT NULL, token TEXT, user_data TEXT);
      CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY NOT NULL, data TEXT);
      CREATE TABLE IF NOT EXISTS sync_queue (id TEXT PRIMARY KEY NOT NULL, operation TEXT, payload TEXT);
    `);
    console.log('✅ Tablas SQLite (Modern API) cargadas correctamente');
  } catch (error) {
    console.error('Error creando tablas', error);
  }
};

// --- FUNCIONES DE SESIÓN ---

// Guardar el token cuando hay internet
export const saveSessionLocally = async (token: string, userData: any) => {
  if (!db) return;
  try {
    // runAsync se usa para INSERT/UPDATE/DELETE con parámetros
    await db.runAsync(
      'INSERT OR REPLACE INTO session (id, token, user_data) VALUES (1, ?, ?);',
      [token, JSON.stringify(userData)]
    );
  } catch (error) {
    console.error('Error al guardar sesión:', error);
  }
};

// Leer el token cuando estamos offline
export const getLocalSession = async (): Promise<any> => {
  if (!db) return null;
  try {
    // getFirstAsync devuelve la primera fila que coincida
    const result = await db.getFirstAsync<{ id: number, token: string, user_data: string }>(
      'SELECT * FROM session WHERE id = 1;'
    );
    return result ? result : null;
  } catch (error) {
    console.error('Error al leer sesión:', error);
    return null;
  }
};

// Borrar la sesión (Logout)
export const clearLocalSession = async () => {
  if (!db) return;
  try {
    await db.runAsync('DELETE FROM session WHERE id = 1;');
  } catch (error) {
    console.error('Error al borrar sesión:', error);
  }
};

// --- FUNCIONES DE RESTAURANTES (Offline-First) ---

// Guardar lista de restaurantes que viene de Firebase/FastAPI
export const saveRestaurantsLocally = async (restaurantsArray: any[]) => {
  if (!db) return;
  try {
    // En SQLite moderno, podemos hacer una transacción explícita para inserciones masivas
    await db.withTransactionAsync(async () => {
      // Primero limpiamos la tabla
      await db!.runAsync('DELETE FROM restaurants;');
      
      // Luego insertamos uno por uno
      for (const rest of restaurantsArray) {
        await db!.runAsync(
          'INSERT INTO restaurants (id, data) VALUES (?, ?);',
          [rest.id, JSON.stringify(rest)]
        );
      }
    });
  } catch (error) {
    console.error('Error al guardar restaurantes en lote:', error);
  }
};

// Leer restaurantes cuando no hay internet
export const getLocalRestaurants = async (): Promise<any[]> => {
  if (!db) return [];
  try {
    // getAllAsync devuelve todas las filas mapeadas a un objeto automáticamente
    const results = await db.getAllAsync<{ id: string, data: string }>(
      'SELECT * FROM restaurants;'
    );
    
    // Parseamos el JSON de cada fila
    return results.map(row => JSON.parse(row.data));
  } catch (error) {
    console.error('Error al leer restaurantes:', error);
    return [];
  }
};

// --- NUEVAS FUNCIONES DE LA COLA DE SINCRONIZACIÓN (SYNC QUEUE) ---

// Guardar una operación pendiente (Ej: "ADD_DISH", "UPDATE_EVENT")
export const addToSyncQueue = async (operation: string, payload: any) => {
  if (!db) return;
  try {
    const uniqueId = Date.now().toString();
    await db.runAsync(
      'INSERT INTO sync_queue (id, operation, payload) VALUES (?, ?, ?);',
      [uniqueId, operation, JSON.stringify(payload)]
    );
    console.log(`📝 Operación [${operation}] guardada en cola offline`);
  } catch (error) {
    console.error('Error al guardar en Sync Queue:', error);
  }
};

// Leer todas las operaciones pendientes cuando regrese el internet
export const getSyncQueue = async (): Promise<any[]> => {
  if (!db) return [];
  try {
    const results = await db.getAllAsync<{ id: string, operation: string, payload: string }>(
      'SELECT * FROM sync_queue ORDER BY id ASC;'
    );
    
    return results.map(row => ({
      id: row.id,
      operation: row.operation,
      payload: JSON.parse(row.payload)
    }));
  } catch (error) {
    console.error('Error al leer Sync Queue:', error);
    return [];
  }
};

// Borrar la operación de la tabla una vez que se envíe con éxito a la nube
export const removeFromSyncQueue = async (id: string) => {
  if (!db) return;
  try {
    await db.runAsync('DELETE FROM sync_queue WHERE id = ?;', [id]);
    console.log(`✅ Operación ${id} eliminada de la cola`);
  } catch (error) {
    console.error('Error al borrar de Sync Queue:', error);
  }
};
export const clearSyncQueue = async () => {
  if (!db) return;
  try {
    await db.runAsync('DELETE FROM sync_queue;');
    console.log('✅ Cola limpiada');
  } catch (error) {
    console.error('Error:', error);
  }
};