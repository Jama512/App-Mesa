// src/screens/owner/OwnerCreateAnnouncement.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking, // 🔥 Agregado para manejo de permisos
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

// Importamos el Hook de UI y el Contexto Global
import { useAnnouncements } from "../../hooks/useAnnouncements";
import { useRestaurants } from "../../context/RestaurantsContext";
import type { RestaurantEvent } from "../../context/RestaurantsContext";

const MAX_TITLE = 60;
const MAX_WHEN = 40;
const MAX_DESC = 220;

// Interfaz para la técnica de "Doble Llave" de migración a FastAPI
type MigrationEvent = Omit<RestaurantEvent, "id"> & {
  dateLabel?: string;
  posterUri?: string;
};

const OwnerCreateAnnouncement: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  
  // Extraemos las funciones de red de nuestro contexto
  const { addOwnerEvent, uploadRestaurantImage } = useRestaurants();

  // Consumimos el estado desde el Hook (ignoramos su handlePublish)
  const {
    title, setTitle,
    whenLabel, setWhenLabel,
    description, setDescription,
    canPublish,
    counts
  } = useAnnouncements();

  // Estados locales para la imagen
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          "Permiso denegado", 
          "MESA necesita acceso a tu galería para poder subir el flyer promocional.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir Ajustes", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Formato horizontal (ideal para banners/flyers)
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "No pudimos abrir la galería.");
    }
  };

  const handlePublishWithImage = async () => {
    if (!canPublish) return;

    setIsUploading(true);
    try {
      let finalImageUrl = null;
      
      // 1. Subimos la imagen a FastAPI
      if (imageUri) {
        finalImageUrl = await uploadRestaurantImage(imageUri);
        if (!finalImageUrl) throw new Error("El servidor rechazó la imagen.");
      }

      // 2. Armamos el evento con doble llave (date/dateLabel e imageUrl/posterUri) 
      // para satisfacer a TypeScript y a Pydantic en FastAPI al mismo tiempo sin usar 'any'.
      const newEvent: MigrationEvent = {
        title: title.trim(),
        dateLabel: whenLabel.trim() || "Próximamente", 
        date: whenLabel.trim() || "Próximamente",      
        description: description.trim(),
        posterUri: finalImageUrl || undefined,               
        imageUrl: finalImageUrl || undefined,                 
      };

      // 3. Guardamos el evento (pasando a unknown temporalmente para burlar el Omit y satisfacer el Contexto)
      await addOwnerEvent(newEvent as unknown as Omit<RestaurantEvent, "id">);

      Alert.alert("¡Publicado!", "Tu anuncio ya está visible para los clientes.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error al publicar:", error);
      Alert.alert("Error", "Ocurrió un problema al publicar el anuncio.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <OwnerLayout
      title="Publicar anuncio"
      subtitle="Crea un evento o promoción para que aparezca en MESA."
      showBack
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* SECCIÓN DE IMAGEN (Flyer del evento) */}
            <View style={styles.imageSection}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View
                    style={[
                      styles.imagePlaceholder,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Ionicons name="image-outline" size={32} color={theme.colors.textSecondary} />
                    <Text style={[styles.imageText, { color: theme.colors.textSecondary }]}>
                      Agregar Flyer (Opcional)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImageBtn}>
                  <Text style={styles.removeImageText}>Eliminar foto</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Input Título */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Título del evento/promo
              </Text>
              <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
                {counts.title}/{MAX_TITLE}
              </Text>
            </View>

            <View style={[styles.inputWrap, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="megaphone-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Ej. Noche de Karaoke"
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                maxLength={MAX_TITLE}
              />
            </View>

            {/* Input Fecha */}
            <View style={[styles.labelRow, { marginTop: 14 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>¿Cuándo?</Text>
              <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
                {counts.when}/{MAX_WHEN}
              </Text>
            </View>

            <View style={[styles.inputWrap, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Ej. Hoy · 9:00 PM"
                placeholderTextColor={theme.colors.textSecondary}
                value={whenLabel}
                onChangeText={setWhenLabel}
                maxLength={MAX_WHEN}
              />
            </View>

            {/* Input Descripción */}
            <View style={[styles.labelRow, { marginTop: 14 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Descripción (opcional)</Text>
              <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
                {counts.desc}/{MAX_DESC}
              </Text>
            </View>

            <View style={[styles.textAreaWrap, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.textArea, { color: theme.colors.text }]}
                placeholder="Detalles, condiciones, horario, etc."
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                maxLength={MAX_DESC}
                multiline
              />
            </View>

            {/* Botón de Publicar */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: canPublish ? theme.colors.primary : theme.colors.border },
              ]}
              onPress={handlePublishWithImage}
              activeOpacity={0.9}
              disabled={!canPublish || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={styles.primaryText}>Publicar anuncio</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
              Tip: Si aún no tienes hora exacta, deja “¿Cuándo?” vacío y se pondrá “Próximamente”.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 18 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  
  // Estilos nuevos para la imagen
  imageSection: { alignItems: "center", marginBottom: 18 },
  imagePlaceholder: {
    width: "100%",
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    minWidth: 300,
  },
  previewImage: {
    width: "100%",
    height: 140,
    borderRadius: 16,
    resizeMode: "cover",
    minWidth: 300,
  },
  imageText: { fontSize: 13, fontWeight: "600" },
  removeImageBtn: { marginTop: 10 },
  removeImageText: { color: "#EF4444", fontSize: 12, fontWeight: "700" },

  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 },
  label: { fontSize: 13, fontWeight: "900" },
  counter: { fontSize: 11, fontWeight: "800", opacity: 0.9 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, fontSize: 14, fontWeight: "700" },
  textAreaWrap: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10 },
  textArea: { height: 100, fontSize: 13, fontWeight: "600", textAlignVertical: "top" },
  primaryButton: { marginTop: 20, borderRadius: 999, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  helper: { marginTop: 12, fontSize: 11, fontWeight: "700", opacity: 0.9, textAlign: "center" },
});

export default OwnerCreateAnnouncement;