<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { getPaymentStatusConfig } from "~/config/payment-status";
import { usePaymentMethodsStore } from "~/stores/payment-methods";
import { useTransactionsStore } from "~/stores/transaction";
import { formatDate, formatDateTime, formatNumber } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "TRANSACTIONS.PAYMENT",
});

const { error: showError } = useNotification();
const transactionsStore = useTransactionsStore();
const paymentMethodsStore = usePaymentMethodsStore();
const { pagination } = usePagination();

const state = ref<{
  paymentMethodId: string;
  paymentDateRange: { start: string | null; end: string | null };
}>({
  paymentMethodId: "",
  paymentDateRange: { start: null, end: null },
});

const loading = ref(false);
const selectedPayment = ref<any>(null);
const isViewOpen = ref(false);

const paymentMethodOptions = ref<{ label: string; value: string }[]>([]);

const columns = ref([
  {
    accessorKey: "payment_date",
    header: "Payment Date",
    cell: ({ row }: { row: any }) => (row.original.payment_date ?? row.original.paymentDate ? formatDate(row.original.payment_date ?? row.original.paymentDate) : "-"),
  },
  {
    accessorKey: "transaction",
    header: "Transaction Number",
    cell: ({ row }: { row: any }) => {
      const transaction = row.original.transaction ?? row.original;
      const refNum = transaction?.transaction_reference_number ?? "-";
      return h("div", { class: "flex flex-col gap-0.5" }, [
        h("span", refNum),
        row.original.created_at
          ? h("span", { class: "text-xs text-muted-foreground" }, `Created at: ${formatDateTime(row.original.created_at)}`)
          : null,
      ]);
    },
  },
  {
    accessorKey: "community",
    header: "Billed To",
    cell: ({ row }: { row: any }) => {
      const community = row.original.community;
      const name = community?.communityName ?? community?.community_name ?? row.original.community_name ?? "N/A";
      const code = community?.communityCode ?? community?.community_code ?? row.original.community_code;
      const address = community?.communityAddress ?? community?.community_address ?? row.original.community_address;
      const nameLine = code ? `${name} - ${code}` : name;
      return h("div", { class: "flex flex-col gap-0.5" }, [
        h("span", nameLine),
        h("span", { class: "text-xs text-muted-foreground" }, `Address: ${address ?? "N/A"}`),
      ]);
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const config = getPaymentStatusConfig(row.original.status);
      return h(
        resolveComponent("base-badge"),
        {
          color: config.color,
        },
        () => config.label,
      );
    },
  },
  {
    accessorKey: "payment_method",
    header: "Payment Method",
    cell: ({ row }: { row: any }) => {
      const pm = row.original.payment_method ?? row.original.paymentMethod ?? row.original.transaction_payment_method;
      const name = pm?.name ?? pm?.method_name ?? row.original.payment_method_name ?? "-";
      return name;
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }: { row: any }) => {
      const value = row.original.amount;
      return value !== undefined && value !== null ? formatNumber(value) : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const payment = row.original;
      const items = [
        {
          label: "View details",
          onSelect: () => {
            selectedPayment.value = payment;
            isViewOpen.value = true;
          },
        },
      ];
      return h(
        "div",
        { class: "text-right" },
        h(
          resolveComponent("UDropdownMenu"),
          {
            content: { align: "end" },
            ui: { content: "min-w-[150px]", itemLeadingIcon: "hidden" },
            items,
          },
          () =>
            h(resolveComponent("UButton"), {
              icon: ICONS.ELLIPSIS_VERTICAL,
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
            }),
        ),
      );
    },
  },
]);

async function loadPaymentMethods(): Promise<void> {
  try {
    const paymentMethods = await paymentMethodsStore.getTransactionPaymentMethods({ is_active: true });
    paymentMethodOptions.value = (paymentMethods ?? []).map((m: any) => ({
      label: m.name ?? m.method_name ?? String(m.id),
      value: String(m.id),
    }));
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Failed to load payment methods") });
  }
}

async function getTransactionPaymentList(): Promise<void> {
  try {
    loading.value = true;
    const payload: {
      pagination: { page: number; limit: number };
      payment_method_id?: number;
      payment_start_date?: string;
      payment_end_date?: string;
    } = {
      pagination: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
    };
    if (state.value.paymentMethodId)
      payload.payment_method_id = Number(state.value.paymentMethodId);
    if (state.value.paymentDateRange.start)
      payload.payment_start_date = state.value.paymentDateRange.start;
    if (state.value.paymentDateRange.end)
      payload.payment_end_date = state.value.paymentDateRange.end;
    await transactionsStore.getTransactionPaymentList(payload);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to get payment list") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearch(): void {
  pagination.value.page = 1;
  getTransactionPaymentList();
}

function clearFilters(): void {
  state.value.paymentMethodId = "";
  state.value.paymentDateRange = { start: null, end: null };
}

function hasActiveFilters(): boolean {
  return !!(state.value.paymentMethodId || state.value.paymentDateRange.start || state.value.paymentDateRange.end);
}

function closeView(): void {
  isViewOpen.value = false;
  selectedPayment.value = null;
}

onMounted(() => {
  loadPaymentMethods();
  getTransactionPaymentList();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Transaction Payments
      </template>
      <template #description>
        View and manage transaction payment records.
      </template>
      <template #actions>
        <NuxtLink to="/transaction/list">
          <base-button
            variant="outline"
            size="md"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            Back to List
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>
    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6 flex flex-col gap-4 page-content-height">
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
        <base-select
          v-model="state.paymentMethodId"
          name="paymentMethodId"
          placeholder="Select payment method"
          :options="paymentMethodOptions"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-date-picker
          v-model="state.paymentDateRange"
          name="paymentDateRange"
          placeholder="Select payment date range"
          range
          :no-of-months="2"
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
            class="flex-1 sm:flex-none"
            :leading-icon="ICONS.SEARCH"
            @click="handleSearch"
          >
            Search
          </base-button>
        </div>
      </div>
      <base-table
        :data="transactionsStore.transactionPaymentList.data"
        :columns="columns"
        :loading="loading"
        empty-title="No transaction payments found"
        empty-description="Transaction payments will appear here after payments are made."
      />
      <base-pagination
        :page="pagination.page"
        :total="Number(transactionsStore.transactionPaymentList.total_count)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; getTransactionPaymentList(); }"
      />
    </div>
    <transaction-payment-view
      :open="isViewOpen"
      :payment="selectedPayment"
      @close="closeView"
    />
  </div>
</template>
