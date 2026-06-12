// src/theme/theme.ts

// Tipo de tema (opcional, pero útil)
export type ThemeName = "light" | "dark";

// Definimos el tipo del objeto de tema
export type ThemeType = {
  name: ThemeName;
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    header: string;
    card: string;
    tabBar: string;
    iconInactive: string;
  };
};

// TEMA CLARO
export const lightTheme: ThemeType = {
  name: "light",
  colors: {
    background: "#FFFFFF",
    surface: "#F4F4F4",
    primary: "#E67E22",
    text: "#000000",
    textSecondary: "#555555",
    border: "#DDDDDD",
    header: "#2C2C2C",
    card: "#FFFFFF",
    tabBar: "#FFFFFF",
    iconInactive: "#999999",
  },
};

// TEMA OSCURO
export const darkTheme: ThemeType = {
  name: "dark",
  colors: {
    background: "#000000",
    surface: "#1A1A1A",
    primary: "#E67E22",
    text: "#FFFFFF",
    textSecondary: "#B3B3B3",
    border: "#333333",
    header: "#111111",
    card: "#1C1C1C",
    tabBar: "#0D0D0D",
    iconInactive: "#777777",
  },
};
