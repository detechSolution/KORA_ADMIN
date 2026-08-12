import { defineStore } from "pinia";
import { ref } from "vue";

import type {
  AccessCard,
  AccessControlUserOption,
  CreateAccessCardPayload,
} from "~/types/access-card";
import type { AccessLog } from "~/types/access-log";
import type { ApiResponse } from "~/types/api";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { buildQueryString } from "~/utils/common";

export const useAccessControlStore = defineStore("access-control", () => {
  const http = getHttp();
  const loading = ref(false);
  const accessCards = ref<ApiResponse<AccessCard[]>>({
    data: [],
    meta: { page: 1, limit: 10, total: 0 },
  });
  const accessLogs = ref<ApiResponse<AccessLog[]>>({
    data: [],
    meta: { page: 1, limit: 10, total: 0 },
  });
  const userOptions = ref<AccessControlUserOption[]>([]);

  const fetchAccessCards = async (params: Record<string, any>) => {
    loading.value = true;
    try {
      const query = buildQueryString(params);
      const response = await http.get<ApiResponse<AccessCard[]>>(`${API_ENDPOINTS.ACCESS_CONTROL.GET_CARDS}?${query}`);
      accessCards.value = response;
    }
    catch (error: unknown) {
      console.error(error, "Fetch Access Cards Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchAccessCard = async (id: number): Promise<AccessCard> => {
    try {
      const response = await http.get<AccessCard | { data: AccessCard }>(API_ENDPOINTS.ACCESS_CONTROL.GET_CARD(id));
      return "data" in response ? response.data : response;
    }
    catch (error: unknown) {
      console.error(error, "Fetch Access Card Error");
      throw error;
    }
  };

  const updateAccessCard = async (id: number, payload: CreateAccessCardPayload) => {
    loading.value = true;
    try {
      await http.patch(API_ENDPOINTS.ACCESS_CONTROL.UPDATE_ACCESS_CARD(id), payload);
    }
    catch (error: unknown) {
      console.error(error, "Update Access Card Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const deleteAccessCard = async (id: number) => {
    loading.value = true;
    try {
      await http.delete(API_ENDPOINTS.ACCESS_CONTROL.DELETE(id));
    }
    catch (error: unknown) {
      console.error(error, "Delete Access Card Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchAccessLogs = async (params: Record<string, any>) => {
    loading.value = true;
    try {
      const query = buildQueryString(params);
      const response = await http.get<ApiResponse<AccessLog[]>>(`${API_ENDPOINTS.ACCESS_CONTROL.GET_LOGS}?${query}`);
      accessLogs.value = response;
    }
    catch (error: unknown) {
      console.error(error, "Fetch Access Logs Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchUserOptions = async (q?: string) => {
    try {
      const query = buildQueryString(q?.trim() ? { q: q.trim() } : {});
      const response = await http.get<{ data?: AccessControlUserOption[] } | AccessControlUserOption[]>(`${API_ENDPOINTS.ACCESS_CONTROL.GET_USER}${query ? `?${query}` : ""}`);
      userOptions.value = Array.isArray(response) ? response : response.data ?? [];
    }
    catch (error: unknown) {
      console.error(error, "Fetch Access Control User Options Error");
      throw error;
    }
  };

  const createAccessCard = async (payload: CreateAccessCardPayload) => {
    loading.value = true;
    try {
      await http.post(API_ENDPOINTS.ACCESS_CONTROL.POST, payload);
    }
    catch (error: unknown) {
      console.error(error, "Create Access Card Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  return {
    loading,
    accessCards,
    accessLogs,
    userOptions,
    fetchAccessCards,
    fetchAccessCard,
    updateAccessCard,
    deleteAccessCard,
    fetchAccessLogs,
    fetchUserOptions,
    createAccessCard,
  };
});
