// src/screens/owner/OwnerAddDish.tsx
import React, { useMemo, useState } from "react";
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
  Switch,
  Image,
  ActivityIndicator,
  Linking, // 🔥 Añadido para manejo proactivo de permisos
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/StackNavigator";

// Importamos la librería de Expo para elegir imágenes
import * as ImagePicker from "expo-image-picker";

// Consumo del Contexto Global para operaciones CRUD
import { useRestaurants } from "../../context/RestaurantsContext";
import type { Dish } from "../../../types/restaurant.types";

type Nav = StackNavigationProp<RootStackParamList, "OwnerAddDish">;
type Rt = RouteProp<RootStackParamList, "OwnerAddDish">;

const MAX_NAME = 50;
const MAX_DESC = 140;

const sanitizePrice = (t: string) => {
  const x = t.replace(",", ".").replace(/[^0-9.]/g, "");
  const parts = x.split(".");
  if (parts.length <= 2) return x;
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const OwnerAddDish: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();

  const { restaurants, upsertOwnerRestaurant, addDish, uploadRestaurantImage } = useRestaurants();
  const ownerRestaurant = restaurants.find((r) => r.isOwnerRestaurant);

  const mode = route.params?.mode ?? "create";
  const editingDish = route.params?.dish;

  const [name, setName] = useState(editingDish?.name ?? "");
  const [priceText, setPriceText] = useState(
    editingDish ? String(editingDish.price) : ""
  );
  const [description, setDescription] = useState(
    editingDish?.description ?? ""
  );
  const [isAvailable, setIsAvailable] = useState(
    editingDish?.isAvailable ?? true
  );
  const [imageUri, setImageUri] = useState<string | null>(
    (editingDish as any)?.image ?? null
  );
  const [category, setCategory] = useState(editingDish?.category ?? "");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    ownerRestaurant?.menu?.forEach((dish) => {
      if (dish.category) cats.add(dish.category);
    });
    return Array.from(cats).sort();
  }, [ownerRestaurant]);

  const cleanName = useMemo(() => name.trim().replace(/\s{2,}/g, " "), [name]);

  const priceNumber = useMemo(() => {
    const v = Number(sanitizePrice(priceText));
    return Number.isFinite(v) ? v : NaN;
  }, [priceText]);

  const cleanDesc = useMemo(
    () => description.trim().replace(/\s{2,}/g, " "),
    [description]
  );

  const nameOk = cleanName.length > 0;
  const priceOk = Number.isFinite(priceNumber) && priceNumber > 0;
  const canSave = nameOk && priceOk;

  const titleText = mode === "edit" ? "Editar platillo" : "Agregar platillo";
  const subtitleText =
    mode === "edit"
      ? "Actualiza nombre, precio y foto."
      : "Crea un nuevo platillo para tu menú.";

  // 🔥 LÓGICA MEJORADA DE SELECCIÓN DE IMAGEN
  const pickImage = async () => {
    try {
      // Pedimos permiso primero
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permiso denegado", 
          "Necesitamos acceso a tu galería para subir la foto del platillo.",
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
        aspect: [1, 1], // Forzamos un aspecto cuadrado (ideal para platillos)
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "No pudimos abrir la galería.");
    }
  };

  const onSave = async () => {
    if (!canSave) {
      Alert.alert(
        "Datos incompletos",
        !nameOk
          ? "Escribe el nombre del platillo."
          : "Escribe un precio válido (mayor a 0)."
      );
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = imageUri;

      // 🔥 LÓGICA DE SUBIDA DE IMAGEN A FASTAPI
      if (imageUri && imageUri.startsWith("file://")) {
        console.log("Subiendo foto del platillo...");
        const uploadedUrl = await uploadRestaurantImage(imageUri);
        
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl; // Tomamos la URL pública que devolvió el servidor
          console.log("Foto subida correctamente:", finalImageUrl);
        } else {
          // Si falla la subida, mostramos una alerta pero permitimos que el usuario decida qué hacer
          console.warn("No se pudo subir la foto del platillo.");
          throw new Error("No se pudo guardar la imagen en el servidor.");
        }
      }

      // Preparamos los datos del platillo
      const finalCategory = showNewCategory ? newCategoryName.trim() : category;
      const dishData: Dish = {
        id: editingDish?.id ?? String(Date.now()),
        name: cleanName,
        price: Number(priceNumber),
        isAvailable: isAvailable,
        ...(cleanDesc ? { description: cleanDesc } : {}),
        // Guardamos la URL pública (o mantenemos la que ya tenía si estaba editando)
        ...(finalImageUrl ? { image: finalImageUrl } : {}),
        ...(finalCategory ? { category: finalCategory } : {}),
      };

      // Guardado usando el Contexto
      if (mode === "create") {
        if (addDish) {
          await addDish(dishData);
        } else {
          const currentMenu = ownerRestaurant?.menu || [];
          const newMenu = [...currentMenu, dishData];
          await upsertOwnerRestaurant({ menu: newMenu });
        }
      } else {
        const currentMenu = ownerRestaurant?.menu || [];
        const newMenu = currentMenu.map((d) =>
          d.id === dishData.id ? dishData : d
        );
        await upsertOwnerRestaurant({ menu: newMenu });
      }

      Alert.alert(
        mode === "edit" ? "Actualizado" : "Agregado",
        "Menú actualizado exitosamente.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error guardando el platillo:", error);
      Alert.alert("Error", "Hubo un problema al guardar el platillo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OwnerLayout title={titleText} subtitle={subtitleText} showBack>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
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
            <View style={styles.imageSection}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                  />
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
                    <Ionicons
                      name="camera-outline"
                      size={32}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.imageText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Agregar foto
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity
                  onPress={() => setImageUri(null)}
                  style={styles.removeImageBtn}
                >
                  <Text style={styles.removeImageText}>Eliminar foto</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nombre
              </Text>
              <Text
                style={[styles.counter, { color: theme.colors.textSecondary }]}
              >
                {name.length}/{MAX_NAME}
              </Text>
            </View>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="restaurant-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
              <TextInput
                value={name}
                onChangeText={(t) => setName(t)}
                placeholder="Ej. Pizza Pepperoni"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, { color: theme.colors.text }]}
                maxLength={MAX_NAME}
                returnKeyType="next"
              />
            </View>

            {/* CATEGORÍA */}
            <View style={[styles.labelRow, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Categoría
              </Text>
            </View>
            {!showNewCategory ? (
              <>
                <TouchableOpacity
                  onPress={() => setShowNewCategory(true)}
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="list-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.input,
                      { color: category ? theme.colors.text : theme.colors.textSecondary },
                    ]}
                  >
                    {category || "Seleccionar o crear..."}
                  </Text>
                </TouchableOpacity>
                {existingCategories.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
                  >
                    {existingCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[
                          {
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            backgroundColor:
                              category === cat
                                ? theme.colors.primary
                                : theme.colors.background,
                            borderColor: theme.colors.border,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: category === cat ? "#fff" : theme.colors.text,
                          }}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="add-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="Ej. Postres, Bebidas..."
                    placeholderTextColor={theme.colors.textSecondary}
                    style={[styles.input, { color: theme.colors.text }]}
                    maxLength={30}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowNewCategory(false);
                    setNewCategoryName("");
                  }}
                  style={{
                    marginTop: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.labelRow, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Precio
              </Text>
              <Text
                style={[styles.counter, { color: theme.colors.textSecondary }]}
              >
                MXN
              </Text>
            </View>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="cash-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
              <TextInput
                value={priceText}
                onChangeText={(t) => setPriceText(sanitizePrice(t))}
                placeholder="Ej. 149"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, { color: theme.colors.text }]}
                keyboardType="decimal-pad"
                maxLength={10}
                returnKeyType="next"
              />
            </View>

            <View style={[styles.labelRow, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Descripción
              </Text>
              <Text
                style={[styles.counter, { color: theme.colors.textSecondary }]}
              >
                {description.length}/{MAX_DESC}
              </Text>
            </View>
            <View
              style={[
                styles.textAreaWrap,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ingredientes..."
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.textArea, { color: theme.colors.text }]}
                multiline
                maxLength={MAX_DESC}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Disponible
                </Text>
              </View>
              <Switch value={isAvailable} onValueChange={setIsAvailable} />
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: canSave && !isSaving
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={onSave}
              activeOpacity={0.9}
              disabled={!canSave || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="save-outline" size={18} color="#fff" />
              )}
              <Text style={styles.saveText}>
                {isSaving
                  ? "Guardando..."
                  : mode === "edit"
                  ? "Guardar cambios"
                  : "Agregar platillo"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                { borderColor: theme.colors.border },
              ]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.9}
              disabled={isSaving}
            >
              <Text
                style={[styles.secondaryText, { color: theme.colors.text }]}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 18 },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    resizeMode: "cover",
  },
  imageText: { fontSize: 12, fontWeight: "600" },
  removeImageBtn: { marginTop: 8 },
  removeImageText: { color: "#EF4444", fontSize: 12, fontWeight: "700" },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: "900" },
  counter: { fontSize: 11, fontWeight: "800", opacity: 0.9 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 14, fontWeight: "700" },
  textAreaWrap: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    height: 90,
    fontSize: 13,
    fontWeight: "600",
    textAlignVertical: "top",
  },
  switchRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveBtn: {
    marginTop: 16,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontWeight: "900", fontSize: 13 },
});

export default OwnerAddDish;