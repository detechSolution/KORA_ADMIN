<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import z from "zod";

import RefundDetailsSkeleton from "~/components/refunds/refund-details-skeleton.vue";
import { ICONS } from "~/config/icons";
import { useFinanceStore } from "~/stores/finance";
import { formatDate, normalizeText } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  cancellationId: number;
};

type FormState = {
  status: string;
  refundReceipt: File | null;
  refundAmount: string;
  refundNotes: string;
};

type InformationItem = {
  label: string;
  value: string | undefined;
};

type DetailItem = {
  label: string;
  value: string;
  icon: string;
  green?: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "closeAndRefetch"): void;
}>();

const financeStore = useFinanceStore();
const { error: showError, success: showSuccess } = useNotification();

const formRef = ref<InstanceType<typeof UForm> | null>(null);

const state = reactive<FormState>({
  status: "",
  refundReceipt: null,
  refundAmount: "",
  refundNotes: "",
});

const cancellationStatusOptions = [
  { label: "Rejected", value: "rejected" },
  { label: "Requested", value: "requested" },
  { label: "Approved", value: "approved" },
];
const loading = ref(false);
const detailsLoading = ref(true);
const cancellationDetails = computed(() => financeStore.cancellationDetails);
const canUpdateRefund = computed(() => cancellationDetails.value?.refund?.status === "requested");
const isTerminalRefund = computed(() => ["approved", "rejected"].includes(cancellationDetails.value?.refund?.status));
const showAdminActions = computed(() => canUpdateRefund.value || isTerminalRefund.value);
const originalStatus = ref("");
const contentScrollRef = ref<HTMLElement | null>(null);

const schema = z.object({
  status: z.string(),
  refundAmount: z.union([z.string(), z.number()]).optional(),
  refundReceipt: z.any().optional(),
  refundNotes: z.string().optional(),
}).superRefine((form, context) => {
  if (form.status === originalStatus.value) {
    context.addIssue({
      code: "custom",
      message: "Please select a new status before updating this refund.",
      path: ["status"],
    });
  }

  if (form.status === "approved") {
    const amount = String(form.refundAmount ?? "").trim();
    if (!amount || Number(amount) <= 0) {
      context.addIssue({
        code: "custom",
        message: "Please enter a refund amount greater than zero.",
        path: ["refundAmount"],
      });
    }
    if (!form.refundReceipt) {
      context.addIssue({
        code: "custom",
        message: "Please upload the refund receipt.",
        path: ["refundReceipt"],
      });
    }
  }
  else if (form.status === "rejected" && !form.refundNotes?.trim()) {
    context.addIssue({
      code: "custom",
      message: "Please add a note explaining why this refund was rejected.",
      path: ["refundNotes"],
    });
  }
});
const showRefundAmount = computed(() => state.status === "approved");
const showReceiptUpload = computed(() => state.status === "approved");
const showRefundNotes = computed(() => ["approved", "rejected"].includes(state.status));
const receiptUrl = computed(() => {
  const url = cancellationDetails.value?.refund?.receiptUrl;
  return typeof url === "string" ? url.trim() : "";
});

function formatActor(actor?: { name?: string; role?: string } | null): string {
  if (!actor?.name)
    return "N/A";

  const role = actor.role ? normalizeText(actor.role) : "";

  return role ? `${actor.name} (${role})` : actor.name;
}

const customerInformation = computed<InformationItem[]>(() => {
  const details = cancellationDetails.value;
  const customer = details?.customer;
  const item = details?.items;
  return [
    { label: "Client", value: customer?.name || "N/A" },
    { label: "Booking ID", value: item?.referenceCode || "N/A" },
    { label: "Service", value: item?.itemName || "N/A" },
    { label: "Scheduled Date", value: formatDate(item?.scheduleDate) || "N/A" },
  ];
});

const cancellationInformation = computed<DetailItem[]>(() => {
  const details = cancellationDetails.value;
  return [
    { label: "Canceled Date", value: formatDate(details?.refund?.cancelledAt) || "N/A", icon: ICONS.CALENDAR },
    { label: "Canceled By", value: formatActor(details?.request?.requestedBy), icon: ICONS.USER_PEN },
  ];
});

const refundInformation = computed<DetailItem[]>(() => {
  const details = cancellationDetails.value;
  return [
    { label: "Refund Requested", value: formatDate(details?.refund?.requestedAt) || "N/A", icon: ICONS.CALENDAR },
    { label: "Refunded Processed Date", value: formatDate(details?.refund?.refundedAt) || "N/A", icon: ICONS.CALENDAR },
    { label: "Original Amount", value: `NPR ${details?.items?.amount ?? "N/A"}`, icon: ICONS.MONEY },
    { label: "Refunded Amount", value: `NPR ${details?.refund?.amount ?? "N/A"}`, icon: ICONS.MONEY, green: true },
    { label: "Action Taken By", value: formatActor(details?.request?.processedBy), icon: ICONS.USER_PEN },
  ];
});

async function fetchCancellationDetails(): Promise<void> {
  try {
    detailsLoading.value = true;
    await financeStore.fetchCancellationDetails(props.cancellationId);
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to fetch cancellation details") });
  }
  finally {
    detailsLoading.value = false;
  }
}

