// src/hooks/useCalendar.ts
import { useState, useMemo } from "react";
import { useRestaurants } from "../context/RestaurantsContext";

export type CalendarItem = {
  id: string;
  restaurantId: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  imageUrl?: string;
};

const getISODate = (date: Date) => date.toISOString().split('T')[0];

export const useCalendar = () => {
  const { restaurants } = useRestaurants();
  const [selectedDay, setSelectedDay] = useState<"Hoy" | "Semana" | "Mes">("Hoy");

  const items: CalendarItem[] = useMemo(() => {
    const allEvents: CalendarItem[] = [];
    const todayISO = getISODate(new Date());
    
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekISO = getISODate(nextWeekDate);

    restaurants.forEach((r) => {
      if (r.events && r.events.length > 0) {
        r.events.forEach((e) => {
          allEvents.push({
            id: e.id,
            restaurantId: r.id,
            title: e.title,
            subtitle: r.name,
            dateLabel: e.dateLabel || e.date || "Próximamente", 
            description: e.description,
            date: e.date,
            startTime: e.startTime, 
            endTime: e.endTime,     
            imageUrl: e.imageUrl,   
          });
        });
      }
    });

    const filtered = allEvents.filter((item) => {
      if (!item.date) return false;

      if (selectedDay === "Hoy") return item.date === todayISO;
      if (selectedDay === "Semana") return item.date >= todayISO && item.date <= nextWeekISO;
      return item.date >= todayISO; 
    });

    // Corrección TypeScript: Comparación segura de strings en lugar de usar operadores matemáticos
    return filtered.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [restaurants, selectedDay]);

  return { items, selectedDay, setSelectedDay };
};