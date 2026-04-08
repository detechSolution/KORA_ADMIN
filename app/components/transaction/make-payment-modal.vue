<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useTransactionsStore } from "~/stores/transaction";
import { formatNumber } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  transaction: any;
  paymentMethods: any[];
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submitted"): void;
}>();

const transactionsStore = useTransactionsStore();
const { success, error: showError } = useNotification();

const formRef = ref<InstanceType<typeof UForm> | null>(null);
const submitting = ref(false);
const paymentProofFile = ref<File | null>(null);
const paymentProofPreview = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const schema = z.object({
  amount: z.number({ message: "Amount is required" }).min(0.01, "Amount must be greater than 0").nullable().refine(v => v != null, "Amount is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethodId: z.number({ message: "Payment method is required" }).min(1, "Payment method is required").nullable().refine(v => v != null, "Payment method is required"),
  paymentReference: z.string().max(255, "Payment reference cannot exceed 255 characters").optional(),
  remarks: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  amount: null as number | null,
  paymentDate: "",
  paymentMethodId: null as number | null,
  paymentReference: "",
  remarks: "",
});

watch(
  () => [props.open, props.transaction] as const,
  ([open, transaction]) => {
    if (open && transaction) {
      state.amount = null;
      state.paymentDate = "";
      state.paymentMethodId = null;
      state.paymentReference = "";
      state.remarks = "";
      paymentProofFile.value = null;
      paymentProofPreview.value = null;
      if (fileInputRef.value)
        fileInputRef.value.value = "";
    }
  },
  { immediate: true },
);

function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file)
    return;
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    showError({ message: "Please upload a valid image (JPEG, PNG, or PDF)" });
    input.value = "";
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showError({ message: "Image must be less than 5MB" });
    input.value = "";
    return;
  }
  paymentProofFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    paymentProofPreview.value = (e.target?.result as string) ?? null;
  };
  reader.readAsDataURL(file);
}

function handleRemoveFile(): void {
  paymentProofFile.value = null;
  paymentProofPreview.value = null;
  if (fileInputRef.value)
    fileInputRef.value.value = "";
}

function triggerFileInput(): void {
  fileInputRef.value?.click();
}

function getBilledTo(t: any): string {
  const c = t?.community;
  const name = c?.communityName ?? c?.community_name ?? t?.community_name ?? "N/A";
  const code = c?.communityCode ?? c?.community_code ?? t?.community_code ?? "";
  return code ? `${name} - ${code}` : name;
}

async function handleSubmit(): Promise<void> {
  if (!props.transaction?.id) {
    showError({ message: "Transaction not found" });
    return;
  }
  try {
    submitting.value = true;
    const payload = {
      transaction_id: Number(props.transaction.id),
      payment_method_id: Number(state.paymentMethodId),
      amount: Number(state.amount),
      payment_date: state.paymentDate!,
      payment_reference: state.paymentReference?.trim() || undefined,
      payment_proof_file: paymentProofFile.value ?? undefined,
      remarks: state.remarks?.trim() || "",
    };
    await transactionsStore.makeTransactionPayment(payload as any);
    success({ message: "Payment recorded successfully" });
    handleClose();
    emit("submitted");
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Failed to record payment") });
  }
  finally {
    submitting.value = false;
  }
}

async function validateForm(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {

  }
}

function handleClose(): void {
  emit("close");
  state.amount = null;
  state.paymentDate = "";
  state.paymentMethodId = null;
  state.paymentReference = "";
  state.remarks = "";
  paymentProofFile.value = null;
  paymentProofPreview.value = null;
  if (fileInputRef.value)
    fileInputRef.value.value = "";
}
</script>

<template>
  <base-modal
    :open="open"
    title="Record Payment"
    description="Record a payment for this transaction"
    :modal-width="600"
    dismissible
    @close="handleClose"
  >
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex flex-col gap-4"
      @submit.prevent="handleSubmit"
    >
      <div v-if="transaction" class="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm text-muted-foreground">Ref #</span>
          <span class="text-sm font-medium text-foreground">{{ transaction.reference_number ?? "—" }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-muted-foreground">Billed To</span>
          <span class="text-sm font-medium text-foreground">{{ getBilledTo(transaction) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-muted-foreground">Total Amount</span>
          <span class="text-sm font-medium text-foreground">
            {{ formatNumber(transaction.total_amount ?? transaction.totalAmount ?? 0) }}
          </span>
        </div>
      </div>

      <base-input
        v-model.number="state.amount"
        name="amount"
        label="Payment Amount"
        placeholder="Enter amount"
        type="number"
        min="0"
        step="0.01"
        required
      />

      <base-date-picker
        v-model="state.paymentDate"
        name="paymentDate"
        label="Payment Date"
        placeholder="Select payment date"
        :no-of-months="1"
        required
        @update:model-value="validateForm"
      />

      <base-select
        v-model="state.paymentMethodId"
        name="paymentMethodId"
        label="Payment Method"
        placeholder="Select payment method"
        :options="paymentMethods"
        required
      />

      <base-input
        v-model="state.paymentReference"
        name="paymentReference"
        label="Payment Reference (Optional)"
        placeholder="e.g. cheque no., transaction ID"
        maxlength="255"
      />

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-foreground">
          Payment Proof (Optional)
        </label>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          class="hidden"
          @change="handleFileSelect"
        >
        <div
          v-if="!paymentProofPreview"
          class="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
          @click="triggerFileInput"
        >
          <UIcon :name="ICONS.UPLOAD" class="w-8 h-8 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">Click to upload or drag image, files</span>
          <span class="text-xs text-muted-foreground">JPEG, PNG, PDF, WebP (max 5MB)</span>
        </div>
        <div
          v-else
          class="relative rounded-lg border border-border overflow-hidden bg-muted/20"
        >
          <img
            :src="paymentProofPreview"
            alt="Payment proof preview"
            class="w-full h-40 object-contain"
          >
          <div class="flex gap-2 p-2 bg-muted/50">
            <base-button
              type="button"
              variant="outline"
              size="sm"
              :leading-icon="ICONS.UPLOAD"
              @click="triggerFileInput"
            >
              Replace
            </base-button>
            <base-button
              type="button"
              variant="ghost"
              size="sm"
              color="neutral"
              :leading-icon="ICONS.X"
              @click="handleRemoveFile"
            >
              Remove
            </base-button>
          </div>
        </div>
      </div>

      <base-input
        v-model="state.remarks"
        name="remarks"
        label="Remarks (Optional)"
        placeholder="Add any notes"
        type="textarea"
        :rows="2"
      />

      <div class="flex justify-end gap-2">
        <base-button variant="outline" @click="handleClose">
          Cancel
        </base-button>
        <base-button type="submit" :loading="submitting">
          Record Payment
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
