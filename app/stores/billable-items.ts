import { defineStore } from "pinia";
import { ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useBillableItemsStore = defineStore("billable-items", () => {
  const http = getHttp();

  const billableItems = ref<{
    data: any[];
    total_count: number;
  }>({
    data: [],
    total_count: 0,
  });

  const getBillableItems = async (payload: {
    pagination: { page: number; limit: number };
    is_active?: boolean;
  }): Promise<void> => {
    try {
      const body: Record<string, any> = {
        pagination: payload.pagination,
      };
      if (payload.is_active !== undefined)
        body.is_active = payload.is_active;

      const res = await http.post(API_ENDPOINTS.CONFIGURATION.BILLABLE_ITEMS, body) as any;
      billableItems.value.data = res.data ?? [];
      billableItems.value.total_count = res.total_count ?? res.pagination?.total ?? 0;
    }
    catch (error: unknown) {
      console.error(error, "Get Billable Items Error");
      throw error;
    }
  };

  const createBillableItem = async (payload: {
    name: string;
    description: string;
    amount: number;
  }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.CONFIGURATION.BILLABLE_ITEMS_CREATE, {
        name: payload.name,
        description: payload.description,
        amount: payload.amount,
      });
    }
    catch (error: unknown) {
      console.error(error, "Create Billable Item Error");
      throw error;
    }
  };

  const updateBillableItem = async (payload: {
    billable_item_id: number;
    description: string;
    is_active: boolean;
  }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.CONFIGURATION.BILLABLE_ITEMS_UPDATE, {
        billable_item_id: payload.billable_item_id,
        description: payload.description,
        is_active: payload.is_active,
      });
    }
    catch (error: unknown) {
      console.error(error, "Update Billable Item Error");
      throw error;
    }
  };

  return {
    billableItems,
    getBillableItems,
    createBillableItem,
    updateBillableItem,
  };
});
