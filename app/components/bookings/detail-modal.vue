<script setup lang="ts">
import { ref, watch } from "vue";

import type { Booking } from "~/types/booking";

import { useNotification } from "~/composables/use-notification";
import { useBookingStore } from "~/stores/booking";
import { formatDateTimeWithDot } from "~/utils/common";
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
const bookingStore = useBookingStore();

const guestColumns = [
  { accessorKey: "fullName", header: "Client" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "itemName", header: "Service Name" },
  { accessorKey: "phoneNumber", header: "Phone" },
];

async function fetchBookingDetails() {
  const id = props.booking?.id;
  if (!id)
    return;

  try {
    bookingDetails.value = await bookingStore.fetchBookingById(id);
  }
  catch (error) {
    showError({
      message: getApiErrorMessage(error, "Failed to load booking details"),
    });
  }
}

function statusColor(status) {
  const warning = ["cancellation_processing", "pending_payment", "pending"];
  const error = ["cancelled"];

  if (status === "confirmed")
    return "success";
  if (warning.includes(status))
    return "warning";
  if (error.includes(status))
    return "error";
  return "neutral";
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
    title="Booking Details"
    description=""
    :modal-width="800"
    dismissible
    @close="emit('close')"
  >
    <div class="flex flex-col gap-10 p-6 overflow-y-auto max-h-[80vh] text-sm">
      <div class="grid grid-cols-2 gap-8">
        <!-- Customer Section -->
        <div class="flex flex-col gap-1">
          <span class="text-xs text-secondary-400 mb-1">Customer</span>
          <span class="font-medium text-secondary-900">{{ booking?.clientName }}</span>
          <span class="text-secondary-600">{{ booking?.clientPhoneNumber || "-" }}</span>
          <span class="text-secondary-600">{{ booking?.clientEmail || "-" }}</span>
        </div>

        <!-- Details Section -->
        <div class="flex flex-col gap-1">
          <span class="text-xs text-secondary-400 mb-1">Booking Details</span>
          <span class="font-medium text-secondary-900">{{ booking?.bookingCode }}</span>
          <span class="text-secondary-600">{{ booking?.itemName }}</span>
          <span class="text-secondary-600">{{ formatDateTimeWithDot(booking?.bookedFor as string) }}</span>
          <div class="flex items-center gap-2 mt-1">
            <UChip :color="statusColor(booking?.status)" />
            <span class="capitalize text-secondary-900">{{ normalizeText(booking?.status) }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h3 class="font-medium text-secondary-900">
          Guest Bookings
        </h3>

        <base-table
          :columns="guestColumns"
          :data="bookingDetails?.guests || []"
          empty-title="No guests found"
        >
          <template #fullName-cell="{ row }">
            <div class="flex items-center gap-3">
              <base-avatar
                :src="row.original.fullName"
                :alt="row.original.fullName || 'Unknown'"
                size="sm"
              />
              <div class="flex flex-col">
                <span class="font-medium text-secondary-900">{{ row.original.fullName }}</span>
                <span class="text-xs text-secondary-400">{{ row.original.phoneNumber }}</span>
              </div>
            </div>
          </template>
        </base-table>
      </div>
    </div>
  </base-modal>
</template>

<style scoped></style>
