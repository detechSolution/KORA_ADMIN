import { defineStore } from "pinia";
import { ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useAnalyticsStore = defineStore("analytics", () => {
  const http = getHttp();
  const analyticsStats = ref<any>({
    inquiry_total_count: 0,
    community_total_count: 0,
    total_invoiced: 0,
    total_paid: 0,
  });

  const getAnalyticsStats = async (): Promise<any> => {
    try {
      const res = await http.get(API_ENDPOINTS.ANALYTICS.GET_STATS) as any;
      if (res?.data) {
        analyticsStats.value = {
          inquiry_total_count: res.data.inquiry_total_count ?? 0,
          community_total_count: res.data.community_total_count ?? 0,
          total_invoiced: res.data.total_invoiced ?? 0,
          total_paid: res.data.total_paid ?? 0,
        };
      }
    }
    catch (error: unknown) {
      console.error(error, "Get Analytics Stats Error");
      throw error;
    }
  };

  return {
    analyticsStats,
    getAnalyticsStats,
  };
});
