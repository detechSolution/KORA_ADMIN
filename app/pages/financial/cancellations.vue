<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import ViewCancellationDrawer from "~/components/Cancellations/view-cancellation.vue";
import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useFinanceStore } from "~/stores/finance";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "refunds.manage",
});

const options = [
  { label: "Requested", value: "requested" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const columns = [
  { header: "Client", accessorKey: "client" },
  { header: "Reference ID", accessorKey: "referenceCode" },
  { header: "Requested Date", accessorKey: "requestedDate", accessorFn: (row: any) => formatDate(row.requestedDate) || "N/A" },
  { header: "Refunded Date", accessorKey: "refundedDate", accessorFn: (row: any) => formatDate(row.refundedDate) || "N/A" },
  { header: "Amount", accessorKey: "amount" },
  { header: "Status", accessorKey: "status" },
  { header: "Actions", accessorKey: "actions" },
];
const { pagination } = usePagination();
const { error: showError } = useNotification();

const state = ref({
  search: "",
  dateRange: {
    start: null,
    end: null,
  },
  status: null,
});

const financeStore = useFinanceStore();
const loading = ref(false);
const cancellations = computed(() => financeStore.cancellations);

async function fetchCancellations() {
  try {
    loading.value = true;
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search,
      status: state.value.status,
      refundFrom: state.value.dateRange.start,
      refundTo: state.value.dateRange.end,
    };

    await financeStore.fetchCancellations(params);
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to fetch payments") });
    console.error("Error fetching cancellations:", error);
  }
  finally {
    loading.value = false;
  }
}

const isViewCancellationDrawerOpen = ref(false);
const selectedCancellation = ref<any>(null);

function handleViewClick(cancellation: any) {
  selectedCancellation.value = cancellation;
  isViewCancellationDrawerOpen.value = true;
}

function handleCloseAndRefetch() {
  isViewCancellationDrawerOpen.value = false;
  fetchCancellations();
}

function handleSearchClick() {
  pagination.value.page = 1;
  fetchCancellations();
}

function clearFilters() {
  state.value.search = "";
  state.value.status = null;
  state.value.dateRange = { start: null, end: null };
  handleSearchClick();
}

function hasActiveFilters(): boolean {
  return !!(state.value.search || state.value.status || state.value.dateRange.start || state.value.dateRange.end);
}

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const search = route.query.search as string;

  state.value.search = search;
  await fetchCancellations();

  router.replace({ query: { search: undefined } });
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Cancellations
      </template>
      <template #description>
        View cancellation details & status and manage refunds
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl p-6 flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
          <base-input
            v-model="state.search"
            name="search"
            placeholder="Search"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
            :leading-icon="ICONS.SEARCH"
            @keyup.enter="handleSearchClick"
          />

          <base-date-picker
            v-model="state.dateRange"
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1"
          />
          <base-select
            v-model="state.status"
            name="status"
            placeholder="Select status"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
            :options="options"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              @click="handleSearchClick"
            >
              Search
            </base-button>
            <base-button
              v-if="hasActiveFilters()"
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
        :data="cancellations.data"
        :columns="columns"
        :loading="loading"
        empty-title="No cancellations found"
      >
        <template #client-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-avatar
              :src="row.original.clientAvatar"
              :alt="row.original.clientName || 'Unknown'"
              size="sm"
            />
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium text-secondary">
                {{ row?.original?.clientName }}
              </span>
              <span class="text-xs text-muted">
                {{ row?.original?.clientPhoneNumber }}
              </span>
            </div>
          </div>
        </template>
        <template #referenceCode-cell="{ row }">
          <base-badge uppercase>
            {{ row?.original?.referenceCode }}
          </base-badge>
        </template>

        <template #status-cell="{ row }">
          <base-badge :status="row?.original?.status">
            {{ row?.original?.status }}
          </base-badge>
        </template>

        <template #actions-cell="{ row }">
          <base-dropdown-menu
            :items="[
              {
                label: 'View Cancellation Details',
                icon: ICONS.THREE_VERTICAL_DOTS,
                onSelect: () => handleViewClick(row?.original),
              },
            ]"
          />
        </template>
      </base-table>

      <base-pagination
        :page="cancellations.meta.page"
        :items-per-page="cancellations.meta.limit"
        :total="cancellations.meta.total"
        :loading="loading"
        @update:page="(v) => { pagination.page = v; fetchCancellations(); }"
      />
    </div>

    <ViewCancellationDrawer
      v-if="isViewCancellationDrawerOpen"
      :open="isViewCancellationDrawerOpen"
      :cancellation-id="selectedCancellation?.id"
      @close="isViewCancellationDrawerOpen = false"
      @close-and-refetch="handleCloseAndRefetch"
    />
  </div>
</template>
