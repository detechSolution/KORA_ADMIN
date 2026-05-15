<script setup lang="ts">
import { computed, ref } from "vue";

import type { Booking } from "~/types/booking";

import { ICONS } from "~/config/icons";
import { formatDate } from "~/utils/common";
import { getStatusMeta } from "~/utils/helpers";

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

const guests = computed(() => {
  return (props.booking as any)?.visitors || [];
});

const filteredGuests = computed(() => {
  if (!searchQuery.value)
    return guests.value;
  return guests.value.filter((g: any) =>
    g.fullName?.toLowerCase().includes(searchQuery.value.toLowerCase())
    || g.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
    || g.phoneNumber?.includes(searchQuery.value),
  );
});

const bookingInfo = computed(() => {
  if (!props.booking)
    return [];

  return [
    { label: "Booking Id", value: props.booking?.bookingCode as string, icon: ICONS.ID_CARD },
    { label: "Booked Date", value: formatDate(props.booking?.bookedDate) as string, icon: ICONS.CALENDAR },
    { label: "Session/Service", value: props.booking?.itemName as string, icon: ICONS.BRIEFCASE },
  ];
});

function getInitials(name?: string) {
  if (!name)
    return "??";
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2);
}

function getStatusIndicatorColor(status?: string) {
  const config = getStatusMeta(status);
  switch (config.badgeColor) {
    case "emerald":
    case "success":
      return "bg-emerald-500";
    case "amber":
    case "orange":
      return "bg-amber-500";
    case "red":
      return "bg-red-500";
    case "blue":
    case "indigo":
    case "sky":
      return "bg-blue-500";
    default:
      return "bg-secondary-400";
  }
}
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
              <div class="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center text-secondary-600 font-semibold text-sm">
                {{ getInitials(booking?.clientName) }}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-base font-semibold text-secondary-900">{{ booking?.clientName }}</span>
                <base-badge color="blue" class="text-[10px] px-1.5 py-0.5 rounded-md">
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
              <div class="w-2 h-2 rounded-full" :class="getStatusIndicatorColor(booking?.status)" />
              <span class="text-base  text-secondary-900">{{ getStatusLabel(booking?.status) }}</span>
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
              <base-badge color="amber" class="w-fit text-[11px] font-semibold">
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
              label="Search"
              placeholder="Search guest name"
              class="w-full max-w-xs"
              :leading-icon="ICONS.SEARCH"
            />
            <base-button variant="outline" :leading-icon="ICONS.SEARCH">
              Search
            </base-button>
          </div>
        </div>

        <base-table
          :columns="guestColumns"
          :data="filteredGuests"
          empty-title="No guests found"
          empty-description="This booking doesn't have any guests listed."
          class="border border-secondary-100 rounded-lg overflow-hidden"
        >
          <template #fullName-cell="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-secondary-50 flex items-center justify-center text-secondary-600 font-semibold text-xs">
                {{ getInitials(row.original.fullName) }}
              </div>
              <span class="text-sm font-medium text-secondary-900">{{ row.original.fullName }}</span>
            </div>
          </template>

          <template #email-cell="{ row }">
            <span class="text-sm text-secondary-600">{{ row.original.email || "-" }}</span>
          </template>

          <template #phoneNumber-cell="{ row }">
            <span class="text-sm text-secondary-600">{{ row.original.phoneNumber || "-" }}</span>
          </template>
        </base-table>

        <div v-if="filteredGuests.length > 0" class="flex items-center justify-between">
          <span class="text-sm text-secondary-500">
            Showing 1-{{ Math.min(10, filteredGuests.length) }} of {{ filteredGuests.length }} entries
          </span>
          <base-pagination
            :page="1"
            :total="filteredGuests.length"
            :items-per-page="10"
          />
        </div>
      </div>
    </base-tabs>
  </base-modal>
</template>

<style scoped>

</style>
