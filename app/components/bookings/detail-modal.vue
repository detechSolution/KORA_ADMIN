<script setup lang="ts">
import { ref, watch } from "vue";

import type { Booking } from "~/types/booking";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useBookingStore } from "~/stores/booking";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  booking?: Booking | null;
  loading?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  booking: null,
  loading: false,
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm"): void;
}>();

const { error: showError } = useNotification();
const bookingDetails = ref<any>(null);
const loading = ref(props.loading);
const bookingStore = useBookingStore();

async function fetchBookingDetails() {
  const id = props.booking?.id;
  if (!id)
    return;

  try {
    loading.value = true;
    bookingDetails.value = await bookingStore.fetchBookingById(id);
  }
  catch (error) {
    showError({
      message: getApiErrorMessage(error, "Failed to load booking details"),
    });
  }
  finally {
    loading.value = false;
  }
}

watch(() => props.open, async (newValue) => {
  if (newValue) {
    await fetchBookingDetails();
  }
});
</script>

<template>
  <base-modal
    :open="open"
    :title="`Booking ${booking?.bookingCode}`"
    description=""
    :modal-width="800"
    dismissible
    @close="emit('close')"
  >
    <div class="flex flex-col gap-10 p-6 overflow-y-auto max-h-[80vh] text-sm">
      <div class="grid grid-cols-2 gap-8">
        <!-- Customer Section -->

        <div class="flex flex-col gap-1">
          <span class="text-xs text-secondary-400 mb-1">Booking ID</span>
          <span class="font-medium text-secondary-900">{{ booking?.bookingCode }}</span>
        </div>

        <!-- Details Section -->
        <div class="flex flex-col gap-1">
          <span class="text-xs text-secondary-400 mb-1">Status</span>

          <div class="flex items-center gap-2 mt-1">
            <base-badge :status="booking?.status" :show-icon="true">
              {{ normalizeText(booking?.status) }}
            </base-badge>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-secondary-400 mb-1">Booked By</span>
          <div class="flex flex-col gap-1">
            <span class="font-medium text-secondary-900">{{ booking?.clientName }}</span>
            <span class="text-xs text-secondary-400">{{ booking?.clientPhoneNumber }}</span>
            <span class="text-xs text-secondary-400">{{ booking?.clientEmail }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-xs text-secondary-400 mb-1">Booked Date</span>
          <span class="font-medium text-secondary-900">{{ formatDate(booking?.bookedDate) }}</span>
          <span class="text-xs text-secondary-400 mb-1">{{ formatTime(booking?.bookedDate) }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h3 class="font-medium text-secondary-500">
          PARTICIPANTS & BOOKINGS
        </h3>

        <div v-for="participant in bookingDetails?.participants" :key="participant.id">
          <div class="border border-border rounded-xl grid md:grid-cols-13 grid-cols-1 p-3">
            <div class="flex flex-col gap-1 p-2 border-b md:border-b-0 md:border-r border-border col-span-4">
              <div class="flex gap-2 items-center">
                <h2 class="text-secondary font-semibold text-sm">
                  {{ participant?.fullName }}
                </h2>

                <base-badge v-if="participant?.type === 'guest'" :status="participant?.type">
                  {{ normalizeText(participant?.type) }}
                </base-badge>
              </div>

              <div class="text-secondary-500 text-xs flex flex-col">
                <p class="flex items-center gap-2">
                  <UIcon :name="ICONS.PHONE" />  {{ participant?.phoneNumber }}
                </p>
                <p class="flex items-center gap-2">
                  <UIcon :name="ICONS.MAIL" /> {{ participant?.email }}
                </p>
              </div>
            </div>
            <div class="flex flex-col uppercase text-sm font-semibold border-b md:border-b-0  md:border-r border-border p-2 col-span-4">
              <h2>{{ booking?.itemName }}</h2>
            </div>
            <div class="flex text-sm text-secondary-700 flex-col border-b  md:border-r border-border md:border-b-0 p-2 col-span-3">
              <div class="flex items-center gap-2">
                <UIcon :name="ICONS.CALENDAR" /> <h2>{{ formatDate(participant?.bookedFor) || "N/A" }}</h2>
              </div>
              <div class="flex items-center gap-2">
                <UIcon :name="ICONS.CLOCK" /> <h2>{{ formatTime(participant?.bookedFor) || "N/A" }}</h2>
              </div>
              <div v-if="participant?.instructor?.fullName">
                <UIcon :name="ICONS.USER" />
                <p>{{ participant?.instructor?.fullName }}</p>
              </div>
            </div>
            <div class="flex flex-col p-2 col-span-2">
              <p class="flex self-end text-sm font-semibold">
                {{ participant?.currency }} {{ participant?.amount }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </base-modal>
</template>

<style scoped></style>
