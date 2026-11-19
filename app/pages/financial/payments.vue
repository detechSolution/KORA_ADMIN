<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { getHttp } from "~/composables/use-api";
import { usePagination } from "~/composables/use-pagination";
import { API_ENDPOINTS } from "~/config/constants";
import { ICONS } from "~/config/icons";
import { useFinanceStore } from "~/stores/finance";
import { buildQueryString, formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";
import { downloadCsv } from "~/utils/report-csv";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "payments.view",
});

const financeStore = useFinanceStore();
const { pagination } = usePagination();
const { error: showError } = useNotification();

const state = ref({
  search: "",
  dateRange: {
    start: null as string | null,
    end: null as string | null,
  },
  status: null as string | null,
  method: "",
  paymentStatus: "paid",
});

const exporting = ref(false);
const fetching = ref(false);
const loadError = ref("");
const appliedFilters = ref<Record<string, string | number | boolean | null | undefined>>({});
const methodOptions = [{ label: "Cash", value: "cash" }, { label: "Online", value: "online" }];
const paymentStatusOptions = [{ label: "All statuses", value: null }, { label: "Paid", value: "paid" }, { label: "Free", value: "free" }];
const summaryItems = computed(() => {
  const s = financeStore.paymentSummary;
  return [
    { label: "Net revenue", value: s?.total, icon: ICONS.CHART_LINE, featured: true },
    { label: "Cash (net)", value: s?.cashPayments, icon: ICONS.BANKNOTE },
    { label: "Online (net)", value: s?.onlinePayments, icon: ICONS.CREDIT_CARD },
    { label: "Collected", value: s?.grossCollected, icon: ICONS.BILLING },
    { label: "Refund pending", value: s?.pendingRefunds, icon: ICONS.REFRESH_CW },
    { label: "Refunded", value: s?.refunded, icon: ICONS.REFRESH_CW },
  ];
});
async function exportPayments() {
  exporting.value = true;
  try {
    const file = await getHttp().get<{ filename: string; csv: string }>(`${API_ENDPOINTS.PAYMENTS.BASE}/export?${buildQueryString(appliedFilters.value)}`);
    downloadCsv(file);
  }
  catch (error: unknown) { showError({ message: getApiErrorMessage(error, "Failed to export payments") }); }
  finally { exporting.value = false; }
}

const columns = [
  { id: "referenceCode", header: "Reference ID", accessorKey: "referenceCode" },
  { id: "user", header: "Client", accessorKey: "user" },
  { id: "checkoutCode", header: "Payment ID", accessorKey: "checkoutCode", accessorFn: (row: any) => row.checkoutCode || "N/A" },
  { id: "amount", header: "Amount", accessorKey: "amount", accessorFn: (row: any) => `${row.currency} ${row.amount.toFixed(2)}` || "N/A" },
  { id: "paidAt", header: "Paid Date", accessorKey: "createdAt", accessorFn: (row: any) => formatDate(row.createdAt) || "N/A" },
  { id: "tiggInvoiceCode", header: "Invoice No", accessorKey: "tiggInvoiceCode" },
  { id: "refundStatus", header: "Refund status", accessorKey: "refundStatus" },
  { id: "netAmount", header: "Net revenue", accessorKey: "netAmount", accessorFn: (row: { netAmount: number }) => `Rs. ${Number(row.netAmount).toFixed(2)}` },
  { id: "method", header: "Method", accessorKey: "method" },
];

const payments = computed(() => financeStore.payments);
const route = useRoute();
const router = useRouter();

async function fetchPayments(): Promise<void> {
  fetching.value = true;
  loadError.value = "";
  try {
    if (state.value.dateRange.start && state.value.dateRange.end && state.value.dateRange.start > state.value.dateRange.end) {
      showError({ message: "Start date must be before the end date." });
      return;
    }
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search,
      paidFrom: state.value.dateRange.start,
      paidTo: state.value.dateRange.end,
      status: state.value.status,
      method: state.value.method === "all" ? undefined : state.value.method,
      paymentStatus: state.value.paymentStatus === "all" ? undefined : state.value.paymentStatus,
    };

    await Promise.all([financeStore.fetchPayments(params), financeStore.fetchPaymentSummary(params)]);
    appliedFilters.value = params;
  }
  catch (error: unknown) {
    loadError.value = getApiErrorMessage(error, "Failed to fetch payments. Please try again.");
    financeStore.paymentSummary = null;
    showError({ message: loadError.value });
  }
  finally { fetching.value = false; }
}

function handleSearchClick(): void {
  pagination.value.page = 1;
  fetchPayments();
}

