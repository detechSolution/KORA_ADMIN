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

const bookingStatusOptions = [
  { label: "Pending", value: "pending_payment" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancellation Processing", value: "cancellation_processing" },
  { label: "Cancelled", value: "cancelled" },
];

const { success, error: showError } = useNotification();
const bookingStore = useBookingStore();
const bookings = computed(() => bookingStore.bookings);
const { pagination } = usePagination();

const loading = ref(false);
const loadingSummary = ref(false);
const loadingCancel = ref(false);

const isDetailModalOpen = ref(false);
const isCancelModalOpen = ref(false);

const selectedBooking = ref<Booking | null>(null);
const summary = ref<any>(null);

const filters = ref({
  search: "",
  status: "",
  type: "",
  dateRange: {
    start: null as string | null,
    end: null as string | null,
  },
});

const columns = computed(() => [
  { accessorKey: "bookingCode", header: "Booking ID" },
  { accessorKey: "client", header: "Client" },
  { accessorKey: "itemName", header: "Session/Service" },
  { accessorKey: "itemType", header: "Type" },
  {
    accessorKey: "bookedFor",
    header: "Booked Date",
    accessorFn: (row: Booking) => formatDate(row.bookedFor) || "N/A",
  },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "actions", header: "Actions" },
]);

const hasActiveFilters = computed(() => {
  return (
    filters.value.search
    || filters.value.dateRange.start
    || filters.value.dateRange.end
    || filters.value.status !== ""
  );
},
);

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
    };
    await bookingStore.getBookings(params);
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
      dateFrom: filters.value.dateRange.start || undefined,
      dateTo: filters.value.dateRange.end || undefined,
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

  if (filters.value.dateRange.start || filters.value.dateRange.end)
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
}

function openCancelModal(booking: any): void {
  selectedBooking.value = booking;
  isCancelModalOpen.value = true;
}

function openViewModal(booking: any): void {
  selectedBooking.value = booking;
  isDetailModalOpen.value = true;
}

async function handleRequestCancellation(): Promise<void> {
  if (!selectedBooking.value?.id)
    return;

  try {
    loadingCancel.value = true;

    await bookingStore.requestBookingCancellation(
      selectedBooking.value.id,
    );

    success({ message: "Cancellation requested successfully" });

    await fetchBookings();
  }
  catch (err: unknown) {
    showError({
      message: getApiErrorMessage(
        err,
        "Failed to request booking cancellation",
      ),
    });
  }
  finally {
    loadingCancel.value = false;
    isCancelModalOpen.value = false;
    selectedBooking.value = null;
  }
}

const kpiData = computed(() => [
  {
    title: "Booking Type",
    icon: ICONS.INQUIRIES,
    value: "All Bookings",
    subtitle: `${summary.value?.allBookings || "0"} bookings`,
    type: "",
  },
  {
    title: "Booking Type",
    icon: ICONS.CALENDAR,
    subtitle: `${summary.value?.sessions || "0"} bookings`,
    value: "Sessions",
    type: "session",
  },
  {
    title: "Booking Type",
    icon: ICONS.FLOWER,
    subtitle: `${summary.value?.spa || "0"} bookings`,
    value: "Spa",
    type: "spa",
  },
  {
    title: "Booking Type",
    icon: ICONS.ID_CARD,
    subtitle: `${summary.value?.passes || "0"} bookings`,
    value: "Passes",
    type: "passes",
  },
]);

function filterByType(type: string): void {
  filters.value.type = type;
  pagination.value.page = 1;
  fetchBookings();
}

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  await fetchBookings();
  fetchBookingsSummary();

  const search = route.query.search as string;

  if (search) {
    filters.value.search = search || "";

    await fetchBookings();

    router.replace({ query: { search: undefined } });
  }
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
      <div class="grid bg-stone-50 rounded border border-border py-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-y-6 md:gap-y-8 gap-x-0">
        <dashboard-kpi-card
          v-for="(kpi, index) in kpiData"
          :key="index"
          class="px-6 border-border"
          :class="[
            index % 2 === 0 ? 'md:border-r' : 'md:border-r-0',
            index !== 3 ? 'xl:border-r' : 'xl:border-r-0',
          ]"
          :title="kpi.title"
          :value="kpi.value"
          :subtitle="kpi.subtitle"
          :icon="kpi.icon"
          :active="filters.type === kpi.type"
          :clickable="true"
          @click="filterByType(kpi.type)"
        />
      </div>

      <h2 class="text-base font-semibold">
        Bookings List
      </h2>
      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
          <base-input
            v-model="filters.search"
            name="search"
            placeholder="Search"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
            :leading-icon="ICONS.SEARCH"
            @keyup.enter="handleSearch"
          />

          <base-date-picker
            v-model="filters.dateRange"
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
          />

          <base-select
            v-model="filters.status"
            :options="bookingStatusOptions"
            name="status"
            placeholder="Select status"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
          />

          <div class="flex gap-2 w-full sm:w-auto">
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
      >
        <template #bookingCode-cell="{ row }">
          <base-badge uppercase>
            {{ row.original.bookingCode }}
          </base-badge>
        </template>

        <template #client-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-avatar
              :src="row.original.clientName"
              :alt="row.original.clientName || 'Unknown'"
              size="sm"
            />
            <div class="flex flex-col gap-1">
              <div class="flex flex-row gap-2 items-center">
                <span class="text-sm font-medium text-secondary">
                  {{ row.original.clientName || "-" }}
                </span>

                <UTooltip
                  v-if="row.original.visitorCount"
                  arrow
                  :text="`${row.original.visitorCount} Visitors`"
                >
                  <span
                    class="text-xs bg-red-50 border border-red-300 px-1 rounded-full text-red-500"
                  >
                    +  {{ row.original.visitorCount }}
                  </span>
                </UTooltip>
              </div>
              <span class="text-xs text-secondary-400">
                {{ row.original.clientEmail || "N/A" }}
              </span>
            </div>
          </div>
        </template>

        <template #itemType-cell="{ row }">
          <base-badge :status="row.original.itemType">
            {{ row.original.itemType }}
          </base-badge>
        </template>

        <template #status-cell="{ row }">
          <base-badge :status="row.original.status">
            {{ row.original.status }}
          </base-badge>
        </template>

        <template #actions-cell="{ row }">
          <base-dropdown-menu
            :items="[
              {
                label: 'Request Cancellation',
                icon: ICONS.EYE,
                disabled: row.original.status !== 'confirmed',
                onSelect: () => openCancelModal(row.original),
              },
              {
                label: 'View Details',
                icon: ICONS.EYE,
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
        @update:page="(v) => { pagination.page = v; fetchBookings(); }"
      />

      <bookings-delete-modal
        :open="isCancelModalOpen"
        :loading="loadingCancel"
        @close="isCancelModalOpen = false"
        @confirm="handleRequestCancellation"
      />

      <bookings-detail-modal
        :open="isDetailModalOpen"
        :booking="selectedBooking"
        @close="isDetailModalOpen = false"
      />
    </div>
  </div>
</template>
