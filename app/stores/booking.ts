import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type { Booking } from "~/types/booking";

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

  return {
    bookings,
    getBookings,
  };
});
