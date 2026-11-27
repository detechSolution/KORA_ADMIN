<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { Booking } from "~/types/booking";

import { getHttp } from "~/composables/use-api";
import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_BOOKINGS } from "~/config/permissions";
import { useAnalyticsStore } from "~/stores/analytics";
import { useBookingStore } from "~/stores/booking";
import { bookingCreatedDateLabel, bookingTypeLabels } from "~/utils/booking-lines";
import { buildQueryString } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";
import { downloadCsv } from "~/utils/report-csv";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "bookings.view",
});

const bookingTypeOptions = [
  { label: "Session", value: "session" },
  { label: "Spa", value: "spa" },
  { label: "Pass", value: "passes" },
];

const bookingStatusOptions = [
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Partly Cancelled", value: "partly_cancelled" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
];

const { error: showError } = useNotification();
const analyticsStore = useAnalyticsStore();
const bookingStore = useBookingStore();
const bookings = computed(() => bookingStore.bookings);
const { pagination } = usePagination();
const { can } = usePermission();
const loading = ref(false);
const loadingSummary = ref(false);
const exporting = ref(false);
const appliedFilters = ref<Record<string, string | number | boolean | null | undefined>>({});
async function exportBookings() {
  exporting.value = true;
  try {
    const file = await getHttp().get<{ filename: string; csv: string }>(`/api/v1/bookings/export?${buildQueryString(appliedFilters.value)}`);
    downloadCsv(file);
  }
  catch (error: unknown) { showError({ message: getApiErrorMessage(error, "Failed to export bookings") }); }
  finally { exporting.value = false; }
}

const isDetailModalOpen = ref(false);

const selectedBooking = ref<Booking | null>(null);
const summary = ref<any>(null);

const filters = ref({
  search: "",
  status: "confirmed",
  type: "",
  dateRange: {
    start: null as string | null,
    end: null as string | null,
  },
});

const columns = computed(() => [
  { accessorKey: "bookingCode", header: "Booking ID" },
  { accessorKey: "client", header: "Client" },
  {
    accessorKey: "itemType",
    header: "Booking Type",
    accessorFn: (row: Booking) => bookingTypeLabels(row).join(", ") || "N/A",
  },
  {
    accessorKey: "bookedDate",
    header: "Booked Date",
    accessorFn: (row: Booking) => bookingCreatedDateLabel(row),
  },
  {
    accessorKey: "amount",
    header: "Total (NPR)",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  // { accessorKey: "status", header: "Status" },
  { accessorKey: "actions", header: "Actions" },
]);

const hasActiveFilters = computed(() => {
  return (
    filters.value.search
    || filters.value.dateRange.start
    || filters.value.dateRange.end
    || filters.value.status !== ""
    || filters.value.type !== ""
  );
});

async function fetchBookings(): Promise<void> {
  try {
    loading.value = true;
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: filters.value.search || undefined,
      type: filters.value.type === "" ? undefined : filters.value.type,
      status: filters.value.status === "" ? undefined : filters.value.status,
      bookedFrom: filters.value.dateRange.start || undefined,
      bookedTo: filters.value.dateRange.end || undefined,
      is_read: true,
    };
    await bookingStore.getBookings(params);
    appliedFilters.value = params;
  }
  catch (err: unknown) {
    showError({
      message: getApiErrorMessage(err, "Failed to get bookings"),
    });
  }
  finally {
    loading.value = false;
  }
}

async function fetchBookingsSummary(): Promise<void> {
  try {
    loadingSummary.value = true;
    const params = {
      bookedFrom: filters.value.dateRange.start || undefined,
      bookedTo: filters.value.dateRange.end || undefined,
      type: filters.value.type || undefined,
      status: filters.value.status || undefined,
      q: filters.value.search || undefined,
    };
    const res = await bookingStore.fetchBookingsSummary(params);
    summary.value = res;
  }
  catch (err: unknown) {
    showError({
      message: getApiErrorMessage(err, "Failed to get bookings summary"),
    });
  }
  finally {
    loadingSummary.value = false;
  }
}

function handleSearch(): void {
  pagination.value.page = 1;
  fetchBookings();

  fetchBookingsSummary();
}

function clearFilters(): void {
  filters.value = {
    search: "",
    type: "",
    status: "",
    dateRange: { start: null, end: null },
  };

  pagination.value.page = 1;
  fetchBookings();
  fetchBookingsSummary();
}

