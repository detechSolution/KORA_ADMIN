import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useKoraPassesStore = defineStore("kora-passes", () => {
  const http = getHttp();

  // State
  const loading = ref(false);
  const koraPasses = ref<any[]>([]);

  // Actions
  const getKoraPasses = async (): Promise<void> => {
    try {
      loading.value = true;
      const res = await http.get(API_ENDPOINTS.KORA_PASSES.GET_LIST) as ApiResponse<any[]>;
      koraPasses.value = res.data;
    }
    catch (error: unknown) {
      console.error(error, "Get Kora Passes Error");
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
  };
});
