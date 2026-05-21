import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type { Payment, PaymentSummary } from "~/types/finance";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { buildQueryString } from "~/utils/common";

export const useFinanceStore = defineStore("finance", () => {
  const http = getHttp();
  const payments = ref<ApiResponse<Payment[]>>({
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
    },
  });
  const cancellations = ref<ApiResponse<any[]>>({
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
    },
  });
  const loading = ref(false);
  const paymentSummary = ref<PaymentSummary | null>(null);
  const cancellationDetails = ref<any | null>(null);

  const fetchPayments = async (params: Record<string, any>) => {
    loading.value = true;
    try {
      const qs = buildQueryString(params);
      const response = await http.get(`${API_ENDPOINTS.PAYMENTS.BASE}?${qs}`) as ApiResponse;
      payments.value = {
        data: response.data as Payment[],
        meta: {
          total: response.meta.total,
          page: response.meta.page,
          limit: response.meta.limit,
        },
      };
    }
    catch (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchPaymentSummary = async () => {
    loading.value = true;
    try {
      const response = await http.get(API_ENDPOINTS.PAYMENTS.SUMMARY) as PaymentSummary;
      paymentSummary.value = response;
    }
    catch (error) {
      console.error("Error fetching payment summary:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchCancellations = async (params: Record<string, any>) => {
    loading.value = true;
    try {
      const qs = buildQueryString(params);
      const response = await http.get(`${API_ENDPOINTS.CANCELLATIONS.BASE}?${qs}`) as ApiResponse;
      cancellations.value = {
        data: response.data as Payment[],
        meta: {
          total: response.meta.total,
          page: response.meta.page,
          limit: response.meta.limit,
        },
      };
    }
    catch (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const refundPayment = async (id: number) => {
    loading.value = true;
    try {
      const response = await http.patch(API_ENDPOINTS.CANCELLATIONS.REFUND(id)) as ApiResponse;
      payments.value = {
        data: response.data as Payment[],
        meta: {
          total: response.meta.total,
          page: response.meta.page,
          limit: response.meta.limit,
        },
      };
    }
    catch (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchCancellationDetails = async (id: number) => {
    loading.value = true;
    try {
      const response = await http.get(API_ENDPOINTS.CANCELLATIONS.GET_DETAILS(id)) as any;
      cancellationDetails.value = response as any;
    }
    catch (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const updateRefund = async (id: number, payload: FormData) => {
    loading.value = true;
    try {
      const response = await http.patch(API_ENDPOINTS.CANCELLATIONS.UPDATE_REFUND(id), payload) as any;
      await fetchCancellationDetails(id);
      return response;
    }
    catch (error) {
      console.error("Error updating refund:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  return {
    payments,
    fetchPayments,
    paymentSummary,
    fetchPaymentSummary,
    loading,
    cancellations,
    fetchCancellations,
    refundPayment,
    cancellationDetails,
    fetchCancellationDetails,
    updateRefund,
  };
});
