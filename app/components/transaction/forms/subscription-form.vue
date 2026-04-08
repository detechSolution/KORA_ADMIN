<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import type { CouponType } from "~/stores/coupons";

import { useNotification } from "~/composables/use-notification";
import { useCommunitiesStore } from "~/stores/communities";
import { useCouponsStore } from "~/stores/coupons";
import { useTransactionsStore } from "~/stores/transaction";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  communityOptions?: Array<{ label: string; value: string }>;
};

const props = withDefaults(defineProps<Props>(), {
  communityOptions: () => [],
});

const emit = defineEmits<{
  cancel: [];
}>();

const communitiesStore = useCommunitiesStore();

const couponsStore = useCouponsStore();
const transactionsStore = useTransactionsStore();
const { success, error: showError } = useNotification();

const formRef = ref<InstanceType<typeof UForm> | null>(null);

const loading = ref(false);
const applyingCoupon = ref(false);
const loadingPlan = ref(false);
const communityPlanOptions = ref<Array<{ label: string; value: string; planData?: any }>>([]);

const itemSchema = z.object({
  description: z.string().min(1, "Please select a plan"),
});

const schema = z.object({
  communityId: z.number({ message: "Please select a community" }).min(1, "Please select a community"),
  referenceDate: z.string().min(1, "Bill date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  remarks: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one plan is required"),
  discount: z.number({ message: "Discount must be a number" }).min(0, "Discount cannot be negative").optional(),
  taxType: z.string().optional(),
  couponCode: z.string().max(100, "Coupon code cannot exceed 100 characters").optional(),
}).refine((data) => {
  if (!data.referenceDate || !data.dueDate)
    return true;
  const referenceDate = new Date(data.referenceDate);
  const dueDate = new Date(data.dueDate);
  return dueDate >= referenceDate;
}, {
  message: "Due date must be equal to or greater than bill date",
  path: ["dueDate"],
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  communityId: "",
  referenceDate: "",
  dueDate: "",
  remarks: "",
  items: [],
  discount: 0,
  taxType: "no-tax",
  couponCode: "",
});

const discountType = ref<CouponType | null>(null);
const couponId = ref<number | null>(null);

const invoiceItems = ref([
  {
    id: 1,
    item_type: "SUBSCRIPTION",
    description: "",
    quantity: 1,
    unit_price: 0,
    line_total: 0,
  },
]);

const taxOptions = [
  { label: "No Tax", value: "no-tax" },
  { label: "VAT 13%", value: "vat-13" },
];

const subtotal = computed(() => {
  return invoiceItems.value.reduce((sum, item) => sum + (item.line_total || 0), 0);
});

const discountAmount = computed(() => {
  const value = state.discount || 0;
  if (!value)
    return 0;

  // Percentage discount
  if (discountType.value === "PERCENT") {
    const pctAmount = (subtotal.value * value) / 100;
    return Math.min(Math.max(pctAmount, 0), subtotal.value);
  }

  // Fixed amount discount
  return Math.min(Math.max(value, 0), subtotal.value);
});

const grossTotal = computed(() => subtotal.value - discountAmount.value);

const vatAmount = computed(() => {
  if (!state.taxType || state.taxType === "no-tax")
    return 0;
  const vatMatch = state.taxType.match(/vat-(\d+)/);
  if (!vatMatch?.[1])
    return 0;
  const vatPercent = Number.parseFloat(vatMatch[1]);
  const amountAfterDiscount = subtotal.value - discountAmount.value;
  return (amountAfterDiscount * vatPercent) / 100;
});

const total = computed(() => {
  return subtotal.value - discountAmount.value + vatAmount.value;
});

function updateItemAmount(item: any): void {
  item.line_total = (item.quantity * item.unit_price);
}

function calculateItemAmount(item: any): void {
  updateItemAmount(item);
}

function getCommunityIdFromSelection(selection: unknown): number | null {
  if (!selection)
    return null;
  return Number(selection);
}

const selectedCommunityId = computed(() => getCommunityIdFromSelection(state.communityId));

const effectivePlanOptions = computed(() => communityPlanOptions.value);

