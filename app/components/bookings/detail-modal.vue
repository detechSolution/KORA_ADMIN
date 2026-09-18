<script setup lang="ts">
import { ref, watch } from "vue";

import type { Booking } from "~/types/booking";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useBookingStore } from "~/stores/booking";
import { getApiErrorMessage } from "~/utils/error";

import CancelModal from "./cancel-modal.vue";

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

const { error: showError, success } = useNotification();
const bookingDetails = ref<any>(null);
const loading = ref(props.loading);
const bookingStore = useBookingStore();
const isCancelModalOpen = ref(false);
const selectedBookingItemId = ref<number | null>(null);
const isCancelling = ref(false);

function openCancelModal(id: number) {
  selectedBookingItemId.value = id;
  isCancelModalOpen.value = true;
}

async function handleCancelBooking() {
  if (!selectedBookingItemId.value)
    return;

  try {
    isCancelling.value = true;
    await bookingStore.requestBookingCancellation(selectedBookingItemId.value);
    success({ message: "Booking cancelled successfully" });
    isCancelModalOpen.value = false;
    selectedBookingItemId.value = null;
    await fetchBookingDetails();
    emit("confirm");
  }
  catch (error) {
    showError({
      message: getApiErrorMessage(error, "Failed to cancel booking"),
    });
  }
  finally {
    isCancelling.value = false;
  }
}

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
        <!-- <div class="flex flex-col gap-1">
          <span class="text-xs text-secondary-400 mb-1">Status</span>

          <div class="flex items-center gap-2 mt-1">
            <base-badge :status="booking?.status" :show-icon="true">
              {{ normalizeText(booking?.status) }}
            </base-badge>
          </div>
        </div> -->
        <div class="flex flex-col gap-1">
          <span class="text-xs text-secondary-400 mb-1">Booked By</span>
          <div class="font-medium text-secondary-900 flex flex-col gap-1">
            <span class="capitalize">{{ bookingDetails?.booker?.fullName }}</span>
            <span>{{ booking?.clientPhoneNumber }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-xs text-secondary-400 mb-1">Booked Date</span>
          <div class="font-medium text-secondary-900 flex flex-col gap-1">
            <span>{{ formatDate(booking?.bookedDate) }}</span>
            <span>{{ formatLocalTime(booking?.bookedDate) }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h3 class="font-medium">
          PARTICIPANTS & BOOKINGS
        </h3>

        <div v-for="bookings in (bookingDetails?.items ?? [])" :key="bookings.id">
          <div class="border border-border rounded-xl gap-2 md:gap-0 grid md:grid-cols-[2fr_2fr_1fr_auto] grid-cols-1 p-3">
            <div class="flex flex-col  border-b md:border-b-0  md:border-r border-border p-2 ">
              <span class="text-xs text-secondary-400 mb-1">Session/Service Name</span>
              <h2 class="text-sm font-semibold">
                {{ bookings?.title }}
              </h2>
            </div>
            <div class="flex text-xs flex-col border-b  md:border-r border-border md:border-b-0 p-2 col-span-1">
              <span class="text-xs text-secondary-400 mb-1">
                {{ `Date ${bookings?.itemType !== "passes" ? " & Time" : ""}` }}</span>
              <div class="text-xs font-semibold">
                <div class="flex items-center gap-2">
                  <UIcon :name="ICONS.CALENDAR" /> <h2>{{ formatDate(bookings?.scheduledAt) || "N/A" }}</h2>
                </div>
                <div v-if="bookings?.itemType !== 'passes'" class="flex items-center gap-2">
                  <UIcon :name="ICONS.CLOCK" /> <h2>{{ formatLocalTime(bookings?.scheduledAt) || "N/A" }}</h2>
                </div>
              </div>
            </div>
            <div class="flex flex-col p-2">
              <span class="text-xs text-secondary-400 mb-1">Price</span>

              <p class="flex self-start text-sm font-semibold">
                {{ bookings?.currency }} {{ bookings?.unitAmount }}
              </p>
            </div>
            <div class="flex  gap-2 items-start justify-end p-2">
              <UDropdownMenu :items="[[{ label: 'Cancel Booking', class: 'cursor-pointer text-red-500', disabled: ['cancelled', 'cancellation_processing'].includes(booking?.status ?? ''), onSelect: () => openCancelModal(bookings.id) }]]">
                <div class="flex items-center gap-2 mt-1">
                  <base-badge :status="booking?.status">
                    {{ normalizeText(booking?.status) }}
                  </base-badge>
                </div>
                <UButton
                  icon="i-lucide-ellipsis-vertical"
                  color="neutral"
                  variant="outline"
                  @click.stop
                />
              </UDropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  </base-modal>

  <Teleport to="body">
    <CancelModal
      :open="isCancelModalOpen"
      :loading="isCancelling"
      @close="isCancelModalOpen = false; selectedBookingItemId.value = null"
      @confirm="handleCancelBooking"
    />
  </Teleport>
</template>

<style scoped></style>
