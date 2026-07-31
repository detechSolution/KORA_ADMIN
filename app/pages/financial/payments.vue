<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useFinanceStore } from "~/stores/finance";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "payments.view",
});

const options = ref([
  { label: "Paid", value: "paid" },
  { label: "Refunded", value: "refunded" },
]);

const financeStore = useFinanceStore();
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

const columns = [
  { id: "user", header: "Client", accessorKey: "user" },
  { id: "referenceCode", header: "Reference ID", accessorKey: "referenceCode" },
  { id: "amount", header: "Amount", accessorKey: "amount", accessorFn: (row: any) => `${row.currency} ${row.amount.toFixed(2)}` || "N/A" },
  { id: "paidAt", header: "Paid Date", accessorKey: "createdAt", accessorFn: (row: any) => formatDate(row.createdAt) || "N/A" },
  { id: "method", header: "Method", accessorKey: "method" },
  { id: "status", header: "Status", accessorKey: "status" },
];

const payments = computed(() => financeStore.payments);

async function fetchPayments(): Promise<void> {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search,
      paidFrom: state.value.dateRange.start,
      paidTo: state.value.dateRange.end,
      status: state.value.status,
    };

    await financeStore.fetchPayments(params);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to fetch payments") });
  }
}

function handleSearchClick(): void {
  pagination.value.page = 1;
  fetchPayments();
}

function clearFilters(): void {
  state.value.search = "";
  state.value.status = null;
  state.value.dateRange = { start: null, end: null };
  handleSearchClick();
}

onMounted(() => {
  fetchPayments();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Payments
      </template>
      <template #description>
        View Payment Details, Status, and Types
      </template>
    </base-page-header>

    <div class="bg-white flex flex-col gap-4 p-4">
      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
          <base-input
            v-model="state.search"
            name="search"
            placeholder="Client name or Reference ID"
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
            class="w-full sm:w-auto sm:flex-1 "
          />
          <base-select
            v-model="state.status"
            name="status"
            placeholder="Status"
            :options="options"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
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
              v-if="state.search || state.dateRange.start || state.dateRange.end || state.status"
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="clearFilters"
            >
              Clear Filters
            </base-button>
          </div>
        </div>

        <!-- <base-button
          variant="outline"
          :leading-icon="ICONS.DOWNLOAD"
        >
          Export
        </base-button> -->
      </div>
      <base-table
        :data="payments.data"
        :columns="columns"
        :loading="financeStore.loading"
        empty-title="No payments found"
      >
        <template #user-cell="{ row } ">
          <div class="flex items-center gap-2">
            <base-avatar
              :src="row?.original?.member?.user?.avatar"
              :alt="row?.original?.member?.user?.fullName || 'Unknown'"
              size="sm"
            />
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium text-secondary">
                {{ row?.original?.member?.user?.fullName || "-" }}
              </span>
              <span class="text-xs text-secondary-400">
                {{ row?.original?.member?.user?.email || "-" }}
              </span>
            </div>
          </div>
        </template>

        <template #referenceCode-cell="{ row }">
          <base-badge uppercase>
            {{ row?.original?.referenceCode || "-" }}
          </base-badge>
        </template>

        <template #method-cell="{ row }">
          <base-badge :status="row?.original?.method" :show-icon="true">
            {{ row?.original?.method }}
          </base-badge>
        </template>

        <template #status-cell="{ row }">
          <base-badge :status="row?.original?.status">
            {{ row?.original?.status }}
          </base-badge>
        </template>
      </base-table>
      <base-pagination
        :page="payments.meta.page"
        :total="payments.meta.total"
        :items-per-page="payments.meta.limit"
        :loading="financeStore.loading"
        @update:page="(v) => { pagination.page = v; fetchPayments() }"
      />
    </div>
  </div>
</template>
