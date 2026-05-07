import { defineStore } from "pinia";

import type { ApiResponse } from "~/types/api";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useSessionsStore = defineStore("sessions", () => {
  const http = getHttp();

  // State
  const loading = ref(false);
  const sessions = ref<ApiResponse<any>>({
    data: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
    },
  });

  // Actions
  const getSessions = async (params?: Record<string, any>): Promise<void> => {
    try {
      const qs = params ? buildQueryString(params) : "";
      const res = await http.get(`${API_ENDPOINTS.SESSION.GET_LIST}?${qs}`) as ApiResponse<any>;
      sessions.value = res;
    }
    catch (error: unknown) {
      console.error(error, "Get Sessions Error");
      throw error;
    }
  };

  const createSession = async (payload: {
    sessionName: string;
    bannerImage: File;
    bannerVideo: File;
    sessionDescription: string;
    sessionType: string;
    instructorName: string;
    venue: string;
    capacity: number;
    date: [];
    startTime: string;
    endTime: string;
    price: number;
    isFreeSession: boolean;
  }): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append("name", payload.sessionName);
      formData.append("type", payload.sessionType);
      formData.append("description", payload.sessionDescription);
      formData.append("instructor", payload.instructorName);
      formData.append("venue", payload.venue);
      formData.append("dates", payload.date.join(","));
      formData.append("startTime", payload.startTime);
      formData.append("endTime", payload.endTime);
      formData.append("capacity", String(payload.capacity));
      formData.append("isFree", String(payload.isFreeSession));
      formData.append("price", String(payload.price));
      formData.append("file", payload.bannerImage);
      formData.append("video", payload.bannerVideo);

      await http.post(API_ENDPOINTS.SESSION.CREATE, formData);
    }
    catch (error: unknown) {
      console.error(error, "Create Session Error");
      throw error;
    }
  };

  const updateSession = async (id: number, payload: any): Promise<void> => {
    try {
      await http.patch(API_ENDPOINTS.SESSION.UPDATE(id), payload);
    }
    catch (error: unknown) {
      console.error(error, "Update Session Error");
      throw error;
    }
  };

  return {
    loading,
    sessions,
    getSessions,
    createSession,
    updateSession,
  };
});
