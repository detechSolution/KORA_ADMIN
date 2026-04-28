import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiListResponse, ApiResponse } from "~/types/api";
import type { Mail } from "~/types/mail";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { buildQueryString } from "~/utils/common";

type MailDateRange = {
  start: string | null;
  end?: string | null;
};

export const useMailStore = defineStore("mail", () => {
  const http = getHttp();
  const mails = ref<{
    data: Mail[];
    total: number;
  }>({
    data: [],
    total: 0,
  });
  const loading = ref(false);

  const fetchMails = async (payload: {
    pagination: { page: number; limit: number };
    search?: string;
    status?: string | null;
    dateRange?: MailDateRange | null;
  }): Promise<void> => {
    loading.value = true;
    try {
      const query = buildQueryString({
        page: payload.pagination.page,
        limit: payload.pagination.limit,
        q: payload.search?.trim(),
        status: payload.status || undefined,
        createdFrom: payload.dateRange?.start || undefined,
        createdTo: payload.dateRange?.end || undefined,
      });

      const endpoint = query
        ? `${API_ENDPOINTS.MAILS.GET_LIST}?${query}`
        : API_ENDPOINTS.MAILS.GET_LIST;

      const response = await http.get<ApiListResponse<Mail> & Partial<ApiResponse<Mail[]>> & { total?: number }>(endpoint);

      mails.value = {
        data: response.data || [],
        total: Number(response.total_count ?? response.meta?.total ?? response.total ?? 0),
      };
    }
    catch (error) {
      console.error("Error fetching mails:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const getRecipients = async (search?: string): Promise<any[]> => {
    try {
      const query = buildQueryString({
        q: search?.trim() || undefined,
      });
      const endpoint = query
        ? `${API_ENDPOINTS.MAILS.GET_RECIPIENTS}?${query}`
        : API_ENDPOINTS.MAILS.GET_RECIPIENTS;
      const response = await http.get(endpoint) as any;
      return response?.data ?? response ?? [];
    }
    catch (error) {
      console.error("Error fetching recipients:", error);
      throw error;
    }
  };

  const createMail = async (payload: any): Promise<void> => {
    try {
      const response = await http.post(API_ENDPOINTS.MAILS.CREATE, payload) as any;
      return response.data;
    }
    catch (error) {
      console.error("Error sending mail:", error);
      throw error;
    }
  };

  const getRecipents = getRecipients;

  return {
    mails,
    loading,
    fetchMails,
    getRecipients,
    getRecipents,
    createMail,
  };
});
