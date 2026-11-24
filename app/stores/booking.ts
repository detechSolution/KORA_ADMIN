import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type { Booking, BookingDetails, BookingItemGroup, CreateExistingMemberBookingPayload, CreateManualBookingPayload, CreateNewClientBookingPayload, PromoValidationResponse } from "~/types/booking";

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

  const getBookings = async (params: Record<string, any>): Promise<void> => {
    try {
      const qs = buildQueryString(params);
      const response = await http.get(`${API_ENDPOINTS.BOOKINGS.BASE}?${qs}`) as ApiResponse<Booking[]>;

      bookings.value = response;
    }
    catch (error: unknown) {
      console.error("Error fetching bookings:", error);
      throw error;
    }
  };

  const getRecentDashboardBookings = async (params: Record<string, any>): Promise<void> => {
    try {
      const qs = buildQueryString(params);
      const response = await http.get(
        `${API_ENDPOINTS.BOOKINGS.DASHBOARD_RECENT}?${qs}`,
      ) as ApiResponse<Booking[]>;
      bookings.value = response;
    }
    catch (error: unknown) {
      console.error("Error fetching dashboard bookings:", error);
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

  const createManualBooking = async (payload: CreateManualBookingPayload): Promise<any> => {
    try {
      const res = await http.post(API_ENDPOINTS.BOOKINGS.MANUAL, payload);
      return res;
    }
    catch (error: unknown) {
      console.error(error, "Create Manual Booking Error");
      throw error;
    }
  };

  const createExistingMemberBooking = (payload: CreateExistingMemberBookingPayload): Promise<any> =>
    createManualBooking({
      client: { kind: "existing", memberId: payload.selectedMemberId },
      item: payload.item,
      bookingDate: payload.bookingDate,
      bookingTime: payload.bookingTime,
      roomType: payload.roomType,
      promoCode: payload.promoCode,
      paymentMethod: payload.paymentMethod,
    });

  const createNewClientBooking = (payload: CreateNewClientBookingPayload): Promise<any> =>
    createManualBooking({
      client: {
        kind: "new",
        fullName: payload.fullName,
        email: payload.email,
        ...(payload.phoneNumber ? { phoneNumber: payload.phoneNumber } : {}),
      },
      item: payload.itemType,
      bookingDate: payload.bookingDate,
      bookingTime: payload.bookingTime,
      roomType: payload.roomType,
      promoCode: payload.promoCode,
      paymentMethod: payload.paymentMethod,
    });

  const cancelBookingLine = async (bookingId: number, lineId: number, body: { quantity: number; requestId: string }): Promise<void> => {
    await http.patch(`${API_ENDPOINTS.BOOKINGS.BASE}/${bookingId}/lines/${lineId}/request-cancellation`, body);
  };

  const fetchBookingById = async (bookingId: number): Promise<BookingDetails> => {
    try {
      const res = await http.get<BookingDetails>(API_ENDPOINTS.BOOKINGS.GET(bookingId));
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
    getRecentDashboardBookings,
    getBookingOptions,
    fetchBookingItemOptions,
    clearBookingData,
    validatePromoCode,
    fetchSpaTimeAvailability,
    createManualBooking,
    createExistingMemberBooking,
    createNewClientBooking,
    cancelBookingLine,
    fetchBookingById,
    fetchBookingsSummary,
  };
});
