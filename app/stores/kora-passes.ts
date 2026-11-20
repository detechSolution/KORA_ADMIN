import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type {
  InvitationGuest,
  InvitationResult,
  InvitationUpdate,
  KoraPass,
  PassInvitee,
} from "~/types/kora-passes";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useKoraPassesStore = defineStore("kora-passes", () => {
  const http = getHttp();

  // State
  const loading = ref(false);
  const koraPasses = ref<ApiResponse<KoraPass[]>>({
    data: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
    },
  });

  // Actions
  const getKoraPasses = async (): Promise<void> => {
    try {
      loading.value = true;
      const res = (await http.get(
        API_ENDPOINTS.KORA_PASSES.GET_LIST,
      )) as ApiResponse<KoraPass[]>;
      koraPasses.value = res;
    }
    catch (error: unknown) {
      console.error(error, "Get Kora Passes Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const createPass = async (form: any): Promise<void> => {
    try {
      loading.value = true;
      const payload = {
        name: form.name,
        description: form.description,
        ...(form.isInvitation ? {} : { price: form.price }),
        spaBenefit: form.spaBenefit,
        classBenefit: form.classBenefit,
        eventBenefit: form.eventBenefit,
        workshopBenefit: form.workshopBenefit,
        cafeBenefit: form.cafeBenefit,
        salonBenefit: form.salonBenefit,
        numberOfDays: form.validity,
        isActive: form.status,
        isInvitation: form.isInvitation,
      };
      await http.post(API_ENDPOINTS.KORA_PASSES.CREATE, payload);
    }
    catch (error: unknown) {
      console.error(error, "Create Kora Pass Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const updatePass = async (id: number, payload: any): Promise<void> => {
    try {
      loading.value = true;
      await http.patch(API_ENDPOINTS.KORA_PASSES.UPDATE(id), payload);
    }
    catch (error: unknown) {
      console.error(error, "Update Kora Pass Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const invitePass = async (
    id: number,
    guests: InvitationGuest[],
    fromDate: string,
  ): Promise<InvitationResult> => {
    try {
      loading.value = true;
      const payload = { guests, fromDate };
      return await http.post<InvitationResult>(
        API_ENDPOINTS.KORA_PASSES.INVITE(id),
        payload,
      );
    }
    catch (error: unknown) {
      console.error(error, "Invite Kora Pass Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const getInvitees = (
    passId: number,
    page: number,
    limit = 20,
    filters: {
      q?: string;
      inviteeStatus?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) => {
    const query = new URLSearchParams({
      passId: String(passId),
      page: String(page),
      limit: String(limit),
    });
    for (const [key, value] of Object.entries(filters)) {
      if (value)
        query.set(key, value);
    }
    return http.get<ApiResponse<PassInvitee[]>>(
      `${API_ENDPOINTS.KORA_PASSES.INVITEES}?${query}`,
    );
  };

  const updateInvitee = (id: number, payload: InvitationUpdate) =>
    http.patch<PassInvitee & { sentEmail: boolean }>(
      API_ENDPOINTS.KORA_PASSES.UPDATE_INVITEE(id),
      payload,
    );

  return {
    getInvitees,
    updateInvitee,
    loading,
    koraPasses,
    getKoraPasses,
    createPass,
    invitePass,
    updatePass,
  };
});
