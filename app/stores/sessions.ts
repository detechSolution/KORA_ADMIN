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
  const sessionAttendance = ref<any>({
    data: [],
  });
  const memberOrPassUser = ref<any>({
    data: [],
    meta: {},
  });
  const sessionToCopy = ref<any>(null);

  // Actions
  const getSessions = async (params: Record<string, any>): Promise<void> => {
    try {
      const qs = buildQueryString(params);
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
    instructorId?: number | null;
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
      if (payload.instructorId !== undefined && payload.instructorId !== null) {
        formData.append("instructorId", String(payload.instructorId));
      }
      formData.append("venue", payload.venue);
      formData.append("dates", payload.date.join(","));
      formData.append("startTime", payload.startTime);
      formData.append("endTime", payload.endTime);
      formData.append("capacity", String(payload.capacity));
      formData.append("isFree", String(payload.isFreeSession));
      formData.append("price", String(payload.price));
      formData.append("file", payload.bannerImage);
      formData.append("video", payload.bannerVideo);
      if (typeof payload.bannerImage === "string") {
        formData.delete("file");
        formData.append("fileUrl", payload.bannerImage);
      }
      if (typeof payload.bannerVideo === "string") {
        formData.delete("video");
        formData.append("videoUrl", payload.bannerVideo);
      }

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
      formData.append("instructorId", String(payload.instructorId));
      formData.append("venue", payload.venue);
      formData.append("sessionDate", payload.date);
      formData.append("startTime", payload.startTime);
      formData.append("endTime", payload.endTime);
      formData.append("capacity", String(payload.capacity));
      formData.append("isFree", String(payload.isFreeSession));
      formData.append("price", String(payload.price));
      if (payload.instructorId === null) {
        formData.delete("instructorId");
      }
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
    try {
      const endpoint = API_ENDPOINTS.SESSION.GET_ATTENDANCE_LIST(sessionId);
      const response = await http.get(endpoint) as ApiResponse<any[]>;
      sessionAttendance.value = response;
    }
    catch (error: unknown) {
      console.error(error, "Get Attendance Error");
      throw error;
    }
  };

  const saveAttendance = async (sessionId: number, items: { id: number; attendanceStatus: string }[]): Promise<void> => {
    try {
      await http.post(`${API_ENDPOINTS.SESSION.SAVE_ATTENDANCE(sessionId)}`, { items });
    }
    catch (error: unknown) {
      console.error(error, "Save Attendance Error");
      throw error;
    }
  };

  type MembersResponse = {
    data: any[];
    meta: any;
  };

  const getMembers = async (
    id: number,
    params?: { q?: string },
  ): Promise<void> => {
    try {
      const query = buildQueryString(params ?? {});

      const endpoint = query
        ? `${API_ENDPOINTS.SESSION.GET_ATTENDANCE_CANDIDATES(id)}?${query}`
        : API_ENDPOINTS.SESSION.GET_ATTENDANCE_CANDIDATES(id);
      const response = await http.get(endpoint) as MembersResponse;
      memberOrPassUser.value = response;
    }
    catch (error: unknown) {
      console.error("Get Members Error:", error);
      throw error;
    }
  };

  const addMemberToSession = async (sessionId: number, payload: { memberId: number; userPassId: number }): Promise<void> => {
    try {
      await http.post(`${API_ENDPOINTS.SESSION.ADD_MEMBER(sessionId)}`, payload);
    }
    catch (error: unknown) {
      console.error(error, "Add Member Error");
      throw error;
    }
  };

  return {
    loading,
    sessions,
    sessionToCopy,
    sessionAttendance,
    memberOrPassUser,
    getSessions,
    createSession,
    updateSession,
    getAttendance,
    saveAttendance,
    getMembers,
    addMemberToSession,
  };
});
