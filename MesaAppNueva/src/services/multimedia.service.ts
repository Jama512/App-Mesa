/**
 * src/services/multimedia.service.ts
 * Servicio centralizado para subida de imágenes
 */
import { getLocalSession } from "./database.service";
import { API_ENDPOINTS } from "../config/api.config";

export const MultimediaService = {
  /**
   * Sube una imagen al servidor FastAPI mediante multipart/form-data
   */
uploadImage: async (uri: string): Promise<string> => {
    try {
      const session = await getLocalSession();
      if (!session?.token) throw new Error("No autenticado");

      if (!uri || typeof uri !== "string") {
        throw new Error("URI de imagen inválida");
      }

      const filename = uri.split("/").pop() || `upload_${Date.now()}.jpg`;

      return await new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", {
          uri,
          name: filename,
          type: "image/jpeg",
        } as any);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", API_ENDPOINTS.UPLOAD_IMAGE);
        xhr.setRequestHeader("Authorization", `Bearer ${session.token}`);

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              const resultUrl = data.url || data.filename || data.path;
              if (!resultUrl) reject(new Error("Servidor no devolvió URL"));
              else resolve(resultUrl);
            } catch {
              reject(new Error("Respuesta inválida del servidor"));
            }
          } else {
            reject(new Error(`Error ${xhr.status} al subir imagen`));
          }
        };

        xhr.onerror = () => reject(new Error("Error de red al subir imagen"));
        xhr.send(formData);
      });

    } catch (error) {
      console.error("Error subiendo multimedia:", error);
      throw new Error("No se pudo subir la imagen al servidor.");
    }
  },
  /**
   * Verifica que una URL de imagen existe
   */
  prefetchImage: async (url: string): Promise<boolean> => {
    if (!url || typeof url !== "string") return false;
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  },
};