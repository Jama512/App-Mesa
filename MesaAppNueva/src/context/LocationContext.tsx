// src/context/LocationContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";

// Defino la estructura de mis coordenadas (Latitud/Longitud)
export type Coords = { latitude: number; longitude: number };

// El estado que guarda mi app globalmente
export type LocationState = {
  coords: Coords | null; // Puede ser null si el usuario no ha dado permisos
  label: string; // Texto amigable (ej: "Centro de Zamora")
};

type LocationContextValue = {
  location: LocationState;
  setLocation: (next: Partial<LocationState>) => void;
  clearLocation: () => void;
};

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined
);

// --- PROVIDER DE UBICACIÓN ---
// Este componente envuelve a toda la aplicación para que cualquier pantalla
// (Home, Mapa, Perfil) pueda saber dónde está el usuario sin pasar props.
export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Estado inicial por defecto (Fallback)
  const [location, setLocationState] = useState<LocationState>({
    coords: null,
    label: "Cerca de Zona Centro",
  });

  // Función inteligente para actualizar la ubicación
  const setLocation = (next: Partial<LocationState>) => {
    setLocationState((prev) => ({
      ...prev,
      ...next,
      // Lógica de seguridad: Si me mandan coords nuevas, las uso.
      // Si no, mantengo las anteriores para no perder la posición.
      coords: next.coords !== undefined ? next.coords : prev.coords,
      label: next.label ?? prev.label,
    }));
  };

  const clearLocation = () => {
    setLocationState({ coords: null, label: "Cerca de Zona Centro" });
  };

  // Optimización de rendimiento (useMemo)
  // Solo recrea el objeto 'value' si la ubicación realmente cambia.
  const value = useMemo(
    () => ({ location, setLocation, clearLocation }),
    [location]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationState = () => {
  const ctx = useContext(LocationContext);
  if (!ctx)
    throw new Error("useLocationState debe usarse dentro de LocationProvider");
  return ctx;
};
