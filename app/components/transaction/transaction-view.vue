<script setup lang="ts">
import { ref, watch } from "vue";

import { ICONS } from "~/config/icons";
import { getTransactionStatusConfig } from "~/config/transaction-status";
import { useTransactionsStore } from "~/stores/transaction";
import { formatDate, formatDateTime, formatNumber } from "~/utils/common";

type Props = {
  transaction: any;
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const transactionsStore = useTransactionsStore();
const items = ref<any[]>([]);
const loadingItems = ref(false);

watch(
  () => [props.open, props.transaction?.id] as const,
  async ([open, transactionId]) => {
    if (open && transactionId) {
      loadingItems.value = true;
      items.value = [];
      try {
        items.value = await transactionsStore.getTransactionItems(transactionId);
      }
      catch {
        items.value = [];
      }
      finally {
        loadingItems.value = false;
      }
    }
    else {
      items.value = [];
    }
  },
  { immediate: true },
);

function getBilledTo(t: any): string {
  const c = t?.community;
  const name = c?.communityName ?? c?.community_name ?? t?.community_name ?? "N/A";
  const code = c?.communityCode ?? c?.community_code ?? t?.community_code ?? "";
  return code ? `${name} - ${code}` : name;
}

function getCommunityAddress(t: any): string {
  const c = t?.community;
  return c?.communityAddress ?? c?.community_address ?? t?.community_address ?? "N/A";
}

const itemColumns = [
  {
    accessorKey: "description",
    header: "Item",
    cell: ({ row }: { row: any }) => row.original.description ?? row.original.plan_name ?? "—",
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }: { row: any }) => row.original.quantity ?? 1,
  },
  {
    accessorKey: "unit_price",
    header: "Rate",
    cell: ({ row }: { row: any }) => formatNumber(row.original.unit_price ?? 0),
  },
  {
    accessorKey: "line_total",
    header: "Amount",
    cell: ({ row }: { row: any }) => formatNumber(row.original.line_total ?? 0),
  },
];

function handleClose(): void {
  emit("close");
}

function handleBackdropClick(): void {
  handleClose();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slideover">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex justify-end"
        aria-modal="true"
        role="dialog"
      >
        <div
          class="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
          aria-hidden="true"
          @click="handleBackdropClick"
        />
        <div
          class="slideover-panel relative flex h-full w-full max-w-2xl flex-col bg-card shadow-xl"
          @click.stop
        >
          <div class="flex flex-col h-full overflow-hidden">
            <div class="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <UIcon :name="ICONS.BILLING" class="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-foreground">
                    Transaction Details
                  </h2>
                  <p class="text-sm text-muted-foreground">
                    {{ transaction?.reference_number ?? "—" }}
                  </p>
                </div>
              </div>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                class="-mr-2"
                aria-label="Close"
                @click="handleClose"
              />
            </div>

            <div class="flex-1 overflow-y-auto">
              <template v-if="transaction">
                <div class="p-6 space-y-6">
                  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                    <div class="flex flex-col gap-1">
                      <span class="text-xs font-medium text-muted-foreground uppercase">Transaction Date</span>
                      <span class="text-sm font-medium">{{ formatDate(transaction.reference_date) || "—" }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-xs font-medium text-muted-foreground uppercase">Due Date</span>
                      <span class="text-sm font-medium">{{ formatDate(transaction.due_date) || "—" }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-xs font-medium text-muted-foreground uppercase">Status</span>
                      <base-badge
                        v-if="transaction?.status"
                        :color="getTransactionStatusConfig(transaction.status).color"
                      >
                        {{ getTransactionStatusConfig(transaction.status).label }}
                      </base-badge>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Bill To
                    </h3>
                    <div class="bg-muted/30 rounded-lg p-4 border border-border">
                      <p class="text-sm font-medium text-foreground">
                        {{ getBilledTo(transaction) }}
                      </p>
                      <p class="text-xs text-muted-foreground mt-1">
                        Address: {{ getCommunityAddress(transaction) }}
                      </p>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Items
                    </h3>
                    <div class="rounded-lg overflow-hidden">
                      <base-table
                        :data="items"
                        :columns="itemColumns"
                        :loading="loadingItems"
                        :skeleton-rows="1"
                        empty-title="No items"
                        empty-description="This transaction has no line items."
                      />
                    </div>
                  </div>

                  <div class="border border-border rounded-lg p-6 bg-muted/20 space-y-3">
                    <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Summary
                    </h3>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Subtotal</span>
                      <span class="font-medium">{{ formatNumber(transaction.subtotal) }}</span>
                    </div>
                    <div v-if="transaction.discount_total" class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Discount</span>
                      <span class="font-medium">{{ formatNumber(transaction.discount_total) }}</span>
                    </div>
                    <div v-if="transaction.tax_total" class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Tax</span>
                      <span class="font-medium">{{ formatNumber(transaction.tax_total) }}</span>
                    </div>
                    <div class="flex justify-between text-base font-bold pt-3 border-t border-border">
                      <span>Total (NPR)</span>
                      <span class="text-primary">{{ formatNumber(transaction.total_amount) }}</span>
                    </div>
                  </div>

                  <div v-if="transaction.remarks" class="space-y-2 pt-2">
                    <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Remarks
                    </h3>
                    <p class="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border">
                      {{ transaction.remarks }}
                    </p>
                  </div>

                  <div class="pt-4 border-t border-border text-xs text-muted-foreground">
                    Created: {{ transaction.created_at ? formatDateTime(transaction.created_at) : "—" }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
