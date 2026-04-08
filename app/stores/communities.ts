import { defineStore } from "pinia";
import { ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export type CommunitySubscriptionPlan = {
  id?: number;
  subscription_plan_id?: number;
  name?: string;
  plan_name?: string;
  price?: number | string;
  interval?: string;
  [key: string]: any;
};

export type CommunityUsageSummary = {
  total_houses: number;
  houses_owned: number;
  houses_available: number;
  houses_no_owner: number;
  total_residents: number;
  active_residents: number;
  total_guards: number;
  active_guards: number;
  total_visitors: number;
};

export const useCommunitiesStore = defineStore("communities", () => {
  const http = getHttp();
  // State
  const communities = ref<{
    data: any[];
    total: number;
  }>({
    data: [],
    total: 0,
  });

  const communityDetail = ref<any>(null);

  // Actions

  const clearCommunitiesData = () => {
    communities.value = {
      data: [],
      total: 0,
    };
  };

  const getCommunities = async (payload: { pagination: { page: number; limit: number }; search: string; start_date: string | null; end_date: string | null }): Promise<void> => {
    try {
      const res = await http.post(API_ENDPOINTS.COMMUNITIES.GET_LIST, payload) as any;
      communities.value = {
        data: res.data || [],
        total: res.total_count || 0,
      };
    }
    catch (error: unknown) {
      console.error(error, "Get Communities Error");
      throw error;
    }
  };

  const updateCommunityStatus = async (communityId: number, status: string): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.COMMUNITIES.UPDATE_STATUS, { community_id: communityId, status });
    }
    catch (error: unknown) {
      console.error(error, "Update Community Status Error");
      throw error;
    }
  };

  const createCommunity = async (payload: {
    community_name: string;
    contact_name: string;
    address: string;
    city: string;
    state: string;
    email: string;
    phone: string;
    declared_units: number;
    billed_units: number;
    subscription_plan_id: number;
    subscription_start_date: string;
    subscription_end_date: string;
    admin: {
      name: string;
      email: string;
      password: string;
    };
  }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.COMMUNITIES.CREATE, payload);
    }
    catch (error: unknown) {
      console.error(error, "Create Community Error");
      throw error;
    }
  };

  const updateCommunitySubscriptionStatus = async (payload: { subscription_id: number; status: string }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.COMMUNITIES.UPDATE_SUBSCRIPTION_STATUS, payload);
    }
    catch (error: unknown) {
      console.error(error, "Update Community Subscription Status Error");
      throw error;
    }
  };
  const getCommunitySummary = async (communityId: number): Promise<any> => {
    try {
      const res = await http.get(API_ENDPOINTS.COMMUNITIES.GET_ACCOUNT_SUMMARY(communityId)) as any;
      const data = res?.data ?? res ?? null;
      communityDetail.value = data;
      return data;
    }
    catch (error: unknown) {
      console.error(error, "Get Community Summary Error");
      communityDetail.value = null;
      throw error;
    }
  };

  const getCommunityUsageSummary = async (communityId: number): Promise<CommunityUsageSummary | null> => {
    try {
      const res = await http.get(API_ENDPOINTS.COMMUNITIES.GET_USAGE_SUMMARY(communityId)) as any;
      const data = res?.data ?? res ?? null;
      return data as CommunityUsageSummary | null;
    }
    catch (error: unknown) {
      console.error(error, "Get Community Usage Summary Error");
      throw error;
    }
  };

  const getCommunitySubscriptionPlan = async (communityId: number): Promise<CommunitySubscriptionPlan | CommunitySubscriptionPlan[] | null> => {
    try {
      const res = await http.get(API_ENDPOINTS.COMMUNITIES.GET_COMMUNITY_SUBSCRIPTION_PLAN(communityId)) as any;
      return res?.data ?? res ?? null;
    }
    catch (error: unknown) {
      console.error(error, "Get Community Subscription Plan Error");
      throw error;
    }
  };

  const getCommunityAdmins = async (payload: {
    community_id: number;
    pagination: { page: number; limit: number };
  }): Promise<any> => {
    try {
      const res = await http.post(API_ENDPOINTS.COMMUNITIES.GET_ADMINS, {
        community_id: payload.community_id,
        pagination: payload.pagination,
      }) as any;
      const data = res?.data ?? [];
      const total_count = res?.total_count ?? 0;
      return { data, total_count };
    }
    catch (error: unknown) {
      console.error(error, "Get Community Admins Error");
      throw error;
    }
  };

  const activateCommunityAdmin = async (payload: {
    user_id: number;
    community_id: number;
    send_email: boolean;
  }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.COMMUNITIES.ACTIVATE_ADMIN, payload);
    }
    catch (error: unknown) {
      console.error(error, "Activate Community Admin Error");
      throw error;
    }
  };

  const clearCommunityDetail = () => {
    communityDetail.value = null;
  };

  return {
    communities,
    communityDetail,
    getCommunityAdmins,
    activateCommunityAdmin,
    getCommunitySummary,
    getCommunityUsageSummary,
    getCommunitySubscriptionPlan,
    clearCommunityDetail,
    getCommunities,
    createCommunity,
    updateCommunityStatus,
    updateCommunitySubscriptionStatus,
    clearCommunitiesData,
  };
});
