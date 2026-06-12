// src/screens/owner/OwnerProfile.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking, // 🔥 Agregado para manejo de permisos denegados
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

// Consumo del Contexto Global
import { useRestaurants } from "../../context/RestaurantsContext";
import { useAuth } from "../auth/AuthContext";

// 🔥 CATEGORÍAS PREDEFINIDAS
export const PREDEFINED_CATEGORIES = [
  { id: "1", name: "Pizzería", icon: "pizza" as const },
  { id: "2", name: "Tacos", icon: "restaurant" as const },
  { id: "3", name: "Variado", icon: "restaurant" as const },
  { id: "4", name: "Postres", icon: "gift" as const },
  { id: "5", name: "Helados", icon: "ice-cream" as const },
  { id: "6", name: "Café", icon: "cafe" as const },
  { id: "7", name: "Comida Rápida", icon: "fast-food" as const },
  { id: "8", name: "Parrilla", icon: "flame" as const },
  { id: "9", name: "Mariscos", icon: "restaurant" as const },
  { id: "10", name: "Comida China", icon: "restaurant" as const },
  { id: "11", name: "Comida Italiana", icon: "restaurant" as const },
  { id: "12", name: "Bar", icon: "wine" as const },
];

const MAX_NAME = 50;
const MAX_DESC = 200;
const MAX_ADDRESS = 100;
const MAX_PHONE = 15;

