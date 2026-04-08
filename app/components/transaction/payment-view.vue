<script setup lang="ts">
import { computed } from "vue";

import { ICONS } from "~/config/icons";
import { getPaymentStatusConfig } from "~/config/payment-status";
import { formatDate, formatDateTime, formatNumber } from "~/utils/common";

type Props = {
  payment: any;
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const transactionRef = computed(() =>
  props.payment?.transaction_reference_number
  ?? props.payment?.transactionReferenceNumber
  ?? props.payment?.transaction?.reference_number
  ?? "—",
);

const proofUrl = computed(() =>
  props.payment?.payment_proof_url
  ?? props.payment?.payment_proof
  ?? null,
);

function getBilledTo(p: any): string {
  const name = p?.community_name ?? p?.communityName ?? "N/A";
  const code = p?.community_code ?? p?.communityCode ?? "";
  return code ? `${name} - ${code}` : name;
}

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
                  <UIcon :name="ICONS.CREDIT_CARD" class="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-foreground">
                    Payment Details
                  </h2>
                  <p class="text-sm text-muted-foreground">
                    {{ transactionRef }}
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
              <template v-if="payment">
                <div class="p-6 space-y-6">
                  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                    <div class="flex flex-col gap-1">
                      <span class="text-xs font-medium text-muted-foreground uppercase">Payment Date</span>
                      <span class="text-sm font-medium">{{ payment.payment_date ? formatDate(payment.payment_date) : "—" }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-xs font-medium text-muted-foreground uppercase">Status</span>
                      <base-badge
                        v-if="payment?.status"
                        :color="getPaymentStatusConfig(payment.status).color"
                      >
                        {{ getPaymentStatusConfig(payment.status).label }}
                      </base-badge>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-xs font-medium text-muted-foreground uppercase">Amount</span>
                      <span class="text-sm font-medium text-primary">
                        {{ payment?.amount ? formatNumber(payment.amount) : "—" }}
                      </span>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Bill To
                    </h3>
                    <div class="bg-muted/30 rounded-lg p-4 border border-border">
                      <p class="text-sm font-medium text-foreground">
                        {{ getBilledTo(payment) }}
                      </p>
                      <p class="text-xs text-muted-foreground mt-1">
                        Address: {{ payment.community_address ?? "N/A" }}
                      </p>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Payment Method
                    </h3>
                    <div class="bg-muted/30 rounded-lg p-4 border border-border space-y-2">
                      <p class="text-sm font-medium text-foreground">
                        {{ payment.payment_method_name ?? "N/A" }}
                      </p>
                      <p class="text-xs text-muted-foreground">
                        Reference: {{ payment.payment_reference ?? "N/A" }}
                      </p>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Payment Proof
                    </h3>
                    <div class="bg-muted/30 rounded-lg p-4 border border-border">
                      <template v-if="proofUrl">
                        <div class="rounded-md border border-border bg-background/40 p-2">
                          <img
                            :src="proofUrl"
                            alt="Payment proof"
                            class="w-full max-h-64 object-contain rounded-sm"
                            loading="lazy"
                          >
                        </div>
                        <div class="mt-3 flex flex-wrap gap-3 text-sm">
                          <a
                            :href="proofUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-primary underline hover:no-underline"
                          >
                            View Proof
                          </a>
                        </div>
                      </template>
                      <p v-else class="text-xs text-muted-foreground">
                        No proof uploaded
                      </p>
                    </div>
                  </div>

                  <div class="space-y-2 pt-2">
                    <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Remarks
                    </h3>
                    <p class="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border">
                      {{ payment.remarks ?? "N/A" }}
                    </p>
                  </div>

                  <div class="pt-4 border-t border-border text-xs text-muted-foreground">
                    Created: {{ payment.created_at ? formatDateTime(payment.created_at) : "—" }}
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
