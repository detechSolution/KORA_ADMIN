<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import * as z from "zod";

import type { CouponType } from "~/stores/coupons";

import { useNotification } from "~/composables/use-notification";
import { useCouponsStore } from "~/stores/coupons";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created"): void;
}>();

const couponsStore = useCouponsStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const couponTypeOptions = [
  { label: "Percentage (%)", value: "PERCENT" as CouponType },
  { label: "Fixed Amount", value: "AMOUNT" as CouponType },
];

const schema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required")
    .max(50, "Coupon code cannot exceed 50 characters")
    .regex(/^[\w-]+$/, "Coupon code can only contain letters, numbers, hyphens, and underscores"),
  coupon_type: z.string().min(1, "Coupon type is required"),
  discount_value: z
    .number({ message: "Discount value is required" })
    .min(0, "Discount value must be at least 0"),
  redemption_limit: z
    .number({ message: "Redemption limit is required" })
    .int({ message: "Redemption limit must be a whole number" })
    .positive("Redemption limit must be greater than 0"),
  expires_at: z.string().min(1, "Expiration date is required"),
}).superRefine((data, ctx) => {
  if (data.expires_at && new Date(data.expires_at) < new Date(Date.now())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Expiration date must be in the future",
      path: ["expires_at"],
    });
  }
  if (data.coupon_type === "PERCENT" && data.discount_value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100",
      path: ["discount_value"],
    });
  }
  if (data.coupon_type === "AMOUNT" && data.discount_value <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount discount must be greater than 0",
      path: ["discount_value"],
    });
  }
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  code: "",
  coupon_type: "PERCENT",
  discount_value: undefined,
  redemption_limit: undefined,
  expires_at: "",
});

const discountValueLabel = computed(() =>
  state.coupon_type === "PERCENT" ? "Discount Percentage (%)" : "Discount Amount",
);
const discountValuePlaceholder = computed(() =>
  state.coupon_type === "PERCENT" ? "e.g. 20" : "e.g. 50",
);

function dateToExpiresAt(dateStr: string): string {
  if (!dateStr)
    return "";
  return `${dateStr}T23:59:59.000Z`;
}

async function handleCreateCoupon(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    await couponsStore.createCoupon({
      code: state.code!,
      coupon_type: state.coupon_type! as CouponType,
      discount_value: state.discount_value!,
      redemption_limit: state.redemption_limit!,
      expires_at: dateToExpiresAt(state.expires_at!),
    });
    success({ message: "Coupon created successfully" });
    clearFormData();
    emit("created");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create coupon. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

function clearFormData(): void {
  state.code = "";
  state.coupon_type = "PERCENT";
  state.discount_value = undefined;
  state.redemption_limit = undefined;
  state.expires_at = "";
}

function handleClose(): void {
  emit("close");
  clearFormData();
}
</script>

<template>
  <base-modal
    :open="props.open"
    title="Create Coupon"
    description="Create a new discount coupon code."
    :modal-width="700"
    dismissible
    @close="handleClose"
  >
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex flex-col gap-4"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <base-input
          v-model="state.code"
          name="code"
          label="Coupon Code"
          placeholder="e.g. SAVE20"
          required
        >
          <template #description>
            Letters, numbers, hyphens, and underscores only (max 50 chars)
          </template>
        </base-input>
        <base-select
          v-model="state.coupon_type"
          name="coupon_type"
          label="Discount Type"
          placeholder="Select discount type"
          :options="couponTypeOptions"
          required
        />
        <base-input
          v-model.number="state.discount_value"
          :name="state.coupon_type === 'PERCENT' ? 'discount_value_percent' : 'discount_value_amount'"
          :label="discountValueLabel"
          :placeholder="discountValuePlaceholder"
          type="number"
          :min="state.coupon_type === 'PERCENT' ? 0 : 0.01"
          :max="state.coupon_type === 'PERCENT' ? 100 : undefined"
          step="any"
          required
        >
          <template #description>
            {{ state.coupon_type === 'PERCENT' ? 'Enter a value between 0 and 100' : 'Enter the fixed discount amount' }}
          </template>
        </base-input>
        <base-input
          v-model.number="state.redemption_limit"
          name="redemption_limit"
          label="Redemption Limit"
          placeholder="e.g. 100"
          type="number"
          min="1"
          required
        >
          <template #description>
            Maximum number of times this coupon can be used
          </template>
        </base-input>
        <base-date-picker
          v-model="state.expires_at"
          name="expires_at"
          label="Expires At"
          placeholder="Select expiration date"
          :no-of-months="1"
          required
        >
          <template #description>
            Date when the coupon expires
          </template>
        </base-date-picker>
      </div>

      <div class="flex justify-end gap-2">
        <base-button
          variant="outline"
          @click="handleClose"
        >
          Cancel
        </base-button>
        <base-button
          type="submit"
          :loading="loading"
          @click="handleCreateCoupon"
        >
          Create Coupon
        </base-button>
      </div>
    </UForm>
  </base-modal>
</template>
