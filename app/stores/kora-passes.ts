import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useKoraPassesStore = defineStore("kora-passes", () => {
  const http = getHttp();

  // State
  const loading = ref(false);
  const koraPasses = ref<ApiResponse<any>>({
    data: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
    },
  });

  // Actions
  const getKoraPasses = async (): Promise<void> => {
    try {
      loading.value = true;
      const res = await http.get(API_ENDPOINTS.KORA_PASSES.GET_LIST) as ApiResponse<any[]>;
      koraPasses.value = res;
    }
    catch (error: unknown) {
      console.error(error, "Get Kora Passes Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const createPass = async (form: any): Promise<void> => {
    try {
      loading.value = true;
      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        discount: form.discount,
        numberOfDays: form.validity,
        isActive: form.status,
      };
      await http.post(API_ENDPOINTS.KORA_PASSES.CREATE, payload);
    }
    catch (error: unknown) {
      console.error(error, "Create Kora Pass Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const updatePass = async (id: number, payload: any): Promise<void> => {
    try {
      loading.value = true;
      await http.patch(API_ENDPOINTS.KORA_PASSES.UPDATE(id), payload);
    }
    catch (error: unknown) {
      console.error(error, "Update Kora Pass Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  return {
    loading,
    koraPasses,
    getKoraPasses,
    createPass,
    updatePass,
  };
});
