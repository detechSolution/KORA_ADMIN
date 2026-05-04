import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type { CreatePromoCodePayload, UpdatePromoCodePayload } from "~/types/promo-code";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { buildQueryString } from "~/utils/common";

export const usePromoCodeStore = defineStore("promo-code", () => {
  const http = getHttp();
  const loading = ref(false);
  const promoCodes = ref<ApiResponse<any>>({
    data: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
    },
  });

  const getPromoCodes = async (params?: Record<string, any>) => {
    loading.value = true;
    try {
      const qs = params ? buildQueryString(params) : "";
      const url = qs ? `${API_ENDPOINTS.PROMO_CODES.BASE}?${qs}` : API_ENDPOINTS.PROMO_CODES.BASE;
      const response = await http.get(url) as ApiResponse<any>;
      promoCodes.value = response;
    }
    catch (error) {
      console.error("Failed to fetch promo codes:", error);
    }
    finally {
      loading.value = false;
    }
  };

  const CreatePromoCode = async (payload: CreatePromoCodePayload) => {
    try {
      await http.post(API_ENDPOINTS.PROMO_CODES.BASE, payload) as ApiResponse<any>;
    }
    catch (error) {
      console.error("Failed to create promo code:", error);
      throw error;
    }
  };

  const updatePromoCode = async (id: number, payload: UpdatePromoCodePayload) => {
    try {
      const response = await http.patch(API_ENDPOINTS.PROMO_CODES.UPDATE(id), payload) as ApiResponse<any>;
      return response;
    }
    catch (error) {
      console.error("Failed to update promo code:", error);
      throw error;
    }
  };

  return {
    promoCodes,
    loading,
    getPromoCodes,
    CreatePromoCode,
    updatePromoCode,
  };
});
