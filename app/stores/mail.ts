import { defineStore } from "pinia";
import { ref } from "vue";

import type { Mail } from "~/types/mail";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { buildQueryString } from "~/utils/common";

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

  const fetchMails = async (params: Record<string, any>): Promise<void> => {
    loading.value = true;
    try {
      const qs = buildQueryString(params);
      const response = await http.get(`${API_ENDPOINTS.MAILS.BASE}?${qs}`) as any;

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

  const getRecipients = async ({ group }: { group: string }): Promise<any[]> => {
    try {
      const query = buildQueryString({
        group,
      });
      const endpoint = `${API_ENDPOINTS.MAILS.GET_RECIPIENTS}?${query}`;
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