async function handleUpdate(): Promise<void> {
  if (!props.cancellationId)
    return;

  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("refundStatus", state.status);
    const refundAmount = String(state.refundAmount ?? "").trim();
    if (refundAmount) {
      formData.append("refundAmount", String(Number(refundAmount)));
    }
    const refundNotes = String(state.refundNotes ?? "").trim();
    if (refundNotes) {
      formData.append("note", refundNotes);
    }
    if (state.refundReceipt) {
      formData.append("file", state.refundReceipt);
    }

    await financeStore.updateRefund(props.cancellationId, formData);
    showSuccess({ message: "Refund updated successfully" });
    emit("closeAndRefetch");
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to update cancellation") });
  }
  finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (props.cancellationId) {
    fetchCancellationDetails();
  }
});

watch(cancellationDetails, (details) => {
  if (details?.refund) {
    detailsLoading.value = false;
  }

  if (details?.refund?.status) {
    state.status = details.refund.status;
    originalStatus.value = details.refund.status;
    state.refundAmount = details.refund.amount != null ? String(details.refund.amount) : "";
    state.refundNotes = details.request?.refundNotes || "";
  }
});

watch(() => state.status, async (status, previousStatus) => {
  if (status !== "approved") {
    state.refundReceipt = null;
  }

  if (previousStatus && status !== previousStatus && canUpdateRefund.value) {
    await nextTick();
    contentScrollRef.value?.scrollTo({
      top: contentScrollRef.value.scrollHeight,
      behavior: "smooth",
    });
  }
});
</script>

<template>
  <base-drawer
    :open="open"
    :drawer-width="480"
    title="View Cancellation Details"
    @close="emit('close')"
  >
    <UForm
      ref="formRef"
      :schema="schema"
      :state="state"
      class="flex min-h-0 flex-1 flex-col"
      @submit="handleUpdate"
    >
      <RefundDetailsSkeleton v-if="detailsLoading" />

      <div
        v-else
        ref="contentScrollRef"
        class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5"
      >
        <!-- Customer Information -->
        <h2 class="text-sm font-semibold">
          BOOKING INFORMATION
        </h2>

        <div class="grid w-full grid-cols-[auto_auto] justify-between gap-4">
          <div
            v-for="info in customerInformation"
            :key="info.label"
            class="flex flex-col items-start gap-2"
          >
            <p class="text-xs font-normal text-secondary-400">
              {{ info.label }}
            </p>
            <p class="text-sm font-medium">
              {{ info.value }}
            </p>
          </div>
        </div>

        <USeparator />

        <!-- Cancellation Details -->
        <h2 class="text-sm font-semibold">
          CANCELLATION DETAILS
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <RefundsDetailCard
            v-for="detail in cancellationInformation"
            :key="detail.label"
            :label="detail.label"
            :value="detail.value"
            :icon="detail.icon"
            :green="detail.green"
          />
        </div>
        <USeparator />

        <div class="flex justify-between">
          <h2 class="text-sm font-semibold">
            REFUND DETAILS
          </h2>

          <base-badge :status="cancellationDetails?.refund?.status">
            {{ cancellationDetails?.refund?.status }}
          </base-badge>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <RefundsDetailCard
            v-for="(detail, index) in refundInformation"
            :key="detail.label"
            :class="index === refundInformation.length - 1 ? 'col-span-2' : ''"
            :label="detail.label"
            :value="detail.value"
            :icon="detail.icon"
            :green="detail.green"
          />
        </div>

        <div v-if="receiptUrl && cancellationDetails?.refund?.status === 'approved'" class="flex flex-col gap-3">
          <USeparator />
          <h2 class="text-sm font-semibold">
            REFUND RECEIPT
          </h2>
          <a
            :href="receiptUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="block overflow-hidden rounded-md border border-stone-200 bg-stone-50"
          >
            <img
              :src="receiptUrl"
              alt="Refund receipt"
              class="max-h-72 w-full object-contain"
            >
          </a>
        </div>

        <template v-if="showAdminActions">
          <USeparator />
          <h2 class="text-sm font-semibold">
            ADMIN ACTION
          </h2>

          <!-- Form Fields -->
          <base-select
            v-model="state.status"
            :options="cancellationStatusOptions"
            label="Status"
            name="refundStatus"
            placeholder="Select status"
            :disabled="isTerminalRefund"
          />
          <base-input
            v-if="showRefundAmount"
            v-model="state.refundAmount"
            label="Refund Amount"
            name="refundAmount"
            required
            type="number"
            placeholder="Enter refund amount"
            :disabled="isTerminalRefund"
          />
          <base-file-upload
            v-if="showReceiptUpload && canUpdateRefund"
            v-model="state.refundReceipt"
            accept="image"
            label="Refund Receipt"
            name="refundReceipt"
            required
          />

          <base-input
            v-if="showRefundNotes"
            v-model="state.refundNotes"
            label="Note to Client"
            name="refundNotes"
            required
            type="textarea"
            placeholder="Enter notes for approval or rejection..."
            :disabled="isTerminalRefund"
          />
          <div v-if="showRefundNotes" class="flex -mt-2 justify-between items-start gap-1">
            <UIcon :name="ICONS.INFO" class="text-primary" />
            <p class="text-secondary-300 text-xs">
              This note will be emailed to the client for both approval and rejection updates.
            </p>
          </div>
        </template>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-between border-t border-stone-200 px-5 py-4">
        <base-button
          variant="outline"
          size="md"
          @click="emit('close')"
        >
          Cancel
        </base-button>
        <base-button
          variant="solid"
          size="md"
          type="submit"
          :loading="loading"
          :disabled="!canUpdateRefund"
        >
          Update Cancellation
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