function clearFilters(): void {
  state.value.search = "";
  state.value.status = null;
  state.value.method = "all";
  state.value.paymentStatus = "paid";
  state.value.dateRange = { start: null, end: null };
  handleSearchClick();
}

async function handleInvoiceClick(id: string | number): Promise<void> {
  try {
    const response = await financeStore.printInvoice(id);
    window.open(response?.printUrl, "_blank", "noopener,noreferrer");
  }
  catch (error) {
    showError({
      message: getApiErrorMessage(error, "Failed to print invoice"),
    });
  }
}

onMounted(async () => {
  const search = route.query.search as string;
  const date = typeof route.query.date === "string" ? route.query.date : null;
  state.value.search = search || "";
  state.value.dateRange = { start: date, end: date };

  await fetchPayments();

  router.replace({ query: { search: undefined } });
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

    <p
      v-if="loadError"
      role="alert"
      class="text-red-700"
    >
      {{ loadError }}
    </p>
    <dl
      class="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4"
      aria-label="Payment totals"
      :aria-busy="fetching"
    >
      <div
        v-for="item in summaryItems"
        :key="item.label"
        class="min-w-0 rounded-xl border p-5"
        :class="item.featured ? 'border-primary-300 bg-primary-50' : 'border-border bg-white'"
      >
        <dt class="flex items-center justify-between gap-3 text-sm font-medium text-secondary-500">
          <span>{{ item.label }}</span>
          <UIcon
            :name="item.icon"
            class="size-4 shrink-0 text-primary-700"
            aria-hidden="true"
          />
        </dt>
        <dd class="mt-4 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 font-semibold text-secondary tabular-nums">
          <span
            v-if="fetching"
            class="h-7 w-24 animate-pulse rounded bg-stone-200 motion-reduce:animate-none"
            aria-label="Loading total"
          />
          <template v-else-if="item.value != null">
            <span class="text-sm font-medium text-secondary-500">Rs.</span>
            <span class="min-w-0 break-all text-2xl leading-tight">{{ item.value.toLocaleString() }}</span>
          </template>
          <span v-else class="text-2xl">—</span>
        </dd>
      </div>
    </dl>
    <div class="bg-white flex flex-col gap-4 p-4">
      <div class="flex flex-col 2xl:flex-row 2xl:items-end gap-3">
        <div class="min-w-0 flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
          <base-input
            v-model="state.search"
            name="search"
            placeholder="Client name or Reference ID"
            class="w-full sm:w-64 sm:flex-none"
            :leading-icon="ICONS.SEARCH"
            @keyup.enter="handleSearchClick"
          />

          <base-date-picker
            v-model="state.dateRange"
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-72 sm:flex-none"
          />

          <base-select
            v-model="state.method"
            name="method"
            :options="methodOptions"
            placeholder="Select method"
            class="w-full sm:w-40"
          />
          <base-select
            v-model="state.paymentStatus"
            name="paymentStatus"
            :options="paymentStatusOptions"
            class="w-full sm:w-40"
          />
          <div class="flex flex-wrap gap-2 w-full sm:w-auto">
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              :loading="fetching"
              @click="handleSearchClick"
            >
              Search
            </base-button>
            <base-button
              v-if="state.search || state.dateRange.start || state.dateRange.end || state.status || state.method !== 'all' || state.paymentStatus !== 'paid'"
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
          :disabled="fetching || !!loadError"
          @click="exportPayments"
        >
          Export CSV
        </base-button>
      </div>
      <base-table
        :data="payments.data"
        :columns="columns"
        :loading="fetching"
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

        <template #tiggInvoiceCode-cell="{ row }">
          <div
            v-if="row?.original?.tiggInvoiceCode"
            class="flex items-center gap-2 cursor-pointer hover:underline text-blue-600"
            @click="handleInvoiceClick(row.original.id)"
          >
            <span>{{ row.original.tiggInvoiceCode }}</span>
            <UIcon :name="ICONS.EXTERNAL_LINK" />
          </div>

          <span v-else>N/A</span>
        </template>

        <template #refundStatus-cell="{ row }">
          <span>{{ Number(row.original.pendingRefund) > 0 ? "Refund pending" : Number(row.original.refundDeduction) > 0 ? "Refunded" : row.original.refundStatus === "rejected" ? "Rejected" : "—" }}</span>
        </template>
        <template #method-cell="{ row }">
          <base-badge :status="row?.original?.method" :show-icon="true">
            {{ row?.original?.method }}
          </base-badge>
        </template>
      </base-table>
      <base-pagination
        :page="payments.meta.page"
        :total="payments.meta.total"
        :items-per-page="payments.meta.limit"
        :loading="fetching"
        @update:page="(v) => { pagination.page = v; fetchPayments() }"
      />
    </div>
  </div>
</template>