function openViewModal(booking: any): void {
  selectedBooking.value = booking;
  isDetailModalOpen.value = true;
}

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const search = route.query.search as string;
  const date = typeof route.query.date === "string" ? route.query.date : null;
  filters.value.search = search || "";
  filters.value.dateRange = { start: date, end: date };

  await Promise.all([
    fetchBookings(),
    fetchBookingsSummary(),
    analyticsStore.getAnalyticsStats(),
  ]);

  router.replace({ query: { search: undefined } });
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
        <NuxtLink
          v-if="can(PERMISSIONS_BOOKINGS.CREATE)"
          to="/bookings/create-booking"
        >
          <base-button :leading-icon="ICONS.PLUS">
            Manual Booking
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <dl
      class="grid grid-cols-2 lg:grid-cols-4 gap-4"
      aria-label="Booking totals"
      :aria-busy="loadingSummary"
    >
      <div
        v-for="item in [
          { label: 'All bookings', value: summary?.allBookings ?? 0 },
          { label: 'Sessions', value: summary?.sessions ?? 0 },
          { label: 'Spa', value: summary?.spa ?? 0 },
          { label: 'Passes', value: summary?.passes ?? 0 },
        ]"
        :key="item.label"
        class="rounded-xl border border-border bg-white p-5"
      >
        <dt class="text-sm text-secondary-500">
          {{ item.label }}
        </dt>
        <dd class="mt-2 text-2xl font-semibold text-secondary tabular-nums">
          {{ loadingSummary ? '—' : item.value }}
        </dd>
      </div>
    </dl>

    <div
      class="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4 page-content-height"
    >
      <div class="flex flex-col 2xl:flex-row 2xl:items-end gap-3">
        <div
          class="min-w-0 flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3"
        >
          <base-input
            v-model="filters.search"
            name="search"
            label="Search"
            placeholder="Client, booking ID or service"
            class="w-full sm:w-64 sm:flex-none"
            :leading-icon="ICONS.SEARCH"
            @keyup.enter="handleSearch"
          />

          <base-date-picker
            v-model="filters.dateRange"
            name="dateRange"
            label="Booked date range"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-72 sm:flex-none"
          />

          <base-select
            v-model="filters.type"
            :options="bookingTypeOptions"
            name="bookingType"
            label="Booking type"
            placeholder="Select booking type"
            class="w-full sm:w-44 sm:flex-none"
          />

          <base-select
            v-model="filters.status"
            :options="bookingStatusOptions"
            name="bookingStatus"
            label="Booking status"
            placeholder="Select booking status"
            class="w-full sm:w-44 sm:flex-none"
          />

          <div class="flex flex-wrap gap-2 w-full sm:w-auto">
            <base-button
              :loading="loading"
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              @click="handleSearch"
            >
              Search
            </base-button>
            <base-button
              v-if="hasActiveFilters"
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="clearFilters"
            >
              Clear Filters
            </base-button>
          </div>
        </div>

        <base-button
          variant="outline"
          class="w-full sm:w-auto self-start shrink-0 2xl:self-end"
          :leading-icon="ICONS.DOWNLOAD"
          :loading="exporting"
          :disabled="loading"
          @click="exportBookings"
        >
          Export CSV
        </base-button>
      </div>
      <base-table
        :data="bookingStore.bookings.data"
        :columns="columns"
        :loading="loading"
        empty-title="No bookings found"
      >
        <template #bookingCode-cell="{ row }">
          <base-badge uppercase>
            {{ row.original.bookingCode }}
          </base-badge>
        </template>

        <template #client-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-avatar
              :src="row.original.participants?.[0]?.name || ''"
              :alt="row.original.participants?.[0]?.name || 'Unknown'"
              size="sm"
            />
            <div class="flex flex-col gap-1">
              <div class="flex flex-row gap-2 items-center">
                <span class="text-sm font-medium text-secondary">
                  {{ row.original.participants?.[0]?.name || "-" }}
                </span>

                <UTooltip
                  v-if="row.original.participants?.length > 1"
                  :delay-duration="0"
                  arrow
                  :text="`${row.original.participants?.length - 1} Guests`"
                >
                  <span
                    class="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-red-300 bg-red-50 px-1.5 text-xs font-medium leading-none text-red-500"
                  >
                    +{{ row.original.participants?.length - 1 }}
                  </span>
                </UTooltip>
              </div>
              <span class="text-xs text-secondary-400">
                {{ row.original.participants?.[0]?.email || "N/A" }}
              </span>
            </div>
          </div>
        </template>

        <template #itemType-cell="{ row }">
          <div class="flex flex-wrap gap-1.5">
            <base-badge
              v-for="type in bookingTypeLabels(row.original)"
              :key="type"
              :status="type.toLowerCase() === 'pass' ? 'passes' : type.toLowerCase()"
            >
              {{ type }}
            </base-badge>
            <span v-if="!row.original.lines?.length" class="text-sm text-secondary-400">N/A</span>
          </div>
        </template>

        <template #bookedDate-cell="{ row }">
          <span class="text-sm">{{ bookingCreatedDateLabel(row.original) }}</span>
        </template>

        <template #status-cell="{ row }">
          <base-badge :status="row.original.status" :show-icon="false">
            {{ row.original.status }}
          </base-badge>
        </template>

        <template #actions-cell="{ row }">
          <base-dropdown-menu
            :items="[
              {
                label: 'View Details',
                onSelect: () => openViewModal(row.original),
              },
            ]"
          />
        </template>
      </base-table>
      <base-pagination
        :page="pagination.page"
        :total="bookings.meta.total"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="
          (v) => {
            pagination.page = v;
            fetchBookings();
          }
        "
      />

      <bookings-detail-modal
        :open="isDetailModalOpen"
        :booking="selectedBooking"
        @close="isDetailModalOpen = false"
        @confirm="fetchBookings"
      />
    </div>
  </div>
</template>
