// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState } from "react";
// Importo mis paletas de colores definidas en otro archivo
import { lightTheme, darkTheme, ThemeType } from "./theme";

// Defino qué datos compartirá este contexto
interface ThemeContextProps {
  theme: ThemeType; // El objeto con los colores actuales (Hex codes)
  toggleTheme: () => void; // La función para cambiar el modo
}

// Creo el contexto con valores por defecto
const ThemeContext = createContext<ThemeContextProps>({
  theme: lightTheme,
  toggleTheme: () => {},
});

// --- PROVEEDOR DE TEMA ---
// Este componente envuelve a toda la App (en App.tsx).
// Gracias a esto, todos las pantallas "heredan" el tema sin pasar props.
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Estado local para saber cuál es el tema activo
  const [currentThemeName, setCurrentThemeName] = useState<"light" | "dark">(
    "light"
  );

  // Función Switch: Si es light pon dark, si es dark pon light
  const toggleTheme = () => {
    setCurrentThemeName((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Selección dinámica del objeto de estilos
  const theme = currentThemeName === "light" ? lightTheme : darkTheme;

  return (
    // Inyecto el tema y la función toggle a todo el árbol de componentes
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// --- HOOK PERSONALIZADO ---
// Facilita el uso del contexto. En lugar de escribir useContext(ThemeContext)
// en cada archivo, solo escribo useTheme().
export const useTheme = () => useContext(ThemeContext);
