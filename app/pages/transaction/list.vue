<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from "vue";

import { usePagination } from "~/composables/use-pagination";
import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_TRANSACTIONS } from "~/config/permissions";
import { getTransactionStatusConfig } from "~/config/transaction-status";
import { usePaymentMethodsStore } from "~/stores/payment-methods";
import { useTransactionsStore } from "~/stores/transaction";
import { formatDate, formatDateTime, formatNumber } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "TRANSACTIONS.LIST",
});

const transactionsStore = useTransactionsStore();
const paymentMethodsStore = usePaymentMethodsStore();
const { can } = usePermission();
const { pagination } = usePagination();
const { success, error: showError } = useNotification();

const state = ref({
  status: "",
  referenceNumber: "",
  referenceDateRange: { start: null, end: null },
  dueDateRange: { start: null, end: null },
});

const statusOptions = ref([
  { label: "Issued", value: "ISSUED" },
  { label: "Paid", value: "PAID" },
  { label: "Cancelled", value: "CANCELLED" },
]);

const paymentMethods = ref<any[]>([]);

const loading = ref(false);
const selectedTransaction = ref<any>(null);
const isViewOpen = ref(false);
const transactionToCancel = ref<any>(null);
const isCancelModalOpen = ref(false);
const cancelling = ref(false);
const transactionToPay = ref<any>(null);
const isPaymentModalOpen = ref(false);

const columns = ref([
  {
    accessorKey: "reference_date",
    header: "Transaction Date",
    cell: ({ row }: { row: any }) => (row.original.reference_date ? formatDate(row.original.reference_date) : "-"),
  },
  {
    accessorKey: "reference_number",
    header: "Transaction Number",
    cell: ({ row }: { row: any }) =>
      h("div", { class: "flex flex-col gap-0.5" }, [
        h("span", row.original.reference_number ?? "-"),
        row.original.created_at
          ? h("span", { class: "text-xs text-muted-foreground" }, `Created at: ${formatDateTime(row.original.created_at)}`)
          : null,
      ]),
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
      const config = getTransactionStatusConfig(row.original.status);
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
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }: { row: any }) => (row.original.due_date ? formatDate(row.original.due_date) : "-"),
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }: { row: any }) => {
      const value = row.original.total_amount;
      return value !== undefined && value !== null ? formatNumber(value) : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const transaction = row.original;
      const isIssued = transaction.status === "ISSUED";
      const items = [];
      if (can(PERMISSIONS_TRANSACTIONS.LIST_VIEW)) {
        items.push({
          label: "View details",
          onSelect: () => {
            selectedTransaction.value = transaction;
            isViewOpen.value = true;
          },
        });
      }
      if (isIssued && can(PERMISSIONS_TRANSACTIONS.LIST_PAY)) {
        items.push({
          label: "Pay",
          onSelect: () => {
            transactionToPay.value = transaction;
            isPaymentModalOpen.value = true;
          },
        });
      }
      if (isIssued && can(PERMISSIONS_TRANSACTIONS.LIST_CANCEL)) {
        items.push({
          label: "Cancel",
          onSelect: () => {
            transactionToCancel.value = transaction;
            isCancelModalOpen.value = true;
          },
        });
      }
      if (items.length === 0)
        return null;
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

async function getTransactionList(): Promise<void> {
  try {
    loading.value = true;
    const payload = {
      pagination: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
      status: state.value.status || undefined,
      reference_number: state.value.referenceNumber || undefined,
      reference_start_date: state.value.referenceDateRange.start || undefined,
      reference_end_date: state.value.referenceDateRange.end || undefined,
      due_start_date: state.value.dueDateRange.start || undefined,
      due_end_date: state.value.dueDateRange.end || undefined,
    };
    await transactionsStore.getTransactionList(payload);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to get transaction list") });
  }
  finally {
    loading.value = false;
  }
}

async function getPaymentMethods(): Promise<void> {
  try {
    const result = await paymentMethodsStore.getTransactionPaymentMethods({ is_active: true }) as any;
    paymentMethods.value = result ?? [];
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load payment methods") });
  }
}

function handleSearch(): void {
  pagination.value.page = 1;
  getTransactionList();
}

function clearFilters(): void {
  state.value.status = "";
  state.value.referenceNumber = "";
  state.value.referenceDateRange = { start: null, end: null };
  state.value.dueDateRange = { start: null, end: null };
}

async function handleConfirmCancel(): Promise<void> {
  if (!transactionToCancel.value)
    return;
  try {
    cancelling.value = true;
    await transactionsStore.cancelTransaction(transactionToCancel.value.id);
    success({ message: "Transaction cancelled successfully" });
    closeCancelModal();
    await getTransactionList();
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Failed to cancel transaction") });
  }
  finally {
    cancelling.value = false;
  }
}

function closeCancelModal(): void {
  isCancelModalOpen.value = false;
  transactionToCancel.value = null;
}

function closeView(): void {
  isViewOpen.value = false;
  selectedTransaction.value = null;
}

function closePaymentModal(): void {
  isPaymentModalOpen.value = false;
  transactionToPay.value = null;
}

function handlePaymentSubmitted(): void {
  closePaymentModal();
  getTransactionList();
}

function hasActiveFilters(): boolean {
  return !!(
    state.value.status
    || state.value.referenceNumber
    || state.value.referenceDateRange.start
    || state.value.referenceDateRange.end
    || state.value.dueDateRange.start
    || state.value.dueDateRange.end
  );
}

const paymentMethodOptions = computed(() => {
  return paymentMethods.value.map((m: any) => ({
    label: m.name,
    value: m.id,
  }));
});

onMounted(() => {
  getTransactionList();
  getPaymentMethods();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Transaction List
      </template>
      <template #description>
        View and manage all transactions.
      </template>
      <template #actions>
        <NuxtLink
          v-if="can(PERMISSIONS_TRANSACTIONS.CREATE)"
          to="/transaction/create"
        >
          <base-button
            variant="outline"
            size="md"
            :trailing-icon="ICONS.PLUS"
          >
            Create Transaction
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>
    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6 flex flex-col gap-4 page-content-height">
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
        <base-select
          v-model="state.status"
          name="status"
          placeholder="Select status"
          :options="statusOptions"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-input
          v-model="state.referenceNumber"
          name="referenceNumber"
          placeholder="Search by reference number"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-date-picker
          v-model="state.referenceDateRange"
          name="referenceDateRange"
          placeholder="Select transaction date range"
          range
          :no-of-months="2"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-date-picker
          v-model="state.dueDateRange"
          name="dueDateRange"
          placeholder="Select due date range"
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
        :data="transactionsStore.transactionList.data"
        :columns="columns"
        :loading="loading"
        empty-title="No transactions found"
        empty-description="Transactions will appear here when created."
      />
      <base-pagination
        :page="pagination.page"
        :total="Number(transactionsStore.transactionList.total_count)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; getTransactionList(); }"
      />
    </div>
    <transaction-view
      :open="isViewOpen"
      :transaction="selectedTransaction"
      @close="closeView"
    />
    <transaction-cancel-transaction
      :open="isCancelModalOpen"
      :transaction="transactionToCancel"
      :loading="cancelling"
      @close="closeCancelModal"
      @confirm="handleConfirmCancel"
    />
    <transaction-make-payment-modal
      :open="isPaymentModalOpen"
      :transaction="transactionToPay"
      :payment-methods="paymentMethodOptions"
      @close="closePaymentModal"
      @submitted="handlePaymentSubmitted"
    />
  </div>
</template>
