<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { Booking } from "~/types/booking";

import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useBookingStore } from "~/stores/booking";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "bookings.view",
});

const { error: showError } = useNotification();
const bookingStore = useBookingStore();
const { pagination } = usePagination();

const loading = ref(false);

const state = ref({
  search: "",
  status: "",
  dateRange: { start: null as string | null, end: null as string | null },
});

const statusOptions = [
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Completed", value: "COMPLETED" },
];

const columns = computed(() => [
  {
    accessorKey: "bookingCode",
    header: "Booking ID",
  },
  {
    accessorKey: "client",
    header: "Client",
  },
  {
    accessorKey: "itemName",
    header: "Session/Service",
  },
  {
    accessorKey: "itemType",
    header: "Type",
  },
  {
    accessorKey: "bookedDate",
    header: "Booked Date",
    accessorFn: (row: Booking) => formatDate(row.bookedDate),
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
]);

async function getBookings(): Promise<void> {
  try {
    loading.value = true;

    await bookingStore.getBookings();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to get bookings") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearch(): void {
  pagination.value.page = 1;
  getBookings();
}

function clearFilters(): void {
  state.value.search = "";
  state.value.status = "";
  state.value.dateRange = { start: null, end: null };
  pagination.value.page = 1;
  getBookings();
}

function hasActiveFilters(): boolean {
  return !!(
    state.value.search
    || state.value.status
    || state.value.dateRange.start
    || state.value.dateRange.end
  );
}

onMounted(() => {
  getBookings();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Bookings
      </template>
      <template #description>
        View bookings, their status, and booking details
      </template>

      <template #actions>
        <NuxtLink to="/bookings/create-booking">
          <base-button
            :leading-icon="ICONS.PLUS"
          >
            Manual Booking
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4 page-content-height">
      <h2 class="text-base font-semibold">
        Bookings List
      </h2>
      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
          <base-input
            v-model="state.search"
            name="search"
            placeholder="Search"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />

          <base-date-picker
            v-model="state.dateRange"
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <base-select
            v-model="state.status"
            name="status"
            placeholder="All statuses"
            :options="statusOptions"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              v-if="hasActiveFilters()"
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="clearFilters"
            >
              Clear Filters
            </base-button>
            <base-button
              :loading="loading"
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              @click="handleSearch"
            >
              Search
            </base-button>
          </div>
        </div>

        <base-button
          variant="ghost"
          :leading-icon="ICONS.DOWNLOAD"
        >
          Export
        </base-button>
      </div>
      <base-table
        :data="bookingStore.bookings.data"
        :columns="columns"
        :loading="loading"
        empty-title="No bookings found"
        empty-description="Bookings will appear here once created."
      >
        <template #bookingCode-cell="{ row }">
          <base-badge>
            {{ row.original.bookingCode }}
          </base-badge>
        </template>

        <template #client-cell="{ row }">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-secondary">
              {{ row.original.clientName || "-" }}
            </span>
            <span class="text-xs text-secondary-400">
              {{ row.original.clientEmail || "-" }}
            </span>
          </div>
        </template>

        <template #itemType-cell="{ row }">
          <base-badge :color="getStatusColor(row.original.itemType)">
            {{ getStatusLabel(row.original.itemType) }}
          </base-badge>
        </template>

        <template #status-cell="{ row }">
          <base-badge :color="getStatusColor(row.original.status)">
            {{ getStatusLabel(row.original.status) }}
          </base-badge>
        </template>

        <template #actions-cell="{ row }">
          <base-dropdown-menu
            :items="[
              {
                label: 'Request Cancellation',
                icon: ICONS.EYE,
                action: () => navigateTo(`/booking/${row.original.id}`),
              },
              {
                label: 'View Details',
                icon: ICONS.EYE,
                action: () => navigateTo(`/booking/${row.original.id}`),
              },
            ]"
          />
        </template>
      </base-table>
      <base-pagination
        :page="pagination.page"
        :total="Number(bookingStore.bookings.meta.total)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; getBookings(); }"
      />
    </div>
  </div>
</template>
