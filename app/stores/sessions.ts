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
  const sessionToCopy = ref<any>(null);

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
      const formData = new FormData();
      formData.append("name", payload.sessionName);
      formData.append("type", payload.sessionType);
      formData.append("description", payload.sessionDescription);
      formData.append("instructor", payload.instructorName);
      formData.append("venue", payload.venue);
      formData.append("sessionDate", payload.date);
      formData.append("startTime", payload.startTime);
      formData.append("endTime", payload.endTime);
      formData.append("capacity", String(payload.capacity));
      formData.append("isFree", String(payload.isFreeSession));
      formData.append("price", String(payload.price));
      if (payload.bannerImage instanceof File) {
        formData.append("file", payload.bannerImage);
      }
      if (payload.bannerVideo instanceof File) {
        formData.append("video", payload.bannerVideo);
      }
      await http.patch(API_ENDPOINTS.SESSION.UPDATE(id), formData);
    }
    catch (error: unknown) {
      console.error(error, "Update Session Error");
      throw error;
    }
  };

  const getAttendance = async (sessionId: number): Promise<any> => {
    console.log("🚀 ~ getAttendance ~ sessionId:", sessionId);
    try {
      // Mocking for now as per user request
      return [
        { id: 1, name: "Shyam Shakya", phone: "9845897465", status: "attended" },
        { id: 2, name: "Anil Shakya", phone: "9845897465", status: "no-show" },
        { id: 3, name: "Prabesh Poudel", phone: "9845897465", status: "pending" },
        { id: 4, name: "Rohan Yadav", phone: "9845897465", status: "pending" },
        { id: 5, name: "Simran Gurung", phone: "9845897465", status: "pending" },
        { id: 6, name: "Simran Gurung", phone: "9845897465", status: "pending" },
        { id: 7, name: "Simran Gurung", phone: "9845897465", status: "pending" },
        { id: 8, name: "Simran Gurung", phone: "9845897465", status: "pending" },
      ];
      // Actual API call:
      // return await http.get(`${API_ENDPOINTS.SESSION.GET_ATTENDANCE(sessionId)}`);
    }
    catch (error: unknown) {
      console.error(error, "Get Attendance Error");
      throw error;
    }
  };

  const saveAttendance = async (sessionId: number, attendance: any[]): Promise<void> => {
    try {
      console.log("Saving attendance for session", sessionId, attendance);
      // await http.post(`${API_ENDPOINTS.SESSION.SAVE_ATTENDANCE(sessionId)}`, { attendance });
    }
    catch (error: unknown) {
      console.error(error, "Save Attendance Error");
      throw error;
    }
  };

  return {
    loading,
    sessions,
    sessionToCopy,
    getSessions,
    createSession,
    updateSession,
    getAttendance,
    saveAttendance,
  };
});
