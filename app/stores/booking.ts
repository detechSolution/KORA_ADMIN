import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type { Booking, BookingItemGroup, CreateExistingMemberBookingPayload, CreateNewClientBookingPayload, PromoValidationResponse } from "~/types/booking";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useBookingStore = defineStore("booking", () => {
  const http = getHttp();

  const bookings = ref<ApiResponse<Booking[]>>({
    data: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
    },
  });
  const bookingOptions = ref<any>(null);
  const bookingItemOptions = ref<BookingItemGroup[]>([]);
  const loading = ref(false);

  const getBookings = async (): Promise<void> => {
    try {
      const response = await http.get(API_ENDPOINTS.BOOKINGS.BASE) as any;
      bookings.value = response;
    }
    catch (error: unknown) {
      console.error("Error fetching bookings:", error);
      throw error;
    }
  };

  const getBookingOptions = async (): Promise<void> => {
    try {
      const response = await http.get(API_ENDPOINTS.BOOKINGS.OPTIONS) as any;
      bookingOptions.value = response;
    }
    catch (error: unknown) {
      console.error("Error fetching booking options:", error);
      throw error;
    }
  };

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

  const createExistingMemberBooking = async (payload: CreateExistingMemberBookingPayload): Promise<any> => {
    try {
      const res = await http.post(API_ENDPOINTS.BOOKINGS.MANUAL, payload);
      return res;
    }
    catch (error: unknown) {
      console.error(error, "Create Existing Member Booking Error");
      throw error;
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

  const requestBookingCancellation = async (bookingId: number): Promise<void> => {
    try {
      await http.patch(API_ENDPOINTS.BOOKINGS.REQUEST_CANCELLATION(bookingId));
    }
    catch (error: unknown) {
      console.error(error, "Request Booking Cancellation Error");
      throw error;
    }
  };

  return {
    loading,
    bookings,
    bookingOptions,
    bookingItemOptions,
    getBookings,
    getBookingOptions,
    fetchBookingItemOptions,
    clearBookingData,
    validatePromoCode,
    fetchSpaTimeAvailability,
    createNewClientBooking,
    createExistingMemberBooking,
    requestBookingCancellation,
  };
});
