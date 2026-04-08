<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import type { CouponType } from "~/stores/coupons";

import { useNotification } from "~/composables/use-notification";
import { usePermission } from "~/composables/use-permission";
import { PERMISSIONS_CONFIGURATION } from "~/config/permissions";
import { useCouponsStore } from "~/stores/coupons";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  coupon: any;
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const couponsStore = useCouponsStore();
const { can } = usePermission();
const { success, error: showError } = useNotification();

const updating = ref(false);
const statusOnlyMode = computed(() => props.coupon?.redeemed_count > 0);

const couponTypeOptions = [
  { label: "Percentage (%)", value: "PERCENT" as CouponType },
  { label: "Fixed Amount", value: "AMOUNT" as CouponType },
];

const schema = z.object({
  coupon_type: z.string().min(1, "Coupon type is required"),
  discount_value: z
    .number({ message: "Discount value is required" })
    .min(0, "Discount value must be at least 0"),
  redemption_limit: z
    .number({ message: "Redemption limit is required" })
    .int({ message: "Redemption limit must be a whole number" })
    .positive("Redemption limit must be greater than 0"),
  expires_at: z.string().min(1, "Expiration date is required"),
  is_active: z.boolean({ message: "Status must be enabled or disabled" }),
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
  coupon_type: undefined,
  discount_value: undefined,
  redemption_limit: undefined,
  expires_at: undefined,
  is_active: undefined,
});

const discountValueLabel = computed(() =>
  state.coupon_type === "PERCENT" ? "Discount Percentage (%)" : "Discount Amount",
);

const formRef = ref<InstanceType<typeof UForm> | null>(null);

function datetimeToDateStr(datetime: string | undefined): string | undefined {
  if (!datetime)
    return undefined;
  const date = new Date(datetime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateToExpiresAt(dateStr: string): string {
  if (!dateStr)
    return "";
  return `${dateStr}T23:59:59.000Z`;
}

watch(
  () => props.coupon,
  (newCoupon) => {
    if (newCoupon) {
      state.coupon_type = newCoupon.coupon_type;
      state.discount_value = Number(newCoupon.discount_value);
      state.redemption_limit = newCoupon.redemption_limit;
      state.expires_at = datetimeToDateStr(newCoupon.expires_at);
      state.is_active = newCoupon.is_active;
    }
  },
  { immediate: true },
);

async function handleUpdate(): Promise<void> {
  try {
    updating.value = true;

    try {
      await formRef.value?.validate();
    }
    catch {
      updating.value = false;
      return;
    }

    const couponId = props.coupon.coupon_id ?? props.coupon.id;
    await couponsStore.updateCoupon({
      coupon_id: couponId,
      coupon_type: state.coupon_type! as CouponType,
      discount_value: state.discount_value!,
      redemption_limit: state.redemption_limit!,
      expires_at: dateToExpiresAt(state.expires_at!),
      is_active: state.is_active!,
    });
    success({ message: "Coupon updated successfully" });
    emit("updated");
  }
  catch (err: unknown) {
    showError({ message: getApiErrorMessage(err, "Failed to update coupon") });
  }
  finally {
    updating.value = false;
  }
}
</script>

<template>
  <base-modal
    :open="open"
    title="Coupon Details"
    description="View and update coupon information"
    :modal-width="700"
    dismissible
    @close="emit('close')"
  >
    <div class="flex flex-col gap-4">
      <UForm
        ref="formRef"
        :state="state"
        :schema="schema"
        :validate-on="['input', 'change', 'blur']"
        class="space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <base-select
            v-model="state.coupon_type"
            name="coupon_type"
            label="Discount Type"
            placeholder="Select discount type"
            :options="couponTypeOptions"
            :disabled="statusOnlyMode"
          />
          <base-input
            v-model.number="state.discount_value"
            :name="state.coupon_type === 'PERCENT' ? 'discount_value_percent' : 'discount_value_amount'"
            :label="discountValueLabel"
            :placeholder="state.coupon_type === 'PERCENT' ? 'e.g. 20' : 'e.g. 50'"
            type="number"
            :min="state.coupon_type === 'PERCENT' ? 0 : 0.01"
            :max="state.coupon_type === 'PERCENT' ? 100 : undefined"
            step="any"
            :disabled="statusOnlyMode"
          />
          <base-input
            v-model.number="state.redemption_limit"
            name="redemption_limit"
            label="Redemption Limit"
            placeholder="e.g. 100"
            type="number"
            min="1"
            :disabled="statusOnlyMode"
          />
          <base-date-picker
            v-model="state.expires_at"
            name="expires_at"
            label="Expires At"
            placeholder="Select expiration date"
            :no-of-months="1"
            :disabled="statusOnlyMode"
          />
          <div class="md:col-span-2">
            <base-switch
              v-model="state.is_active"
              name="is_active"
              label="Status"
              on-label="Active"
              off-label="Inactive"
              :disabled="statusOnlyMode"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <base-button
            variant="outline"
            @click="emit('close')"
          >
            Cancel
          </base-button>
          <base-button
            v-if="can(PERMISSIONS_CONFIGURATION.COUPONS_UPDATE)"
            :disabled="statusOnlyMode"
            type="submit"
            :loading="updating"
            @click="handleUpdate"
          >
            Update Coupon
          </base-button>
        </div>
      </UForm>
    </div>
  </base-modal>
</template>
