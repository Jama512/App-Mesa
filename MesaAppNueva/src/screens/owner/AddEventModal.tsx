// src/screens/owner/AddEventModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image, 
  Linking,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useRestaurants } from "../../context/RestaurantsContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // Recibe el día que el dueño tocó en el calendario (YYYY-MM-DD)
}

const AddEventModal: React.FC<Props> = ({ visible, onClose, selectedDate }) => {
  const { theme } = useTheme();
  const { addOwnerEvent } = useRestaurants();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("");
  
  const [imageUri, setImageUri] = useState<string | null>(null); 
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.status !== 'granted') {
      Alert.alert(
        "Permiso denegado", 
        "MESA necesita acceso a tus fotos para publicar el póster del evento.",
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
      aspect: [16, 9], 
      quality: 0.7, 
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
       setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Requerido", "El evento necesita un título.");
      return;
    }

    try {
      setSaving(true);
      
      const newEventData = {
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        date: selectedDate,
        dateLabel: selectedDate, 
        startTime: startTime.trim(),
        endTime: endTime.trim() ? endTime.trim() : undefined,
        imageUrl: imageUri ? imageUri : undefined,
      };

      await addOwnerEvent(newEventData);

      Alert.alert("Éxito", "Evento publicado.");
      setTitle("");
      setDescription("");
      setEndTime("");
      setImageUri(null);
      onClose();
    } catch (e) {
      // Nota: Si no hay internet, el Contexto NO lanza error, lo encola offline.
      // Si llega a este catch, es un error grave de validación o memoria local.
      Alert.alert("Error", "No se pudo procesar el evento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Nuevo Evento</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
            Fecha seleccionada: {selectedDate}
          </Text>

          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Título (ej: Noche de Rock en Vivo)"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={40}
          />

          <TextInput
            style={[styles.input, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Descripción (opcional, ej: Banda 'Los Zamora' interpretando clásicos...)"
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Póster/Imagen del evento:</Text>
          
          <View style={styles.imagePickerContainer}>
            {imageUri ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageBtn} 
                  onPress={() => setImageUri(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.pickerButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} 
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="image-outline" size={28} color={theme.colors.primary} />
                <Text style={[styles.pickerButtonText, { color: theme.colors.textSecondary }]}>Seleccionar de la galería</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.timeBlock}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Inicio:</Text>
              <TextInput
                style={[styles.timeInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                value={startTime}
                onChangeText={setStartTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            <View style={styles.timeBlock}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Fin (Opcional):</Text>
              <TextInput
                style={[styles.timeInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="23:00"
                placeholderTextColor={theme.colors.textSecondary}
                value={endTime}
                onChangeText={setEndTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Publicar Evento</Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  card: { borderRadius: 16, padding: 20, borderWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "900" },
  subtitle: { fontSize: 13, fontWeight: "600", marginBottom: 16 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 14 },
  textArea: { height: 70, textAlignVertical: "top" },
  
  label: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  imagePickerContainer: { marginBottom: 20 },
  pickerButton: { height: 100, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed', alignItems: "center", justifyContent: "center", gap: 8 },
  pickerButtonText: { fontSize: 12, fontWeight: "600" },
  previewWrap: { height: 100, borderRadius: 12, overflow: "hidden", position: "relative" },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  removeImageBtn: { position: "absolute", top: 5, right: 5, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 12 },

  row: { flexDirection: "row", justifyContent: "flex-start", gap: 20, marginBottom: 24 },
  timeBlock: { alignItems: "flex-start" },
  timeInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 8, width: 80, textAlign: "center" },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});

export default AddEventModal;