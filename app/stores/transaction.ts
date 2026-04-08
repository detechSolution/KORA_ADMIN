import { defineStore } from "pinia";
import { ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useTransactionsStore = defineStore("transactions", () => {
  const http = getHttp();

  const transactionList = ref<{
    data: any[];
    total_count: number;
  }>({
    data: [],
    total_count: 0,
  });

  const transactionPaymentList = ref<{
    data: any[];
    total_count: number;
  }>({
    data: [],
    total_count: 0,
  });

  const createTransaction = async (payload: {
    community_id: number;
    reference_date: string;
    due_date: string;
    remarks: string;
    items: any[];
    subtotal: number;
    tax_total: number;
    discount_total: number;
    total_amount: number;
    coupon_id?: number | null;
  }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.TRANSACTIONS.CREATE, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Create Transaction Error");
      throw error;
    }
  };

  const getTransactionList = async (payload: {
    pagination: {
      page: number;
      limit: number;
    };
    status?: string;
    reference_number?: string;
    reference_start_date?: string;
    reference_end_date?: string;
    due_start_date?: string;
    due_end_date?: string;
  }): Promise<void> => {
    try {
      const body: Record<string, any> = {
        pagination: payload.pagination,
      };
      if (payload.status)
        body.status = payload.status;
      if (payload.reference_number)
        body.reference_number = payload.reference_number;
      if (payload.reference_start_date)
        body.reference_start_date = payload.reference_start_date;
      if (payload.reference_end_date)
        body.reference_end_date = payload.reference_end_date;
      if (payload.due_start_date)
        body.due_start_date = payload.due_start_date;
      if (payload.due_end_date)
        body.due_end_date = payload.due_end_date;

      const res = await http.post(API_ENDPOINTS.TRANSACTIONS.GET_LIST, body) as any;
      transactionList.value.data = res.data ?? [];
      transactionList.value.total_count = res.total_count ?? 0;
    }
    catch (error: unknown) {
      console.error(error, "Get Transaction List Error");
      throw error;
    }
  };

  const cancelTransaction = async (transaction_id: number): Promise<void> => {
    try {
      const payload = {
        transaction_id,
        status: "CANCELLED",
      };
      await http.post(API_ENDPOINTS.TRANSACTIONS.UPDATE, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Cancel Transaction Error");
      throw error;
    }
  };

  const getTransactionItems = async (transaction_id: number): Promise<any[]> => {
    try {
      const res = await http.post(API_ENDPOINTS.TRANSACTIONS.ITEMS_GET_LIST, { transaction_id }) as any;
      return res.data ?? [];
    }
    catch (error: unknown) {
      console.error(error, "Get Transaction Items Error");
      throw error;
    }
  };

  const makeTransactionPayment = async (payload: {
    transaction_id: number;
    payment_method_id: number;
    amount: number;
    payment_date: string;
    payment_reference?: string;
    payment_proof_file?: File;
    remarks?: string;
  }): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append("transaction_id", String(payload.transaction_id));
      formData.append("payment_method_id", String(payload.payment_method_id));
      formData.append("amount", String(payload.amount));
      formData.append("payment_date", payload.payment_date);
      formData.append("payment_status", "PAID");
      if (payload.payment_reference?.trim())
        formData.append("payment_reference", payload.payment_reference.trim());
      if (payload.remarks?.trim())
        formData.append("remarks", payload.remarks.trim());
      if (payload.payment_proof_file != null)
        formData.append("payment_proof_file", payload.payment_proof_file);
      await http.post(
        API_ENDPOINTS.TRANSACTION_PAYMENT.MAKE_PAYMENT,
        formData,
      ) as any;
    }
    catch (error: unknown) {
      console.error(error, "Make Transaction Payment Error");
      throw error;
    }
  };

  const getTransactionPaymentList = async (payload: {
    pagination: { page: number; limit: number };
    payment_method_id?: number;
    payment_start_date?: string;
    payment_end_date?: string;
  }): Promise<void> => {
    try {
      const body: Record<string, any> = {
        pagination: payload.pagination,
      };
      if (payload.payment_method_id != null)
        body.payment_method_id = payload.payment_method_id;
      if (payload.payment_start_date)
        body.payment_start_date = payload.payment_start_date;
      if (payload.payment_end_date)
        body.payment_end_date = payload.payment_end_date;
      const res = await http.post(API_ENDPOINTS.TRANSACTION_PAYMENT.GET_LIST, body) as any;
      transactionPaymentList.value.data = res.data ?? [];
      transactionPaymentList.value.total_count = res.total_count ?? 0;
    }
    catch (error: unknown) {
      console.error(error, "Get Transaction Payment List Error");
      throw error;
    }
  };

  const clearTransactionsData = () => {
    transactionList.value = { data: [], total_count: 0 };
  };

  return {
    transactionList,
    transactionPaymentList,
    createTransaction,
    getTransactionList,
    cancelTransaction,
    clearTransactionsData,
    makeTransactionPayment,
    getTransactionItems,
    getTransactionPaymentList,
  };
});
