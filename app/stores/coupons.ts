import { defineStore } from "pinia";
import { ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export type CouponType = "PERCENT" | "AMOUNT";

export const useCouponsStore = defineStore("coupons", () => {
  const http = getHttp();
  // State
  const coupons = ref<{
    data: any[];
    total_count: number;
  }>({
    data: [],
    total_count: 0,
  });

  // Actions
  const clearCouponsData = () => {
    coupons.value = {
      data: [],
      total_count: 0,
    };
  };

  const getCoupons = async (payload?: {
    page?: number;
    limit?: number;
    is_active?: boolean;
    code?: string;
  }): Promise<void> => {
    try {
      const res = await http.post(API_ENDPOINTS.COUPONS.GET_LIST, {
        pagination: {
          page: payload?.page ?? 1,
          limit: payload?.limit ?? 10,
        },
        ...(payload?.is_active !== undefined && { is_active: payload.is_active }),
        ...(payload?.code && { code: payload.code }),
      }) as any;
      coupons.value = {
        data: res.data || [],
        total_count: res.total_count ?? 0,
      };
    }
    catch (error: unknown) {
      console.error(error, "Get Coupons Error");
      throw error;
    }
  };

  const createCoupon = async (payload: { code: string; coupon_type: CouponType; discount_value: number; redemption_limit: number; expires_at: string }) => {
    try {
      const response = await http.post(API_ENDPOINTS.COUPONS.BASE, payload) as any;
      return response;
    }
    catch (error: unknown) {
      console.error(error, "Create Coupon Error");
      throw error;
    }
  };

  const updateCoupon = async (payload: { coupon_id: number; coupon_type: CouponType; discount_value: number; redemption_limit: number; expires_at: string; is_active: boolean }) => {
    try {
      const response = await http.post(API_ENDPOINTS.COUPONS.UPDATE, payload) as any;
      return response;
    }
    catch (error: unknown) {
      console.error(error, "Update Coupon Error");
      throw error;
    }
  };

  const previewCoupon = async (code: string) => {
    try {
      const response = await http.post(API_ENDPOINTS.COUPONS.PREVIEW, { code }) as any;
      return response;
    }
    catch (error: unknown) {
      console.error(error, "Preview Coupon Error");
      throw error;
    }
  };

  return {
    coupons,
    getCoupons,
    createCoupon,
    updateCoupon,
    clearCouponsData,
    previewCoupon,
  };
});
