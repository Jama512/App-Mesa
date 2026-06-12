// src/hooks/useAnnouncements.ts
import { useState, useMemo } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/StackNavigator"; 
import { useRestaurants } from "../context/RestaurantsContext";

// Definimos el tipo de navegación para que TS no se queje
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const useAnnouncements = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addOwnerEvent } = useRestaurants();

  const [title, setTitle] = useState("");
  const [whenLabel, setWhenLabel] = useState("");
  const [description, setDescription] = useState("");

  const cleanTitle = useMemo(() => title.trim().replace(/\s{2,}/g, " "), [title]);
  const cleanWhen = useMemo(() => whenLabel.trim().replace(/\s{2,}/g, " "), [whenLabel]);
  const cleanDesc = useMemo(() => description.trim(), [description]);

  const canPublish = cleanTitle.length > 0;

  const handlePublish = async () => {
    if (!canPublish) {
      Alert.alert("Falta título", "Ingresa el título del evento o promo.");
      return;
    }

    try {
      // Optimización: Más limpio que el spread operator, pasamos undefined si no hay descripción
      const eventData = {
        title: cleanTitle,
        dateLabel: cleanWhen || "Próximamente",
        description: cleanDesc || undefined,
      };

      // Esto ahora viaja seguro por tu Contexto hacia FastAPI
      await addOwnerEvent(eventData as any);

      setTitle("");
      setWhenLabel("");
      setDescription("");

      Alert.alert("Publicado", "Tu anuncio ya aparece en el Calendario.", [
        {
          text: "Ver calendario",
          onPress: () => {
            // Se mantiene el "as any" aquí porque React Navigation a veces 
            // requiere un tipado de rutas anidadas muy complejo
            navigation.navigate("Home" as any, { 
                screen: "CalendarTab" 
            });
          },
        },
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Error", "No se pudo publicar el anuncio.");
    }
  };

  return {
    title, setTitle,
    whenLabel, setWhenLabel,
    description, setDescription,
    handlePublish,
    canPublish,
    counts: {
      title: title.length,
      when: whenLabel.length,
      desc: description.length
    }
  };
};