function handlePlanSelection(item: any, planLabel: string): void {
  const planData = communityPlanOptions.value.find(option => option.label === planLabel);
  if (planData) {
    item.unit_price = Number.parseFloat(planData.planData?.subscription_plan_price) || 0;
    item.subscription_plan_id = planData.planData?.plan_id;
    calculateItemAmount(item);
  }
}

function handleItemPlanChange(item: any, value: string): void {
  handlePlanSelection(item, value);
}

async function fetchCommunityPlan(communityId: number): Promise<void> {
  try {
    loadingPlan.value = true;
    communityPlanOptions.value = [];
    const data = await communitiesStore.getCommunitySubscriptionPlan(communityId);
    if (!data) {
      communityPlanOptions.value = [];
      return;
    }
    const list = Array.isArray(data) ? data : [data];
    communityPlanOptions.value = list.map((item: any) => ({
      label: `${item.subscription_plan_name ?? ""} - ${item.subscription_plan_interval ?? ""} (${item.subscription_plan_price ?? ""})`,
      value: item.plan_id,
      planData: item,
    }));
  }
  catch {
    communityPlanOptions.value = [];
  }
  finally {
    loadingPlan.value = false;
  }
}

function onCommunityChange(value: unknown): void {
  const id = getCommunityIdFromSelection(value);
  state.communityId = (id != null ? id : "") as typeof state.communityId;
}

watch(
  () => state.communityId,
  async (newVal, oldVal) => {
    const communityId = getCommunityIdFromSelection(newVal);
    const prevCommunityId = getCommunityIdFromSelection(oldVal);
    if (communityId == null) {
      communityPlanOptions.value = [];
      invoiceItems.value.forEach((item) => {
        item.description = "";
        item.unit_price = 0;
        item.line_total = 0;
      });
      return;
    }

    // Refetch subscription plans whenever the selected community changes
    if (communityId !== prevCommunityId) {
      invoiceItems.value.forEach((item) => {
        item.description = "";
        item.unit_price = 0;
        item.line_total = 0;
      });
    }
    await fetchCommunityPlan(communityId);
  },
  { immediate: true },
);

function clearCoupon() {
  state.couponCode = "";
  state.discount = 0;
  discountType.value = null;
  couponId.value = null;
}

async function applyCoupon(): Promise<void> {
  try {
    applyingCoupon.value = true;
    const couponCode = state.couponCode?.trim();
    if (couponCode) {
      const response = await couponsStore.previewCoupon(couponCode);
      if (response.data.discount_value) {
        discountType.value = response.data.coupon_type as CouponType;
        state.discount = Number(response.data.discount_value);
        couponId.value = response.data.id;
      }
    }
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to apply coupon. Please try again.") });
  }
  finally {
    applyingCoupon.value = false;
  }
}

async function validateForm(): Promise<void> {
  try {
    state.items = [...invoiceItems.value];
    await formRef.value?.validate();
  }
  catch {

  }
}

function resetForm(): void {
  state.communityId = "";
  state.referenceDate = "";
  state.dueDate = "";
  state.remarks = "";
  state.items = [];
  state.discount = 0;
  state.taxType = "no-tax";
  state.couponCode = "";
  communityPlanOptions.value = [];
  invoiceItems.value = [
    {
      id: 1,
      item_type: "SUBSCRIPTION",
      description: "",
      quantity: 1,
      unit_price: 0,
      line_total: 0,
    },
  ];
  formRef.value?.clear();
}

async function handleSubmit(): Promise<void> {
  try {
    state.items = [...invoiceItems.value];
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    const payload = {
      community_id: selectedCommunityId.value ?? 0,
      reference_date: state.referenceDate,
      due_date: state.dueDate,
      remarks: state.remarks,
      items: state.items,
      subtotal: subtotal.value || 0,
      tax_total: vatAmount.value || 0,
      discount_total: discountAmount.value || 0,
      total_amount: total.value || 0,
      coupon_id: couponId.value || null,
    };
    await transactionsStore.createTransaction(payload);
    success({ message: "Invoice created successfully" });
    resetForm();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to create invoice") });
  }
  finally {
    loading.value = false;
  }
}

function handleCancel(): void {
  emit("cancel");
}
</script>

