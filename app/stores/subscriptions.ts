import { defineStore } from "pinia";
import { ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useSubscriptionsStore = defineStore("subscriptions", () => {
  const http = getHttp();
  const subscriptionPlans = ref<{
    data: any[];
    total: number;
  }>({
    data: [],
    total: 0,
  });

  const clearSubscriptionData = () => {
    subscriptionPlans.value = {
      data: [],
      total: 0,
    };
  };

  const getSubscriptionPlans = async (payload: { pagination: { page: number; limit: number }; is_active?: boolean | null }): Promise<void> => {
    try {
      const body: Record<string, any> = {
        pagination: payload.pagination,
      };
      if (typeof payload.is_active === "boolean")
        body.is_active = payload.is_active;
      const res = await http.post(API_ENDPOINTS.SUBSCRIPTION.PLANS_GET_LIST, body) as any;
      if (res.data) {
        subscriptionPlans.value = {
          data: res.data,
          total: res.total_count || 0,
        };
      }
    }
    catch (error: unknown) {
      console.error(error, "Get Subscription Plans Error");
      throw error;
    }
  };

  const createSubscriptionPlan = async (payload: { name: string; description: string; price: number; interval: string; is_active: boolean }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.SUBSCRIPTION.CREATE_PLAN, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Create Subscription Plan Error");
      throw error;
    }
  };

  const updateSubscriptionPlan = async (payload: { subscription_plan_id: number; price: number; is_active: boolean }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.SUBSCRIPTION.UPDATE_PLAN, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Update Subscription Plan Error");
      throw error;
    }
  };

  return {
    subscriptionPlans,
    getSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    clearSubscriptionData,
  };
});
