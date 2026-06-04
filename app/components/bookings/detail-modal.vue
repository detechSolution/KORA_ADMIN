<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { Booking } from "~/types/booking";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
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

const selectedTab = ref("details");

const { error: showError } = useNotification();
const bookingDetails = ref<any>(null);
const bookingStore = useBookingStore();

const items = [
  { label: "Details", value: "details" },
  { label: "Guest Info", value: "guest_info" },
];

const guestColumns = [
  { accessorKey: "fullName", header: "Client" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phoneNumber", header: "Phone" },
];

const searchQuery = ref("");

const bookingInfo = computed(() => {
  if (!props.booking)
    return [];

  return [
    { label: "Booking Id", value: props.booking?.bookingCode as string, icon: ICONS.ID_CARD },
    { label: "Booked Date & Time", value: formatDateTimeWithDot(props.booking?.bookedFor as string) as string, icon: ICONS.CALENDAR },
    { label: "Session/Service", value: props.booking?.itemName as string, icon: ICONS.BRIEFCASE },
  ];
});

const filteredGuests = computed(() => {
  if (!searchQuery.value)
    return bookingDetails.value?.guests;
  return bookingDetails.value?.guests.filter((g: any) =>
    g.fullName?.toLowerCase().includes(searchQuery.value.toLowerCase())
    || g.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
    || g.phoneNumber?.includes(searchQuery.value),
  );
});

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
    <base-tabs
      v-model="selectedTab"
      :items="items"
      variant="solid"
      class="p-6"
      color="secondary"
    >
      <div v-if="selectedTab === 'details'" class="flex flex-col gap-8 pt-4">
        <!-- Top Section -->
        <div class="grid grid-cols-2 justify-end gap-x-8 gap-y-6">
          <!-- Client Name -->
          <div class="flex flex-col gap-2">
            <span class="text-xs  text-secondary-400 tracking-wider">Client Name</span>
            <div class="flex items-center gap-3">
              <base-avatar
                :src="booking?.clientName"
                :alt="booking?.clientName || 'Unknown'"
                size="sm"
              />
              <div class="flex items-center gap-2">
                <span class="text-base font-semibold text-secondary-900">{{ booking?.clientName }}</span>
                <base-badge color="blue" class="text-[10px]">
                  Member
                </base-badge>
              </div>
            </div>
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-2">
            <span class="text-xs text-secondary-400 tracking-wider">Email</span>
            <span class="text-base text-secondary-900">{{ booking?.clientEmail || "-" }}</span>
          </div>

          <!-- Phone -->
          <div class="flex flex-col gap-2">
            <span class="text-xs text-secondary-400 tracking-wider">Phone</span>
            <span class="text-base text-secondary-900">{{ booking?.clientPhoneNumber || "-" }}</span>
          </div>

          <!-- Status -->
          <div class="flex flex-col gap-2">
            <span class="text-xs  text-secondary-400 tracking-wider">Status</span>
            <div class="flex items-center gap-2">
              <UChip
                :color="booking?.status === 'confirmed'
                  ? 'success'
                  : booking?.status === 'cancellation_processing'
                    ? 'warning'
                    : booking?.status === 'cancelled'
                      ? 'error'
                      : 'neutral'
                "
              />
              <span class="text-base capitalize text-secondary-900">{{ booking?.status }}</span>
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Bottom Cards Section -->
        <div class="flex sm:flex-row flex-col justify-between gap-4">
          <div
            v-for="detail in bookingInfo"
            :key="detail.label"
            class="flex flex-col w-full gap-2 p-3 border border-stone-200 bg-stone-50 rounded-md"
          >
            <div class="text-secondary-400 text-xs flex gap-2 items-center">
              <UIcon :name="detail.icon" class="w-4 h-4" />
              <span>{{ detail.label }}</span>
            </div>
            <span v-if="detail.label === 'Booking Id'" class="text-sm font-medium text-secondary-700">
              <base-badge uppercase color="amber">
                {{ booking?.bookingCode }}
              </base-badge>
            </span>
            <span v-else class="text-sm font-medium text-secondary-700">{{ detail.value }}</span>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col gap-6 pt-4">
        <div class="flex flex-col gap-4">
          <h3 class="text-base font-semibold text-secondary-900">
            Guests List
          </h3>
          <div class="flex gap-2">
            <base-input
              v-model="searchQuery"
              name="search"
              placeholder="Search guest name"
              class="w-full max-w-xs"
              :leading-icon="ICONS.SEARCH"
            />
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="searchQuery = ''"
            >
              Clear Filters
            </base-button>
          </div>
        </div>

        <base-table
          :columns="guestColumns"
          :data="filteredGuests"
          empty-title="No guests found"
        >
          <template #fullName-cell="{ row }">
            <div class="flex items-center gap-3">
              <base-avatar
                :src="row.original.clientName"
                :alt="row.original.clientName || 'Unknown'"
                size="sm"
              />
              <span class="text-sm font-medium text-secondary-900">{{ row.original.clientName }}</span>
            </div>
          </template>
        </base-table>
      </div>
    </base-tabs>
  </base-modal>
</template>

<style scoped></style>
