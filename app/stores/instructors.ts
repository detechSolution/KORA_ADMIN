import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type { Instructor } from "~/types/instructors";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useInstructorsStore = defineStore("instructors", () => {
  const http = getHttp();
  const instructors = ref <ApiResponse<Instructor[]>> ({
    data: [] as Instructor[],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
    },
  });
  const InstructorDetails = ref<Instructor | null>(null);
  const upComingSessions = ref<any>(null);
  const assignedSessions = ref<any>(null);
  const loading = ref(false);

  const fetchInstructors = async (params: Record<string, any>) => {
    loading.value = true;
    try {
      const qs = buildQueryString(params);
      const response = await http.get(`${API_ENDPOINTS.INSTRUCTORS.BASE}?${qs}`) as ApiResponse<Instructor[]>;
      instructors.value = response;
    }
    catch (error) {
      console.error("Error fetching instructors:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const createInstructor = async (payload: { fullName: string; email: string; phoneNumber: string; bio: string; isActive: boolean }): Promise<void> => {
    try {
      const endpoint = `${API_ENDPOINTS.INSTRUCTORS.BASE}`;
      await http.post(endpoint, payload);
    }
    catch (error) {
      console.error("Error creating instructor:", error);
      throw error;
    }
  };

  const updateInstructor = async (id: number, payload: { fullName?: string; email: string; phoneNumber: string; bio: string; isActive: boolean }): Promise<void> => {
    try {
      const endpoint = API_ENDPOINTS.INSTRUCTORS.UPDATE(id);
      await http.patch(endpoint, payload);
    }
    catch (error) {
      console.error("Error updating instructor:", error);
      throw error;
    }
  };

  const fetchInstructorsDetails = async (id: number) => {
    loading.value = true;
    try {
      const endpoint = `${API_ENDPOINTS.INSTRUCTORS.GET_DETAILS(id)}`;
      const response = await http.get(endpoint) as Instructor;
      InstructorDetails.value = response;
    }
    catch (error) {
      console.error("Error fetching instructors:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchUpcomingInstructors = async (id: number) => {
    loading.value = true;
    try {
      const endpoint = `${API_ENDPOINTS.INSTRUCTORS.GET_UPCOMING_SESSIONS(id)}`;
      const response = await http.get(endpoint) as any;
      upComingSessions.value = response;
    }
    catch (error) {
      console.error("Error fetching instructors:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchAssignedSessions = async (id: number) => {
    loading.value = true;
    try {
      const endpoint = `${API_ENDPOINTS.INSTRUCTORS.GET_ASSIGNED_SESSIONS(id)}`;
      const response = await http.get(endpoint) as any;
      assignedSessions.value = response;
    }
    catch (error) {
      console.error("Error fetching instructors:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  return {
    instructors,
    loading,
    fetchInstructors,
    createInstructor,
    updateInstructor,
    fetchInstructorsDetails,
    InstructorDetails,
    upComingSessions,
    assignedSessions,
    fetchUpcomingInstructors,
    fetchAssignedSessions,
  };
});
