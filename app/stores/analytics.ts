import { defineStore } from "pinia";
import { ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useAnalyticsStore = defineStore("analytics", () => {
  const http = getHttp();
  const analyticsStats = ref<any>({
    todayBookings: 0,
    todaySessions: 0,
    totalMembers: 0,
    todayRevenue: 0,
    currency: "",
  });

  const getAnalyticsStats = async (): Promise<any> => {
    try {
      const res = await http.get(API_ENDPOINTS.ANALYTICS.GET_STATS) as any;
      analyticsStats.value = res;
    }
    catch (error: unknown) {
      console.error(error, "Get Analytics Stats Error");
      throw error;
    }
  };

  const getBookingsBySessions = async (): Promise<any> => {
    try {
      const res = await http.get(API_ENDPOINTS.ANALYTICS.GET_SESSIONS_TREND) as any;
      return res;
    }
    catch (error: unknown) {
      console.error(error, "Get Analytics Stats Error");
      throw error;
    }
  };

  const getRevenueTrend = async (): Promise<any> => {
    try {
      const res = await http.get(API_ENDPOINTS.ANALYTICS.GET_REVENUE_TREND) as any;
      return res;
    }
    catch (error: unknown) {
      console.error(error, "Get Analytics Stats Error");
      throw error;
    }
  };

  const getConsistentMembers = async (): Promise<any> => {
    try {
      const res = await http.get(API_ENDPOINTS.ANALYTICS.GET_CONSISTENT_MEMBER) as any;
      return res;
    }
    catch (error: unknown) {
      console.error(error, "Get Analytics Stats Error");
      throw error;
    }
  };

  return {
    analyticsStats,
    getAnalyticsStats,
    getBookingsBySessions,
    getRevenueTrend,
    getConsistentMembers,
  };
});
