import { defineStore } from "pinia";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useSessionsStore = defineStore("sessions", () => {
  const http = getHttp();
  // State

  // Actions
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

  return {
    createSession,
  };
});
