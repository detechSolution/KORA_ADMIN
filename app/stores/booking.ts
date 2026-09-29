import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type { Booking, BookingItemGroup, CreateExistingMemberBookingPayload, CreateNewClientBookingPayload, PromoValidationResponse } from "~/types/booking";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { hasServiceNamePrefixCollision } from "~/utils/service-names";

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

  const getBookings = async (params: Record<string, any>): Promise<void> => {
    try {
      const qs = buildQueryString(params);
      const response = await http.get(`${API_ENDPOINTS.BOOKINGS.BASE}?${qs}`) as ApiResponse<Booking[]>;

      const data = await Promise.all(response.data.map(async (booking) => {
        if (!hasServiceNamePrefixCollision(booking.itemNames))
          return booking;

        try {
          const details = await http.get(API_ENDPOINTS.BOOKINGS.GET(booking.id)) as { items?: Array<{ title?: string }> };
          const itemNames = details.items?.map(item => item.title).filter((title): title is string => !!title);

          return itemNames?.length ? { ...booking, itemNames } : booking;
        }
        catch {
          return booking;
        }
      }));

      bookings.value = { ...response, data };
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

  const fetchSpaTimeAvailability = async (params: {
    bookingDate: string;
    duration: number;
    timeUnit: string;
    roomType?: "private" | "shared";
  }): Promise<any[]> => {
    try {
      const qs = new URLSearchParams({
        bookingDate: params.bookingDate,
        duration: params.duration.toString(),
        timeUnit: params.timeUnit,
      }).toString();
      const res = await http.get(`${API_ENDPOINTS.BOOKINGS.SPA_TIME_AVAILABILITY}?${qs}`) as { data?: any[] };
      const slots = res.data ?? [];

      // A shared room can be reserved privately, but a private room cannot
      // be used for a shared booking. Prefer room counts when the API sends
      // them, and keep the old capacity fallback for older responses.
      if (!params.roomType)
        return slots;

      return slots.filter((slot: any) => {
        const availablePrivateRooms = Number(slot.availablePrivateRooms);
        const availableSharedRooms = Number(slot.availableSharedRooms);

        if (!Number.isNaN(availablePrivateRooms) && !Number.isNaN(availableSharedRooms)) {
          return params.roomType === "private"
            ? availablePrivateRooms + availableSharedRooms > 0
            : availableSharedRooms > 0;
        }

        const availableCapacity = Number(slot.availableCapacity);
        return !Number.isNaN(availableCapacity) && availableCapacity > 0;
      });
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

  const fetchBookingById = async (bookingId: number): Promise<any> => {
    try {
      const res = await http.get(API_ENDPOINTS.BOOKINGS.GET(bookingId));
      return res;
    }
    catch (error: unknown) {
      console.error(error, "Fetch BookingById Error");
      throw error;
    }
  };

  const fetchBookingsSummary = async (params: Record<string, any>): Promise<any> => {
    try {
      const qs = buildQueryString(params);
      const res = await http.get(`${API_ENDPOINTS.BOOKINGS.SUMMARY}?${qs}`);
      return res;
    }
    catch (error: unknown) {
      console.error(error, "Fetch Bookings Summary Error");
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
    fetchBookingById,
    fetchBookingsSummary,
  };
});
