<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import type { PromoCode, UpdatePromoCodePayload } from "~/types/promo-code";

import { useNotification } from "~/composables/use-notification";
import { usePromoCodeStore } from "~/stores/promo-code";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  promoCode: PromoCode | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const promoCodeStore = usePromoCodeStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const discountTypeOptions = [
  { label: "Percentage", value: "percent" },
  { label: "Fixed Amount", value: "fixed" },
];

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.string().min(1, "Discount type is required"),
  discountValue: z.preprocess(
    value => Number(value),
    z.number().positive("Discount value is required"),
  ),
  redemptionLimit: z.preprocess(
    value => Number(value),
    z.number().int().positive("Redemption limit is required"),
  ),
  expiresAt: z.string().min(1, "Expiry date is required"),
  isActive: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.discountType === "percent" && data.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100",
      path: ["discountValue"],
    });
  }
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  code: "",
  discountType: "fixed",
  discountValue: undefined,
  redemptionLimit: undefined,
  expiresAt: "",
  isActive: true,
});

const discountValueLabel = computed(() =>
  state.discountType === "percent"
    ? "Discount Percentage (%)*"
    : "Discount Amount (Rs)*",
);

function populateForm(promoCode: PromoCode | null): void {
  state.code = promoCode?.code ?? "";
  state.discountType = promoCode?.discountType ?? "fixed";
  state.discountValue = promoCode?.discountValue ?? undefined;
  state.redemptionLimit = promoCode?.redemptionLimit ?? undefined;
  state.expiresAt = promoCode?.expiresAt ? promoCode.expiresAt.slice(0, 10) : "";
  state.isActive = promoCode?.isActive ?? true;
}

function closeDrawer(): void {
  emit("close");
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  if (!props.promoCode?.id) {
    showError({ message: "Invalid promo code selected." });
    return;
  }

  try {
    loading.value = true;

    await promoCodeStore.updatePromoCode(
      Number(props.promoCode.id),
      {
        code: state.code!,
        discountType: state.discountType!,
        discountValue: Number(state.discountValue),
        redemptionLimit: Number(state.redemptionLimit),
        expiresAt: state.expiresAt!,
        isActive: state.isActive!,
      } as UpdatePromoCodePayload,
    );
    success({ message: "Promo code updated successfully" });
    emit("updated");
    closeDrawer();
  }
  catch (error: unknown) {
    showError({
      message: getApiErrorMessage(error, "Failed to update promo code."),
    });
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.promoCode] as const,
  ([open]) => {
    if (open) {
      populateForm(props.promoCode);
    }
  },
  { immediate: true },
);
</script>

<template>
  <base-drawer
    :open="open"
    :drawer-width="480"
    @close="emit('close')"
  >
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex-1 overflow-y-auto px-5 py-5">
        <div class="grid gap-5">
          <base-input
            v-model="state.code"
            name="code"
            label="Code Name*"
            placeholder="Enter code name"
          />

          <base-select
            v-model="state.discountType"
            name="discountType"
            label="Discount Type*"
            placeholder="Select discount type"
            :options="discountTypeOptions"
          />

          <base-input
            v-model.number="state.discountValue"
            name="discountValue"
            :label="discountValueLabel"
            :placeholder="state.discountType === 'percent' ? 'Enter discount percentage' : 'Enter discount amount'"
            type="number"
          />

          <base-input
            v-model.number="state.redemptionLimit"
            name="redemptionLimit"
            label="Redemption Limit*"
            placeholder="Enter redemption limit"
            type="number"
          />

          <base-date-picker
            v-model="state.expiresAt"
            name="expiresAt"
            label="Expires At*"
            placeholder="Select expiry date"
            :no-of-months="1"
          />

          <base-switch
            v-model="state.isActive"
            name="isActive"
            label="Status"
            on-label="Active"
            off-label="Inactive"
          />
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-stone-200 px-5 py-4">
        <base-button
          variant="outline"
          size="md"
          @click="closeDrawer"
        >
          Cancel
        </base-button>

        <base-button
          variant="solid"
          size="md"
          :loading="loading"
          @click="handleSubmit"
        >
          Update Promo Code
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
