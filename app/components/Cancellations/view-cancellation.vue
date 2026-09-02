<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

import { ICONS } from "~/config/icons";
import { useFinanceStore } from "~/stores/finance";
import { formatDate } from "~/utils/common";
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
const refundReceiptConfig = {
  maxFileSize: 1024 * 1024 * 5,
  maxFiles: 1,
  allowedFileTypes: ["image/*", "application/pdf"],
} as const;

const loading = ref(false);
const cancellationDetails = computed(() => financeStore.cancellationDetails);
const showRefundAmount = computed(() => state.status === "approved");
const showReceiptUpload = computed(() => state.status === "approved");
const showRefundNotes = computed(() => ["approved", "rejected"].includes(state.status));

const customerInformation = computed<InformationItem[]>(() => {
  const item = cancellationDetails.value?.items;
  return [
    { label: "Client", value: item?.name },
    { label: "Reference ID", value: item?.referenceCode },
  ];
});

const cancellationInformation = computed<DetailItem[]>(() => {
  const details = cancellationDetails.value;
  return [
    { label: "Canceled Date", value: formatDate(details?.refund?.cancelledAt) || "N/A", icon: ICONS.CALENDAR },
    { label: "Canceled By", value: details?.request?.requestedBy || "N/A", icon: ICONS.USER_PEN },
  ];
});

const refundInformation = computed<DetailItem[]>(() => {
  const details = cancellationDetails.value;
  return [
    { label: "Refund Requested", value: formatDate(details?.refund?.requestedAt) || "N/A", icon: ICONS.CALENDAR },
    { label: "Refunded Processed Date", value: formatDate(details?.refund?.refundedAt) || "N/A", icon: ICONS.CALENDAR },
    { label: "Original Amount", value: `NPR ${details?.refund?.amount || "N/A"}`, icon: ICONS.MONEY },
    { label: "Refunded Amount", value: `NPR ${details?.refund?.amount || "N/A"}`, icon: ICONS.MONEY, green: true },
    { label: "Action Taken By", value: details?.request?.processedBy || "N/A", icon: ICONS.USER_PEN },
  ];
});

async function fetchCancellationDetails(): Promise<void> {
  try {
    await financeStore.fetchCancellationDetails(props.cancellationId);
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to fetch cancellation details") });
  }
}

async function handleUpdate(): Promise<void> {
  if (!props.cancellationId)
    return;
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("refundStatus", state.status);
    if (state.refundReceipt) {
      formData.append("file", state.refundReceipt);
    }

    await financeStore.updateRefund(props.cancellationId, formData);
    showSuccess({ message: "Cancellation updated successfully" });
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
  if (details?.refund?.status) {
    state.status = details.refund.status;
  }
});

watch(() => state.status, (status) => {
  if (status !== "approved") {
    state.refundReceipt = null;
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
      :state="state"
      class="flex min-h-0 flex-1 flex-col"
      @submit="handleUpdate"
    >
      <div class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
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
          <CancellationsDetailCard
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
          <CancellationsDetailCard
            v-for="(detail, index) in refundInformation"
            :key="detail.label"
            :class="index === refundInformation.length - 1 ? 'col-span-2' : ''"
            :label="detail.label"
            :value="detail.value"
            :icon="detail.icon"
            :green="detail.green"
          />
        </div>

        <USeparator />
        <h2 class="text-sm font-semibold">
          ADMIN ACTIONS
        </h2>

        <!-- Form Fields -->
        <base-select
          v-model="state.status"
          :options="cancellationStatusOptions"
          label="Status"
          name="refundStatus"
          placeholder="Select status"
          :disabled="cancellationDetails?.refund?.status !== 'requested'"
        />

        <base-input
          v-if="showRefundAmount"
          v-model="state.refundAmount"
          label="Refund Amount"
          name="refundAmount"
          type="number"
          placeholder="Enter refund amount"
        />

        <base-file-upload
          v-if="showReceiptUpload"
          v-model="state.refundReceipt"
          accept="image"
          label="Refund Receipt"
          name="refundReceipt"
          :max-file-size="refundReceiptConfig.maxFileSize"
          :max-files="refundReceiptConfig.maxFiles"
          :allowed-file-types="refundReceiptConfig.allowedFileTypes"
        />

        <img
          v-else-if="cancellationDetails?.refund?.receiptUrl"
          :src="cancellationDetails?.refund?.receiptUrl"
          alt=""
        >

        <base-input
          v-if="showRefundNotes"
          v-model="state.refundNotes"
          label="Note to Client"
          name="refundNotes"
          type="textarea"
          placeholder="Enter notes for approval or rejection..."
        />
        <div v-if="showRefundNotes" class="flex -mt-2 justify-between items-start gap-1">
          <UIcon :name="ICONS.INFO" class="text-primary" />
          <p class="text-secondary-300 text-xs">
            This note will be emailed to the client for both approval and rejection updates.
          </p>
        </div>
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
          :disabled="cancellationDetails?.refund?.status !== 'requested'"
        >
          Update Cancellation
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
