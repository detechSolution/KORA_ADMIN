import { defineStore } from "pinia";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const usePaymentMethodsStore = defineStore("payment-methods", () => {
  const http = getHttp();

  const createTransactionPaymentCategory = async (payload: { name: string }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.TRANSACTION_PAYMENT.CATEGORY, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Create Transaction Payment Category Error");
      throw error;
    }
  };

  const getTransactionPaymentCategories = async (): Promise<void> => {
    try {
      const res = await http.get(API_ENDPOINTS.TRANSACTION_PAYMENT.CATEGORY_GET_LIST) as any;
      return res.data ?? [];
    }
    catch (error: unknown) {
      console.error(error, "Get Transaction Payment Categories Error");
      throw error;
    }
  };

  const createTransactionPaymentMethod = async (payload: {
    name: string;
    category_id: number;
    is_active: boolean;
  }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.TRANSACTION_PAYMENT.METHOD, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Create Transaction Payment Method Error");
      throw error;
    }
  };

  const getTransactionPaymentMethods = async (payload?: { is_active?: boolean; category_id?: number }): Promise<void> => {
    try {
      const body: Record<string, any> = {};
      if (payload?.is_active !== undefined)
        body.is_active = payload.is_active;
      if (payload?.category_id !== undefined)
        body.category_id = payload.category_id;
      const res = await http.post(API_ENDPOINTS.TRANSACTION_PAYMENT.METHOD_GET_LIST, body) as any;
      return res.data ?? [];
    }
    catch (error: unknown) {
      console.error(error, "Get Transaction Payment Methods Error");
      throw error;
    }
  };

  const updateTransactionPaymentMethod = async (payload: {
    payment_method_id: number;
    name: string;
    category_id: number;
    is_active: boolean;
  }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.TRANSACTION_PAYMENT.METHOD_UPDATE, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Update Transaction Payment Method Error");
      throw error;
    }
  };

  return {
    createTransactionPaymentCategory,
    getTransactionPaymentCategories,
    createTransactionPaymentMethod,
    getTransactionPaymentMethods,
    updateTransactionPaymentMethod,
  };
});
