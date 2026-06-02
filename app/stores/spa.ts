import { defineStore } from "pinia";
import { ref } from "vue";

import type {
  CreateSpaSubTypePayload,
  Spa,
  SpaSubType,
  UpdateSpaPayload,
} from "~/types/spa";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useSpaStore = defineStore("spa", () => {
  const http = getHttp();
  const spaInfo = ref<Spa | null>(null);
  const spaData = ref<SpaSubType[]>([]);

  const getSpaData = async (query?: string) => {
    const search = query?.trim();
    const endpoint = search
      ? `${API_ENDPOINTS.SPA.GET_SPA}?q=${encodeURIComponent(search)}`
      : API_ENDPOINTS.SPA.GET_SPA;
    const response = await http.get<Spa | { spa?: Spa; subTypes?: SpaSubType[] }>(endpoint);
    const spa = "spa" in response && response.spa ? response.spa : response;
    spaInfo.value = "id" in spa ? spa : null;
    spaData.value = spaInfo.value?.subTypes ?? ("subTypes" in response ? response.subTypes ?? [] : []);
  };

  const createSpaSubType = async (payload: CreateSpaSubTypePayload): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.SPA.POST_SUB_TYPE, payload);
    }
    catch (error: unknown) {
      console.error(error, "Create Spa Sub Type Error");
      throw error;
    }
  };

  const getSpaSubTypeById = async (id: number): Promise<SpaSubType> => {
    try {
      const response = await http.get<SpaSubType | { subType?: SpaSubType }>(API_ENDPOINTS.SPA.GET_SUB_TYPE(id));
      return "subType" in response ? response.subType as SpaSubType : response as any;
    }
    catch (error: unknown) {
      console.error(error, "Get Spa Sub Type Error");
      throw error;
    }
  };

  const updateSpaSubType = async (id: number, payload: CreateSpaSubTypePayload): Promise<void> => {
    try {
      await http.patch(API_ENDPOINTS.SPA.UPDATE_SUB_TYPE(id), payload);
    }
    catch (error: unknown) {
      console.error(error, "Update Spa Sub Type Error");
      throw error;
    }
  };

  const updateSpa = async (payload: UpdateSpaPayload): Promise<void> => {
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
  };

  const deleteSpaSubType = async (id: number): Promise<void> => {
    try {
      await http.delete(API_ENDPOINTS.SPA.DELETE_SUB_TYPE(id));
    }
    catch (error: unknown) {
      console.error(error, "Delete Spa Sub Type Error");
      throw error;
    }
  };

  return {
    spaInfo,
    spaData,
    getSpaData,
    updateSpa,
    createSpaSubType,
    getSpaSubTypeById,
    updateSpaSubType,
    deleteSpaSubType,
  };
});