<template>
  <div class="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
    <UForm
      ref="formRef"
      :state="state"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex flex-col"
    >
      <div class="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/60 p-4 sm:p-6 lg:p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-3">
              <div class="flex flex-col gap-0">
                <h1 class="text-2xl font-bold text-foreground uppercase">
                  SUBSCRIPTION
                </h1>
                <p class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Transaction
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 lg:items-end">
            <div class="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[280px]">
              <div class="flex flex-col gap-1.5 sm:flex-row sm:justify-between sm:items-center">
                <span class="text-sm font-medium text-muted-foreground">Ref Date</span>
                <base-date-picker
                  v-model="state.referenceDate"
                  name="referenceDate"
                  placeholder="Select date"
                  class="w-full sm:w-40"
                  required
                  :no-of-months="1"
                  @update:model-value="validateForm"
                />
              </div>
              <div class="flex flex-col gap-1.5 sm:flex-row sm:justify-between sm:items-center">
                <span class="text-sm font-medium text-muted-foreground">Due Date</span>
                <base-date-picker
                  v-model="state.dueDate"
                  name="dueDate"
                  placeholder="Select due date"
                  class="w-full sm:w-40"
                  :no-of-months="1"
                  @update:model-value="validateForm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-6 lg:p-8 border-b border-border/60">
        <div class="flex flex-col gap-3 w-full max-w-md">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
              Bill To
            </h3>
          </div>
          <base-select-searchable
            v-model="state.communityId"
            name="communityId"
            placeholder="Type to search or select a community"
            :options="props.communityOptions"
            required
            @update:model-value="onCommunityChange"
          />
        </div>
      </div>

      <div class="p-4 sm:p-6 lg:p-8 border-b border-border/60">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide">
              Items
            </h3>
          </div>
          <div class="border border-border/60 rounded-lg overflow-hidden bg-card w-full overflow-x-auto">
            <table class="w-full min-w-[520px] table-fixed">
              <thead class="bg-muted/50">
                <tr>
                  <th class="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[35%] min-w-[140px]">
                    Item Details
                  </th>
                  <th class="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[12%] min-w-[70px]">
                    Qty
                  </th>
                  <th class="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[12%] min-w-[70px]">
                    Rate
                  </th>
                  <th class="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-[14%] min-w-[80px]">
                    Amount
                  </th>
                  <th class="w-[12%] min-w-[60px]" />
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="(item, index) in invoiceItems"
                  :key="item.id"
                  class="hover:bg-muted/30 transition-colors"
                >
                  <td class="px-3 sm:px-4 py-4 align-top">
                    <div class="min-h-[44px] flex items-center min-w-0">
                      <base-select
                        v-model="item.description"
                        :name="`items.${index}.description`"
                        :placeholder="selectedCommunityId ? (loadingPlan ? 'Loading plan...' : 'Type or click to select a plan') : 'Select a community first'"
                        :options="effectivePlanOptions.map(plan => ({ label: plan.label, value: plan.label }))"
                        class="w-full"
                        :disabled="!selectedCommunityId || loadingPlan"
                        @update:model-value="(value) => handleItemPlanChange(item, value)"
                      />
                    </div>
                  </td>
                  <td class="px-3 sm:px-4 py-4 align-top">
                    <div class="min-h-[44px] flex items-center">
                      <base-input
                        :model-value="1"
                        :name="`items.${index}.quantity`"
                        type="number"
                        class="w-full"
                        readonly
                        disabled
                      />
                    </div>
                  </td>
                  <td class="px-3 sm:px-4 py-4 align-top">
                    <div class="min-h-[44px] flex items-center">
                      <base-input
                        v-model.number="item.unit_price"
                        :name="`items.${index}.unit_price`"
                        type="number"
                        class="w-full"
                        readonly
                        disabled
                      />
                    </div>
                  </td>
                  <td class="px-3 sm:px-4 py-4 align-top">
                    <div class="min-h-[44px] flex items-center">
                      <span class="text-sm font-medium text-foreground">{{ item.line_total.toFixed(2) }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-6 lg:p-8 bg-muted/20">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div class="lg:col-span-2 flex flex-col gap-4">
            <UFormField
              name="remarks"
              :ui="{
                error: 'mt-1 text-red-500 text-xs',
              }"
            >
              <template #label>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-sticky-note" class="w-4 h-4 text-muted-foreground" />
                  <span class="text-sm font-medium text-foreground">Internal Remarks</span>
                </div>
              </template>
              <UTextarea
                v-model="state.remarks"
                placeholder="Add internal notes or reminders"
                variant="outline"
                class="w-full"
                size="lg"
                :rows="4"
                :ui="{
                  base: 'bg-transparent',
                }"
              />
            </UFormField>
          </div>
          <div class="flex flex-col gap-4">
            <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
              Summary
            </h3>
            <div class="border border-border/60 rounded-lg p-6 bg-card shadow-sm">
              <div class="flex justify-between items-center pb-3 mb-3 border-b border-border/40">
                <span class="text-sm font-medium text-muted-foreground">Sub Total</span>
                <span class="text-sm font-semibold text-foreground">{{ subtotal.toFixed(2) }}</span>
              </div>

              <div class="flex flex-col gap-3 pb-3 mb-3 border-b border-border/40">
                <UFormField
                  name="couponCode"
                  :ui="{
                    error: 'mt-1 text-red-500 text-xs',
                  }"
                >
                  <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-muted-foreground">Coupon Code</span>
                      <span class="text-xs text-muted-foreground">(Optional)</span>
                    </div>
                    <base-input
                      v-model="state.couponCode"
                      name="couponCode"
                      placeholder="Enter coupon code if applicable"
                      class="w-full h-9 text-sm"
                      :disabled="applyingCoupon"
                    />
                    <div class="flex justify-end gap-2">
                      <base-button
                        v-if="state.couponCode"
                        variant="outline"
                        size="sm"
                        type="button"
                        class="text-xs"
                        @click="clearCoupon"
                      >
                        Clear Coupon
                      </base-button>
                      <base-button
                        variant="outline"
                        size="sm"
                        type="button"
                        :loading="applyingCoupon"
                        :disabled="!state.couponCode || applyingCoupon"
                        class="text-xs"
                        @click="applyCoupon"
                      >
                        Apply Coupon
                      </base-button>
                    </div>
                  </div>
                </UFormField>
              </div>

              <div class="flex flex-col gap-3 pb-3 mb-3 border-b border-border/40">
                <div class="flex flex-wrap justify-between items-center gap-2">
                  <span class="text-sm font-medium text-muted-foreground">Discount</span>
                  <div class="flex items-center gap-2 min-w-0">
                    <base-input
                      v-model.number="state.discount"
                      name="discount"
                      type="number"
                      class="w-20 shrink-0 h-9 text-sm"
                      disabled
                    />
                    <span class="text-sm text-muted-foreground">
                      {{ discountType === "AMOUNT" ? "NPR" : "%" }}
                    </span>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-muted-foreground">Discount Amount</span>
                  <span class="text-sm font-semibold text-foreground">{{ discountAmount.toFixed(2) }}</span>
                </div>
              </div>

              <div class="flex justify-between items-center pb-3 mb-3 border-b border-border/40">
                <span class="text-sm font-medium text-muted-foreground">Gross Total</span>
                <span class="text-sm font-semibold text-foreground">{{ grossTotal.toFixed(2) }}</span>
              </div>

              <div class="flex flex-col gap-3 pb-3 mb-3 border-b border-border/40">
                <div class="flex flex-wrap justify-between items-center gap-2">
                  <span class="text-sm font-medium text-muted-foreground">Tax</span>
                  <base-select
                    v-model="state.taxType"
                    name="taxType"
                    placeholder="Select tax"
                    :options="taxOptions"
                    class="w-28 shrink-0 h-9 text-sm"
                  />
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-muted-foreground">Tax Amount</span>
                  <span class="text-sm font-semibold text-foreground">{{ vatAmount.toFixed(2) }}</span>
                </div>
              </div>

              <div class="flex justify-between items-center pt-4 mt-3">
                <span class="text-base font-bold text-foreground">Total (NPR)</span>
                <span class="text-xl font-bold text-primary">{{ total.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 sm:p-6 lg:p-8 border-t border-border/60 bg-card">
        <base-button
          variant="outline"
          class="w-full sm:w-auto"
          @click="handleCancel"
        >
          Cancel
        </base-button>
        <base-button
          :loading="loading"
          class="w-full sm:w-auto"
          @click="handleSubmit"
        >
          Create
        </base-button>
      </div>
    </UForm>
  </div>
</template>
