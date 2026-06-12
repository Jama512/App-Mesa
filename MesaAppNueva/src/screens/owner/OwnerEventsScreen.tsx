// src/screens/owner/OwnerEventsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useRestaurants, RestaurantEvent } from "../../context/RestaurantsContext";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, LocaleConfig } from "react-native-calendars";

// Importamos el Modal que acabamos de crear
import AddEventModal from "./AddEventModal";

// Configuración en Español para el Calendario
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

// Función para obtener la fecha de hoy en formato YYYY-MM-DD
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const OwnerEventsScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const { restaurants, removeOwnerEvent } = useRestaurants();

  // Estados para controlar la fecha y la visibilidad del modal
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [isModalVisible, setModalVisible] = useState(false);

  // Obtenemos el restaurante del dueño y sus eventos
  const myRestaurant = useMemo(() => restaurants.find(r => r.isOwnerRestaurant), [restaurants]);
  const events = useMemo(() => (myRestaurant as any)?.events || [], [myRestaurant]);

  // Transformamos los eventos al formato que pide el calendario para los "puntitos"
  const markedDates = useMemo(() => {
    let marks: any = {};
    
    events.forEach((ev: RestaurantEvent) => {
      if (ev.date) {
        marks[ev.date] = { marked: true, dotColor: theme.colors.primary };
      }
    });

    // Remarcamos el día seleccionado actualmente
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: theme.colors.primary,
    };

    return marks;
  }, [events, selectedDate, theme]);

  // Filtramos los eventos para mostrar solo los del día seleccionado en la lista inferior
  const selectedDayEvents = useMemo(() => {
    return events.filter((ev: RestaurantEvent) => ev.date === selectedDate);
  }, [events, selectedDate]);

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      "Eliminar evento",
      "¿Estás seguro de que deseas cancelar este evento?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => removeOwnerEvent(eventId) }
      ]
    );
  };

  const renderEventItem = ({ item }: { item: RestaurantEvent }) => (
    <View style={[styles.eventCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { color: theme.colors.text }]}>{item.title}</Text>
        {item.description ? (
          <Text style={[styles.eventDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
          <Text style={[styles.eventTime, { color: theme.colors.primary }]}>
            {item.startTime || "Todo el día"} {item.endTime ? `- ${item.endTime}` : ""}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
         style={styles.deleteBtn}
         onPress={() => handleDeleteEvent(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Calendario de Eventos</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Organiza las actividades de tu negocio
        </Text>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.textSecondary,
          dayTextColor: theme.colors.text,
          todayTextColor: theme.colors.primary,
          selectedDayTextColor: '#ffffff',
          monthTextColor: theme.colors.text,
          arrowColor: theme.colors.primary,
        }}
      />

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.listContainer}>
        <Text style={[styles.listHeader, { color: theme.colors.text }]}>
          Eventos del {selectedDate}
        </Text>
        
        {selectedDayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear-outline" size={48} color={theme.colors.border} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              No hay eventos programados para este día.
            </Text>
          </View>
        ) : (
          <FlatList
            data={selectedDayEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* FAB para abrir el modal */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.9}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* El Modal que se despliega para agregar eventos */}
      <AddEventModal 
        visible={isModalVisible} 
        onClose={() => setModalVisible(false)} 
        selectedDate={selectedDate} 
      />
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth, width: "100%", marginVertical: 8 },
  listContainer: { flex: 1, paddingHorizontal: 16 },
  listHeader: { fontSize: 16, fontWeight: "600", marginBottom: 12, marginTop: 8 },
  listContent: { paddingBottom: 80 }, 
  eventCard: { flexDirection: "row", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "center" },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  eventDesc: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eventTime: { fontSize: 12, fontWeight: "600" },
  deleteBtn: { padding: 8, marginLeft: 10 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 40 },
  emptyStateText: { marginTop: 12, fontSize: 14 },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
});

export default OwnerEventsScreen;