import { defineStore } from "pinia";
import { ref } from "vue";

import type {
  CreateSpaCategoryPayload,
  CreateSpaSubTypePayload,
  Spa,
  SpaCategory,
  SpaCategoryListResponse,
  SpaCategoryResponse,
  SpaResponse,
  SpaSubType,
  SpaSubTypeResponse,
  UpdateSpaPayload,
  UpdateSpaSubTypePayload,
} from "~/types/spa";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useSpaStore = defineStore("spa", () => {
  const http = getHttp();
  const loading = ref(false);
  const spaInfo = ref<Spa | null>(null);
  const spaData = ref<SpaSubType[]>([]);
  const spaCategories = ref<SpaCategory[]>([]);

  const getSpaData = async (query?: string) => {
    loading.value = true;
    try {
      const search = query?.trim();
      const endpoint = search
        ? `${API_ENDPOINTS.SPA.GET_SPA}?q=${encodeURIComponent(search)}`
        : API_ENDPOINTS.SPA.GET_SPA;
      const response = await http.get<SpaResponse>(endpoint);
      const spa = "spa" in response && response.spa ? response.spa : response;

      if ("id" in spa) {
        spaInfo.value = spa;
        spaData.value = spa.subTypes;
      }
      else {
        spaInfo.value = null;
        spaData.value = spa.subTypes ?? [];
      }
    }
    catch (error: unknown) {
      console.error(error, "Get Spa Data Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const getSpaCategories = async (): Promise<SpaCategory[]> => {
    loading.value = true;
    try {
      const response = await http.get<SpaCategoryListResponse>(API_ENDPOINTS.SPA.GET_CATEGORIES);
      spaCategories.value = Array.isArray(response)
        ? response
        : response.categories ?? response.data ?? [];
      return spaCategories.value;
    }
    catch (error: unknown) {
      console.error(error, "Get Spa Categories Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const createSpaCategory = async (payload: CreateSpaCategoryPayload): Promise<SpaCategory> => {
    loading.value = true;
    try {
      const response = await http.post<SpaCategoryResponse>(API_ENDPOINTS.SPA.CREATE_CATEGORY, payload);
      const createdCategory = "id" in response
        ? response
        : response.category ?? response.data;

      if (createdCategory) {
        spaCategories.value = [
          ...spaCategories.value.filter(category => category.id !== createdCategory.id),
          createdCategory,
        ];
        return createdCategory;
      }

      await getSpaCategories();
      const category = spaCategories.value.find(
        item => item.name.toLowerCase() === payload.name.trim().toLowerCase(),
      );

      if (category) {
        return category;
      }

      throw new Error("The category was created but could not be found in the category list.");
    }
    catch (error: unknown) {
      console.error(error, "Create Spa Category Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const createSpaSubType = async (payload: CreateSpaSubTypePayload): Promise<void> => {
    loading.value = true;
    try {
      await http.post(API_ENDPOINTS.SPA.POST_SUB_TYPE, payload);
    }
    catch (error: unknown) {
      console.error(error, "Create Spa Sub Type Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const getSpaSubTypeById = async (id: number): Promise<SpaSubType> => {
    loading.value = true;
    try {
      const response = await http.get<SpaSubTypeResponse>(API_ENDPOINTS.SPA.GET_SUB_TYPE(id));
      const subType = "id" in response ? response : response.subType ?? response.data;

      if (!subType) {
        throw new Error("Spa sub-type was not found.");
      }

      return subType;
    }
    catch (error: unknown) {
      console.error(error, "Get Spa Sub Type Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const updateSpaSubType = async (id: number, payload: UpdateSpaSubTypePayload): Promise<void> => {
    loading.value = true;
    try {
      await http.patch(API_ENDPOINTS.SPA.UPDATE_SUB_TYPE(id), payload);
    }
    catch (error: unknown) {
      console.error(error, "Update Spa Sub Type Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const updateSpa = async (payload: UpdateSpaPayload): Promise<void> => {
    loading.value = true;
    try {
      const formData = new FormData();
      payload.availableDays.forEach(day => formData.append("availableDays", day));
      formData.append("availableFromTime", payload.availableFromTime);
      formData.append("availableToTime", payload.availableToTime);
      formData.append("capacityPerSlot", String(payload.capacityPerSlot));
      formData.append("description", payload.description);

      if (payload.video) {
        formData.append("video", payload.video);
      }
      if (payload.file) {
        formData.append("file", payload.file);
      }

      await http.patch(API_ENDPOINTS.SPA.UPDATE_SPA, formData);
    }
    catch (error: unknown) {
      console.error(error, "Update Spa Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const deleteSpaSubType = async (id: number): Promise<void> => {
    loading.value = true;
    try {
      await http.delete(API_ENDPOINTS.SPA.DELETE_SUB_TYPE(id));
    }
    catch (error: unknown) {
      console.error(error, "Delete Spa Sub Type Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  return {
    loading,
    spaInfo,
    spaData,
    spaCategories,
    getSpaData,
    getSpaCategories,
    createSpaCategory,
    updateSpa,
    createSpaSubType,
    getSpaSubTypeById,
    updateSpaSubType,
    deleteSpaSubType,
  };
});
