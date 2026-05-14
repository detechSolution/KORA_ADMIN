import { defineStore } from "pinia";
import { ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

type BookingItemGroup = {
  type: string;
  label: string;
  items: Array<{
    id: number;
    amount: number;
    name: string;
    occupied?: number;
    capacity?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

type PromoValidationResponse = {
  isValid: boolean;
  code: string;
  type: "fixed" | "percent";
  amount: number;
};

export type CreateNewClientBookingPayload = {
  itemType: {
    id: number;
    name: string;
    type: string;
  };
  bookingDate: string;
  bookingTime: string | undefined;
  fullName: string;
  phoneNumber?: string;
  email: string;
  promoCode?: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentPaidAt: string;
};

export const useBookingStore = defineStore("booking", () => {
  const http = getHttp();

  const bookingItemOptions = ref<BookingItemGroup[]>([]);
  const loading = ref(false);

  const fetchBookingItemOptions = async (type?: string): Promise<void> => {
    loading.value = true;
    try {
      const res = await http.get(`${API_ENDPOINTS.BOOKINGS.ITEM_OPTIONS}?type=${type}`) as { data?: BookingItemGroup[] };
      bookingItemOptions.value = res.data ?? [];
    }
    catch (error: unknown) {
      console.error(error, "Fetch Booking Item Options Error");
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const clearBookingData = (): void => {
    bookingItemOptions.value = [];
  };

  const validatePromoCode = async (code: string): Promise<PromoValidationResponse | null> => {
    try {
      const res = await http.post<PromoValidationResponse>(API_ENDPOINTS.PROMO_CODES.VALIDATE, {
        code,
      });
      return res ?? null;
    }
    catch (error: unknown) {
      console.error(error, "Validate Promo Code Error");
      return null;
    }
  };

  const fetchSpaTimeAvailability = async (params: { bookingDate: string; duration: number; timeUnit: string }): Promise<string[]> => {
    try {
      const qs = new URLSearchParams({
        bookingDate: params.bookingDate,
        duration: params.duration.toString(),
        timeUnit: params.timeUnit,
      }).toString();
      const res = await http.get(`${API_ENDPOINTS.BOOKINGS.SPA_TIME_AVAILABILITY}?${qs}`) as { data?: string[] };
      return res.data ?? [];
    }
    catch (error: unknown) {
      console.error(error, "Fetch SPA Time Availability Error");
      return [];
    }
  };

  const createNewClientBooking = async (payload: CreateNewClientBookingPayload): Promise<any> => {
    try {
      const res = await http.post(API_ENDPOINTS.BOOKINGS.CREATE_NEW_CLIENT, payload);
      return res;
    }
    catch (error: unknown) {
      console.error(error, "Create New Client Booking Error");
      throw error;
    }
  };

  return {
    bookingItemOptions,
    loading,
    fetchBookingItemOptions,
    clearBookingData,
    validatePromoCode,
    fetchSpaTimeAvailability,
    createNewClientBooking,
  };
});
