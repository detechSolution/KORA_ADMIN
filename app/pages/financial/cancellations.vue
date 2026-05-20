<script setup lang="ts">
import { computed, ref } from "vue";

import ViewCancellationDrawer from "~/components/Cancellations/view-cancellation.vue";
import { ICONS } from "~/config/icons";
import { useFinanceStore } from "~/stores/finance";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "refunds.manage",
});

const columns = [
  { header: "Client", accessorKey: "client" },
  { header: "Reference ID", accessorKey: "referenceCode" },
  { header: "Requested Date", accessorKey: "requestedDate", accessorFn: row => formatDate(row.requestedDate) || "N/A" },
  { header: "Refunded Date", accessorKey: "refundedDate", accessorFn: row => formatDate(row.refundedDate) || "N/A" },
  { header: "Amount", accessorKey: "amount" },
  { header: "Status", accessorKey: "status" },
  { header: "Actions", accessorKey: "actions" },
];
const { pagination } = usePagination();

const financeStore = useFinanceStore();
const loading = computed(() => financeStore.loading);
const cancellations = computed(() => financeStore.cancellations);

async function fetchCancellations() {
  try {
    await financeStore.fetchCancellations();
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to fetch payments") });
    console.error("Error fetching cancellations:", error);
  }
}

const isViewCancellationDrawerOpen = ref(false);
const selectedCancellation = ref(null);

function handleViewClick(cancellation: any) {
  selectedCancellation.value = cancellation;
  isViewCancellationDrawerOpen.value = true;
}

fetchCancellations();
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
      <div>
        <h2 class="text-base font-semibold">
          Cancellations List
        </h2>
      </div>

      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
          <base-input
            name="search"
            placeholder="Search"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
            :leading-icon="ICONS.SEARCH"
          />

          <base-date-picker
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <base-select
            name="status"
            placeholder="All statuses"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
            >
              Clear Filters
            </base-button>
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
            >
              Search
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
        empty-description="It looks like you haven't added any cancellations. Create one to get started."
      >
        <template #client-cell="{ row }">
          <div class="flex items-center">
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
          <base-badge>
            {{ row?.original?.referenceCode }}
          </base-badge>
        </template>

        <template #status-cell="{ row }">
          <base-badge :color="getStatusColor(row?.original?.status)">
            {{ getStatusLabel(row?.original?.status) }}
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
      :cancellation="selectedCancellation"
      @close="isViewCancellationDrawerOpen = false"
    />
  </div>
</template>
