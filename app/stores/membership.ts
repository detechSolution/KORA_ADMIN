import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type { CreateMembershipPlanPayload, MembershipPlan, UpdateMembershipPlanPayload } from "~/types/membership";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { buildQueryString } from "~/utils/common";

export const useMembershipStore = defineStore("membership", () => {
  const http = getHttp();
  const plans = ref<ApiResponse<MembershipPlan[]>>({
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
    },
  });
  const members = ref<ApiResponse<MembershipPlan[]>>({
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
    },
  });
  const membersSummary = ref({
    totalMembers: 0,
    activeMembers: 0,
  });
  const loading = ref(false);

  const fetchPlans = async (payload?: {
    pagination: {
      page: number;
      pageSize: number;
    };
    search: string;
    type: string | null;
    status: string | null;
  }) => {
    loading.value = true;
    try {
      const query = buildQueryString({
        page: payload?.pagination.page,
        limit: payload?.pagination.pageSize,
        q: payload?.search,
        type: payload?.type,
        status: payload?.status,
      });
      const response = await http.get(
        `${API_ENDPOINTS.MEMBERSHIP.GET_PLANS}?${query}`,
      ) as ApiResponse<MembershipPlan[]>;
      plans.value = response;
    }
    catch (error) {
      console.error("Error fetching membership plans:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const createPlan = async (payload: CreateMembershipPlanPayload) => {
    loading.value = true;
    try {
      await http.post(
        API_ENDPOINTS.MEMBERSHIP.CREATE_PLAN,
        payload,
      );
    }
    catch (error: unknown) {
      console.error("Error creating membership plan:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const updatePlan = async (id: number, payload: UpdateMembershipPlanPayload) => {
    loading.value = true;
    try {
      await http.patch(
        API_ENDPOINTS.MEMBERSHIP.UPDATE_PLAN(id),
        payload,
      );
    }
    catch (error: unknown) {
      console.error("Error updating membership plan:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchMembers = async (payload: {
    pagination: {
      page: number;
      pageSize: number;
    };
    search: string;
    type: string | null;
    status: string | null;
  }) => {
    loading.value = true;
    try {
      const query = buildQueryString({
        page: payload.pagination.page,
        limit: payload.pagination.pageSize,
        q: payload.search,
        type: payload.type,
        status: payload.status,
      });
      const response = await http.get(
        `${API_ENDPOINTS.MEMBERS.BASE}?${query}`,
      ) as ApiResponse<MembershipPlan[]>;
      members.value = response;
    }
    catch (error) {
      console.error("Error fetching membership plans:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchMembersSummary = async () => {
    loading.value = true;
    try {
      const response = await http.get(
        API_ENDPOINTS.MEMBERS.SUMMARY,
      ) as ApiResponse<MembershipPlan[]>;
      membersSummary.value = response;
    }
    catch (error) {
      console.error("Error fetching membership plans:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const getMembersOptions = async () => {
    try {
      const res = await http.get(API_ENDPOINTS.MEMBERS.OPTIONS) as any;
      return res.data ?? [];
    }
    catch (error: unknown) {
      console.error(error, "Get Members Options Error");
      throw error;
    }
  };

  const createMember = async (payload: any) => {
    loading.value = true;
    try {
      await http.post(
        API_ENDPOINTS.MEMBERS.BASE,
        payload,
      );
    }
    catch (error: unknown) {
      console.error("Error creating membership plan:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  return {
    plans,
    loading,
    fetchPlans,
    createPlan,
    updatePlan,
    fetchMembers,
    fetchMembersSummary,
    members,
    membersSummary,
    getMembersOptions,
    createMember,
  };
});
