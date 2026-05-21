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
};

type InfoItem = {
  label: string;
  value: string | undefined;
};

type DetailItem = {
  label: string;
  value: string;
  icon: string;
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
});

const CANCELLATION_STATUS_OPTIONS = [
  { label: "Rejected", value: "rejected" },
  { label: "Requested", value: "requested" },
  { label: "Approved", value: "approved" },
];
const REFUND_RECEIPT_CONFIG = {
  maxFileSize: 1024 * 1024 * 5,
  maxFiles: 1,
  allowedFileTypes: ["image/*", "application/pdf"],
} as const;

const loading = ref(false);
const cancellationDetails = computed(() => financeStore.cancellationDetails);

const customerInformation = computed<InfoItem[]>(() => [
  { label: "Name", value: cancellationDetails.value?.customer?.name },
  { label: "Email", value: cancellationDetails.value?.customer?.email },
  { label: "Phone", value: cancellationDetails.value?.customer?.phoneNumber },
  { label: "Reference ID", value: cancellationDetails.value?.referenceCode },
]);

const cancellationDetails_ = computed<DetailItem[]>(() => {
  const refund = cancellationDetails.value?.refund;
  return [
    { label: "Requested Date", value: formatDate(refund?.requestedAt) || "N/A", icon: ICONS.CALENDAR },
    { label: "Canceled Date", value: formatDate(refund?.cancelledAt) || "N/A", icon: ICONS.CALENDAR },
    { label: "Refunded Date", value: formatDate(refund?.refundedAt) || "N/A", icon: ICONS.CALENDAR },
    { label: "Amount", value: refund?.amount ? `Rs. ${refund.amount}` : "N/A", icon: ICONS.MONEY },
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
          CUSTOMER INFORMATION
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
          <div
            v-for="(detail, index) in cancellationDetails_"
            :key="detail.label"
            class="flex flex-col gap-2 rounded-md border p-3"
            :class="index === 3
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-stone-200 bg-stone-50'"
          >
            <div
              class="flex items-center gap-1 text-xs font-normal"
              :class="index === 3 ? 'text-emerald-600' : 'text-secondary-400'"
            >
              <UIcon :name="detail.icon" class="h-3 w-3" />
              <h3>{{ detail.label }}</h3>
            </div>
            <p
              class="text-sm font-medium"
              :class="index === 3 ? 'text-emerald-600' : 'text-secondary'"
            >
              {{ detail.value }}
            </p>
          </div>
        </div>

        <!-- Refunded By -->
        <div class="flex flex-col gap-3 rounded-md border border-stone-200 bg-stone-50 p-3">
          <div class="flex items-center gap-1 text-xs font-normal text-secondary-400">
            <UIcon :name="ICONS.USER_PEN" class="h-3 w-3" />
            <h3>Refunded By</h3>
          </div>

          <div class="flex items-center gap-2">
            <UAvatar
              v-show="cancellationDetails?.request?.processedBy"
              :src="cancellationDetails?.request?.processedBy"
              :alt="cancellationDetails?.request?.processedBy"
              class="bg-secondary-50"
            />
            <p class="text-sm font-medium">
              {{ cancellationDetails?.request?.processedBy || "N/A" }}
            </p>
          </div>
        </div>

        <!-- Form Fields -->
        <base-select
          v-model="state.status"
          :options="CANCELLATION_STATUS_OPTIONS"
          label="Status"
          name="refundStatus"
          placeholder="Select status"
          :disabled="state.status !== 'requested'"
        />

        <base-file-upload
          v-model="state.refundReceipt"
          accept="image"
          label="Refund Receipt"
          name="refundReceipt"
          :max-file-size="REFUND_RECEIPT_CONFIG.maxFileSize"
          :max-files="REFUND_RECEIPT_CONFIG.maxFiles"
          :allowed-file-types="REFUND_RECEIPT_CONFIG.allowedFileTypes"
        />
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
          :disabled="state.status !== 'requested'"
        >
          Update Cancellation
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
