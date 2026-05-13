import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type { Instructor } from "~/types/instructors";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
// import { buildQueryString } from "~/utils/common";

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
  const loading = ref(false);

  const fetchInstructors = async () => {
    loading.value = true;
    try {
      const endpoint = `${API_ENDPOINTS.INSTRUCTORS.BASE}`;

      const response = await http.get(endpoint) as ApiResponse<Instructor[]>;
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

  return {
    instructors,
    loading,
    fetchInstructors,
    createInstructor,
  };
});
