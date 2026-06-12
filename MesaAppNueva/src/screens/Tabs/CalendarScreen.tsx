// src/screens/Tabs/CalendarScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootTabParamList } from "../../navigation/TabNavigator";
import { RootStackParamList } from "../../navigation/StackNavigator";

// Importamos el Hook (ViewModel)
import { useCalendar } from "../../hooks/useCalendar";

type TabNav = BottomTabNavigationProp<RootTabParamList, "CalendarTab">;
type StackNav = StackNavigationProp<RootStackParamList>;
type Nav = CompositeNavigationProp<TabNav, StackNav>;
const doodleBg = require("../../../assets/Background.png");

// Función de ayuda para formatear la fecha a formato DD/MM/YYYY con validación de seguridad
const formatFriendlyDate = (dateStr?: string) => {
  if (!dateStr) return "Próximamente";
  
  const parts = dateStr.split('-');
  // Verificamos si realmente viene en formato YYYY-MM-DD
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  // Si no se puede parsear, devolvemos el texto original
  return dateStr;
};

const CalendarScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<Nav>();

  const { items, selectedDay, setSelectedDay } = useCalendar();

  const openRestaurant = (restaurantId: string) => {
    navigation.navigate("CategoryDetail", { restaurantId });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.header}
      />

      <ImageBackground
        source={doodleBg}
        style={styles.bg}
        imageStyle={{ opacity: isDark ? 0.07 : 0.12 }}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.header,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Calendario
          </Text>

          {/* Segmented Control (Filtro) */}
          <View
            style={[
              styles.segment,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {(["Hoy", "Semana", "Mes"] as const).map((k) => {
              const active = selectedDay === k;
              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => setSelectedDay(k)}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : "transparent",
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: active ? "#FFFFFF" : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {k}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(it) => `${it.restaurantId}-${it.id}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              // 🔥 LÓGICA ROBUSTA PARA LA IMAGEN
              // Usamos Record<string, any> para evitar errores estrictos de TypeScript
              const itemData = item as Record<string, any>;
              const finalImageUrl = itemData.imageUrl || itemData.posterUri || itemData.image;

              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => openRestaurant(item.restaurantId)}
                >
                  <View style={styles.cardLeft}>
                    {/* Renderizamos la imagen si la encontramos */}
                    {finalImageUrl ? (
                      <Image
                        source={{ uri: finalImageUrl }}
                        style={styles.eventImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.cardTitle, { color: theme.colors.text }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.cardSubtitle,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>

                      {!!item.description && (
                        <Text
                          style={[
                            styles.cardDesc,
                            { color: theme.colors.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {item.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Sección Derecha de la Tarjeta */}
                  <View style={styles.cardRight}>
                    {/* Fecha */}
                    <Text
                      style={[
                        styles.dateLabel,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {selectedDay === "Hoy" ? "Hoy" : formatFriendlyDate(item.date)}
                    </Text>
                    
                    {/* Hora Combinada */}
                    <Text
                      style={[
                        styles.timeLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                       {item.startTime ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}` : "Todo el día"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons
              name="calendar-clear-outline"
              size={28}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              {selectedDay === "Hoy"
                ? "No hay eventos para hoy."
                : "No hay eventos próximos."}
            </Text>
            <Text
              style={[styles.emptyHint, { color: theme.colors.textSecondary }]}
            >
              Prueba cambiando de pestaña o espera a que publiquen nuevas
              promos.
            </Text>
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  bg: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },

  segment: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentText: { fontSize: 12, fontWeight: "700" },

  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  
  eventImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  
  cardTitle: { fontSize: 14, fontWeight: "800" },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  cardDesc: { marginTop: 6, fontSize: 11, opacity: 0.9 },

  cardRight: { alignItems: "flex-end", gap: 4 },
  dateLabel: { fontSize: 12, fontWeight: "800" },
  timeLabel: { fontSize: 11, fontWeight: "600" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyText: { textAlign: "center", fontSize: 12, fontWeight: "700" },
  emptyHint: { textAlign: "center", fontSize: 11, opacity: 0.85 },
});

export default CalendarScreen;