import { defineStore } from "pinia";
import { ref } from "vue";

import type { Inquiry } from "~/types/inquiry";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

type InquiryStatusOption = { id: number; name: string; description?: string };
type InquirySourceOption = { id: number; name: string };

export const useInquiriesStore = defineStore("inquiries", () => {
  const http = getHttp();

  const inquiries = ref<{ data: Inquiry[]; total: number }>({
    data: [],
    total: 0,
  });
  const inquiryStatuses = ref<InquiryStatusOption[]>([]);
  const inquirySources = ref<InquirySourceOption[]>([]);

  const clearInquiriesData = () => {
    inquiries.value = { data: [], total: 0 };
    inquiryStatuses.value = [];
  };

  const getInquiries = async (payload: {
    page: number;
    limit: number;
    search?: string;
    status_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<void> => {
    try {
      const body: Record<string, any> = {
        pagination: { page: payload.page, limit: payload.limit },
      };
      if (payload.search)
        body.search = payload.search;
      if (payload.status_id != null)
        body.status_id = payload.status_id;
      if (payload.start_date)
        body.start_date = payload.start_date;
      if (payload.end_date)
        body.end_date = payload.end_date;

      const res = await http.post(API_ENDPOINTS.INQUIRIES.GET_LIST, body) as any;
      if (res) {
        inquiries.value = {
          data: res.data || [],
          total: res.total_count ?? 0,
        };
      }
    }
    catch (error: unknown) {
      console.error(error, "Get Inquiries Error");
      throw error;
    }
  };

  const createInquiry = async (payload: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    number_of_units?: number | null;
    inquiry_source_id?: number | null;
    notes?: string;
  }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.INQUIRIES.BASE, payload) as any;
    }
    catch (error: unknown) {
      console.error(error, "Create Inquiry Error");
      throw error;
    }
  };

  const getInquiryStatuses = async (): Promise<void> => {
    try {
      const res = await http.get(API_ENDPOINTS.INQUIRIES.GET_STATUS_LIST) as any;
      if (res)
        inquiryStatuses.value = res.data || [];
    }
    catch (error: unknown) {
      console.error(error, "Get Inquiry Statuses Error");
      throw error;
    }
  };

  const getInquirySources = async (): Promise<void> => {
    try {
      const res = await http.get(API_ENDPOINTS.INQUIRIES.GET_SOURCES_LIST) as any;
      if (res)
        inquirySources.value = res.data || [];
    }
    catch (error: unknown) {
      console.error(error, "Get Inquiry Sources Error");
      throw error;
    }
  };

  const updateInquiryStatus = async (payload: {
    inquiry_id: number;
    status_id: number;
    notes: string;
  }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.INQUIRIES.UPDATE_STATUS, {
        inquiry_id: payload.inquiry_id,
        status_id: payload.status_id,
        notes: payload.notes,
      }) as any;
    }
    catch (error: unknown) {
      console.error(error, "Update Inquiry Status Error");
      throw error;
    }
  };

  const updateInquiry = async (payload: {
    inquiry_id: number;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    number_of_units?: number | null;
    inquiry_source_id?: number | null;
    notes?: string;
  }): Promise<void> => {
    try {
      const body: Record<string, any> = {
        inquiry_id: payload.inquiry_id,
        company_name: payload.company_name,
        contact_name: payload.contact_name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address ?? null,
        city: payload.city ?? null,
        state: payload.state ?? null,
        number_of_units: payload.number_of_units ?? null,
        notes: payload.notes ?? null,
        inquiry_source_id: payload.inquiry_source_id ?? null,
      };
      await http.post(API_ENDPOINTS.INQUIRIES.UPDATE, body) as any;
    }
    catch (error: unknown) {
      console.error(error, "Update Inquiry Error");
      throw error;
    }
  };

  const getInquiryHistory = async (payload: { inquiry_id: number }): Promise<any[]> => {
    try {
      const res = await http.post(API_ENDPOINTS.INQUIRIES.GET_LOGS, {
        inquiry_id: payload.inquiry_id,
      }) as any;
      if (res && res.data)
        return res.data || [];
      return [];
    }
    catch (error: unknown) {
      console.error(error, "Get Inquiry History Error");
      throw error;
    }
  };

  return {
    inquiries,
    inquiryStatuses,
    inquirySources,
    getInquiries,
    getInquiryStatuses,
    getInquirySources,
    updateInquiry,
    updateInquiryStatus,
    createInquiry,
    clearInquiriesData,
    getInquiryHistory,
  };
});
