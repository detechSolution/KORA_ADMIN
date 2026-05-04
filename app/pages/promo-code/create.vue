<script setup lang="ts">
import { reactive, ref } from "vue";
import z from "zod";

import type { CreatePromoCodePayload } from "~/types/promo-code";

import { ICONS } from "~/config/icons";
import { usePromoCodeStore } from "~/stores/promo-code";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  layout: "dashboard",
  auth: true,
  permission: "administration.admins.create",
});

const discountTypeOptions = [
  { label: "Percentage", value: "percent" },
  { label: "Fixed Amount", value: "fixed" },
];

const promoCodeStore = usePromoCodeStore();
const { success, error: showError } = useNotification();
const router = useRouter();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.string().min(1, "Discount type is required"),

  discountValue: z.number({
    message: "Discount value is required",
  }),

  redemptionLimit: z.number({
    message: "Redemption limit is required",
  }).min(1, "Redemption limit must be greater than or equal to 1"),

  expiresAt: z.string().min(1, "Expire Date is required"),
})
  .superRefine((data, ctx) => {
    const { discountType, discountValue } = data;

    if (discountType === "percent") {
      if (discountValue < 0 || discountValue > 100) {
        ctx.addIssue({
          path: ["discountValue"],
          code: z.ZodIssueCode.custom,
          message: "Percentage must be between 0 and 100",
        });
      }
    }
    else {
      if (discountValue <= 0) {
        ctx.addIssue({
          path: ["discountValue"],
          code: z.ZodIssueCode.custom,
          message: "Discount Amount must be greater than 0",
        });
      }
    }
  });

type createPromoCodeSchema = z.output<typeof schema>;

const state = reactive<Partial<createPromoCodeSchema>>({
  code: "",
  discountType: "percent",
  discountValue: undefined,
  redemptionLimit: undefined,
  expiresAt: "",
});

function clearApiError(): void {
  apiError.value = null;
}

async function handleCreatePromoCode() {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    clearApiError();
    const payload = {
      code: state.code,
      discountType: state.discountType,
      discountValue: Number(state.discountValue),
      redemptionLimit: Number(state.redemptionLimit),
      expiresAt: state.expiresAt,
      isActive: true,
    };
    await promoCodeStore.CreatePromoCode(payload as CreatePromoCodePayload);
    success({ message: "Promo code created successfully" });

    // Reset form
    state.code = "";
    state.discountType = "percent";
    state.discountValue = undefined;
    state.redemptionLimit = undefined;
    state.expiresAt = "";

    router.push({ name: "promo-code-list" });
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create promo code. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Create Promo Code
      </template>
      <template #description>
        Create a new promo code
      </template>

      <template #actions>
        <NuxtLink to="/promo-code/list">
          <base-button
            variant="outline"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            Back to list
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
      <div class="bg-stone-50 rounded-lg p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <UIcon :name="ICONS.INFO" class="text-primary" />
          <h3 class="text-sm text-secondary font-medium">
            Code info
          </h3>
        </div>
        <p class="text-secondary-500 text-xs">
          Enter the promo code type, limit and expiry date
        </p>
      </div>

      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        :validate-on="['input', 'change', 'blur']"
      >
        <div class="bg-white flex flex-col gap-5 shadow-md rounded-lg p-4">
          <div class="flex flex-col gap-4 w-full">
            <div class="flex flex-col md:flex-row w-full gap-4 justify-between">
              <div class="w-full">
                <base-input
                  v-model="state.code"
                  name="code"
                  label="Code Name*"
                  placeholder="Enter admin name"
                />
              </div>
              <div class="w-full">
                <base-select
                  v-model="state.discountType"
                  name="discountType"
                  label="Discount Type*"
                  placeholder="Enter admin name"
                  :options="discountTypeOptions"
                />
              </div>
            </div>
            <div class="flex flex-col md:flex-row w-full gap-4 justify-between">
              <div class="w-full">
                <base-input
                  v-if="state.discountType === 'percent'"
                  v-model="state.discountValue"
                  name="discountValue"
                  label="Discount Percentage (%)*"
                  placeholder="Enter discount percentage"
                  type="number"
                />
                <base-input
                  v-else
                  v-model="state.discountValue"
                  name="discountValue"
                  label="Discount Amount (Rs)*"
                  placeholder="Enter discount amount"
                  type="number"
                />
              </div>

              <div class="w-full">
                <base-input
                  v-model="state.redemptionLimit"
                  name="redemptionLimit"
                  label="Redemption Limit*"
                  placeholder="Enter redemption limit"
                  type="number"
                />
              </div>
            </div>
            <div class="w-full md:w-1/2">
              <base-date-picker
                v-model="state.expiresAt"
                name="expiresAt"
                label="Expires At*"
                placeholder="Select expiry date"
                :no-of-months="1"
              />
            </div>

            <div class="flex justify-end">
              <base-button
                variant="solid"
                :loading="loading"
                @click="handleCreatePromoCode"
              >
                Create Promo Code
              </base-button>
            </div>
          </div>
        </div>
      </UForm>
    </div>
  </div>
</template>

<style>

</style>