const OwnerProfile: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { state } = useAuth();
  
  const { restaurants, upsertOwnerRestaurant, uploadRestaurantImage } = useRestaurants();

  const ownerRestaurant = useMemo(() => {
    if (!state.userId) return null;
    return restaurants.find((r) => r.ownerId === state.userId) ?? null;
  }, [restaurants, state.userId]);

  // Estados locales
  const [name, setName] = useState(ownerRestaurant?.name ?? "");
  const [description, setDescription] = useState(ownerRestaurant?.description ?? "");
  const [address, setAddress] = useState(ownerRestaurant?.address ?? "");
  const [phone, setPhone] = useState(ownerRestaurant?.phone ?? "");
  const [selectedCategory, setSelectedCategory] = useState(ownerRestaurant?.category ?? "Pizzería");
  
  // Imágenes
  const [logoUri, setLogoUri] = useState<string | null>((ownerRestaurant as any)?.logo ?? null);
  const [coverUri, setCoverUri] = useState<string | null>((ownerRestaurant as any)?.coverImage ?? null);
  
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async (type: "logo" | "cover") => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          "Permiso denegado", 
          "MESA necesita acceso a tu galería para poder subir la foto de tu restaurante.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir Ajustes", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Volvemos a Options para evitar el error de TS
        allowsEditing: true,
        aspect: type === "logo" ? [1, 1] : [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (type === "logo") setLogoUri(result.assets[0].uri);
        else setCoverUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "No pudimos abrir la galería.");
    }
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert("Faltan datos", "El nombre del restaurante es obligatorio.");
      return;
    }

    setIsSaving(true);
    try {
      let finalLogoUrl = logoUri;
      let finalCoverUrl = coverUri;

      if (logoUri && !logoUri.startsWith("http")) {
        const uploadedUrl = await uploadRestaurantImage(logoUri);
        if (uploadedUrl) finalLogoUrl = uploadedUrl;
      }

      if (coverUri && !coverUri.startsWith("http")) {
        const uploadedUrl = await uploadRestaurantImage(coverUri);
        if (uploadedUrl) finalCoverUrl = uploadedUrl;
      }
      await upsertOwnerRestaurant({
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        phone: phone.trim(),
        category: selectedCategory,
        logo: finalLogoUrl,
        coverImage: finalCoverUrl,
      } as any);

      Alert.alert("Perfil actualizado", "Los datos de tu restaurante se guardaron correctamente.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error guardando perfil:", error);
      Alert.alert("Error", "Ocurrió un problema al guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OwnerLayout title="Mi Perfil" subtitle="Edita la información de tu negocio." showBack>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            
            {/* PORTADA Y LOGO */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Foto de Portada</Text>
            <TouchableOpacity onPress={() => pickImage("cover")} activeOpacity={0.9} style={styles.imageContainer}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverImage} />
              ) : (
                <View style={[styles.placeholderCover, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Ionicons name="image-outline" size={32} color={theme.colors.textSecondary} />
                  <Text style={[styles.imageText, { color: theme.colors.textSecondary }]}>Agregar Portada</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>Logotipo</Text>
            <TouchableOpacity onPress={() => pickImage("logo")} activeOpacity={0.9} style={styles.imageContainer}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <View style={[styles.placeholderLogo, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Ionicons name="camera-outline" size={28} color={theme.colors.textSecondary} />
                  <Text style={[styles.imageText, { color: theme.colors.textSecondary }]}>Agregar Logo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* NOMBRE */}
            <View style={[styles.labelRow, { marginTop: 20 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Nombre del Restaurante</Text>
              <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>{name.length}/{MAX_NAME}</Text>
            </View>
            <View style={[styles.inputWrap, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="storefront-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej. Taquería El Paisa"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, { color: theme.colors.text }]}
                maxLength={MAX_NAME}
              />
            </View>

            {/* DIRECCIÓN */}
            <View style={[styles.labelRow, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Dirección</Text>
              <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>{address.length}/{MAX_ADDRESS}</Text>
            </View>
            <View style={[styles.inputWrap, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="location-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Ej. Calle Madero #123, Centro"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, { color: theme.colors.text }]}
                maxLength={MAX_ADDRESS}
              />
            </View>

            {/* TELÉFONO */}
            <View style={[styles.labelRow, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Teléfono</Text>
              <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>{phone.length}/{MAX_PHONE}</Text>
            </View>
            <View style={[styles.inputWrap, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="call-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Ej. 351 123 4567"
                keyboardType="phone-pad"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, { color: theme.colors.text }]}
                maxLength={MAX_PHONE}
              />
            </View>

            {/* DESCRIPCIÓN */}
            <View style={[styles.labelRow, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Descripción Breve</Text>
              <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>{description.length}/{MAX_DESC}</Text>
            </View>
            <View style={[styles.textAreaWrap, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="¿Qué hace especial a tu comida?"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.textArea, { color: theme.colors.text }]}
                multiline
                maxLength={MAX_DESC}
              />
            </View>

            {/* CATEGORÍA DEL RESTAURANTE */}
            <View style={[styles.labelRow, { marginTop: 16 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>🏷️ Tipo de Restaurante</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
              style={{ marginHorizontal: -16 }}
            >
              <View style={{ paddingLeft: 16, paddingRight: 8, flexDirection: "row", gap: 8 }}>
                {PREDEFINED_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        }
                      ]}
                      onPress={() => setSelectedCategory(cat.name)}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={cat.icon} 
                        size={16} 
                        color={isSelected ? "#FFF" : theme.colors.text}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.categoryButtonText, { color: isSelected ? "#FFF" : theme.colors.text }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* BOTÓN DE GUARDAR */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: name.trim() ? theme.colors.primary : theme.colors.border }]}
              onPress={onSave}
              activeOpacity={0.9}
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 18 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "900", marginBottom: 10 },
  imageContainer: { alignItems: "center" },
  coverImage: { width: "100%", height: 150, borderRadius: 14, resizeMode: "cover" },
  placeholderCover: { width: "100%", height: 150, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", justifyContent: "center", alignItems: "center", gap: 8 },
  logoImage: { width: 100, height: 100, borderRadius: 50, resizeMode: "cover" },
  placeholderLogo: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderStyle: "dashed", justifyContent: "center", alignItems: "center", gap: 4 },
  imageText: { fontSize: 12, fontWeight: "600" },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 13, fontWeight: "900" },
  counter: { fontSize: 11, fontWeight: "800", opacity: 0.9 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, fontSize: 14, fontWeight: "700" },
  textAreaWrap: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10 },
  textArea: { height: 80, fontSize: 13, fontWeight: "600", textAlignVertical: "top" },
  // 🔥 ESTILOS PARA SELECTOR DE CATEGORÍA
  categoryButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1.5,
    marginRight: 8
  },
  categoryButtonText: { fontSize: 12, fontWeight: "700" },
  saveBtn: { marginTop: 24, borderRadius: 999, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  saveText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});

export default OwnerProfile;