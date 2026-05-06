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
  const loading = ref(false);
  const paymentSummary = ref<PaymentSummary | null>(null);
  const fetchPayments = async (payload: {
    pagination: {
      page: number;
      pageSize: number;
    };
    search: string;
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
    status: string | null;
  }) => {
    loading.value = true;
    try {
      const query = buildQueryString({
        page: payload.pagination.page,
        limit: payload.pagination.pageSize,
        q: payload.search,
        status: payload.status,
      });
      const url = `${API_ENDPOINTS.PAYMENTS.BASE}?${query}`;
      const response = await http.get(url) as ApiResponse;
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

  return {
    payments,
    fetchPayments,
    paymentSummary,
    fetchPaymentSummary,
    loading,
  };
});
