<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import z from "zod";

import type { Member, MembershipPlan } from "~/types/membership";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useBookingStore } from "~/stores/booking";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  member: Member;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const paymentMethods = [
  { value: "cash", label: "Cash", description: "Paid at counter", icon: ICONS.MONEY },
  { value: "online", label: "Online Transfer", description: "Card/Online Transfer", icon: ICONS.WIFI },
];

const steps = [
  { title: "Membership Plan" },
  { title: "Payment" },
];
const bookingStore = useBookingStore();
const membershipStore = useMembershipStore();
const { success, error: showError } = useNotification();

const currentStep = ref(0);
const loading = ref(false);
const promoLoading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const appliedPromo = ref<{ code: string; type: string; amount: number; isValid: boolean } | null>(null);

const stepOneSchema = z.object({
  membershipPlanOptionId: z.number({ error: "Please select a membership plan" }).min(1, "Please select a membership plan"),
  subscriptionStartDate: z.string().min(1, "Start date is required"),
});

const stepTwoSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
});

type CombinedState = z.output<typeof stepOneSchema> & z.output<typeof stepTwoSchema>;

const state = reactive<Partial<CombinedState> & { promoCode?: string }>({
  membershipPlanOptionId: 0,
  subscriptionStartDate: "",
  paymentMethod: "",
  promoCode: "",
});

const currentSchema = computed(() =>
  currentStep.value === 0 ? stepOneSchema : stepTwoSchema,
);

function isPlanSelected(plan: MembershipPlan): boolean {
  return plan.options.some(option => option.id === state.membershipPlanOptionId);
}

function handlePlanSelect(optionId: number | null): void {
  if (optionId != null) {
    state.membershipPlanOptionId = optionId;
  }
}

const selectedPlanOption = computed(() => {
  for (const plan of membershipStore.plans.data) {
    const option = plan.options.find(o => o.id === state.membershipPlanOptionId);
    if (option) {
      return { plan, option };
    }
  }
  return null;
});

// --- Promo code & totals ---

const subTotal = computed(() => Number(selectedPlanOption.value?.option.price) || 0);

const promoDiscount = computed(() => {
  if (!appliedPromo.value?.isValid)
    return 0;
  if (appliedPromo.value.type === "fixed")
    return Math.min(appliedPromo.value.amount, subTotal.value);
  return Math.round((subTotal.value * appliedPromo.value.amount) / 100);
});

const totalAmount = computed(() => Math.max(0, subTotal.value - promoDiscount.value));

async function applyPromoCode(): Promise<void> {
  if (!state.promoCode?.trim())
    return;
  promoLoading.value = true;
  try {
    const data = await bookingStore.validatePromoCode(state.promoCode);
    if (data?.isValid) {
      appliedPromo.value = {
        code: data.code,
        type: data.type,
        amount: data.amount,
        isValid: true,
      };
      success({ message: "Promo code applied successfully" });
    }
    else {
      appliedPromo.value = null;
      showError({ message: "Invalid promo code" });
    }
  }
  catch (error) {
    appliedPromo.value = null;
    showError({ message: getApiErrorMessage(error, "Invalid promo code") });
  }
  finally {
    promoLoading.value = false;
  }
}

function removePromo(): void {
  appliedPromo.value = null;
}

// --- Step navigation ---

async function validateCurrentStep(): Promise<boolean> {
  try {
    await formRef.value?.validate();
    return true;
  }
  catch {
    return false;
  }
}

async function handleNext(): Promise<void> {
  if (!state.membershipPlanOptionId) {
    showError({ message: "Please select a membership plan" });
    return;
  }
  const isValid = await validateCurrentStep();
  if (!isValid)
    return;
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
}

function handleBack(): void {
  currentStep.value = Math.max(currentStep.value - 1, 0);
}

async function handleSubmit(): Promise<void> {
  const isValid = await validateCurrentStep();
  if (!isValid)
    return;
  try {
    loading.value = true;
    await membershipStore.updateMember(props.member.id, {
      membershipPlanOptionId: state.membershipPlanOptionId,
      subscriptionStartDate: state.subscriptionStartDate,
      paymentMethod: state.paymentMethod,
      promoCode: appliedPromo.value?.isValid ? appliedPromo.value.code : undefined,
    });
    success({ message: "Membership added successfully" });
    emit("updated");
    emit("close");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to add membership.") });
  }
  finally {
    loading.value = false;
  }
}

async function fetchMembershipPlans(): Promise<void> {
  try {
    loading.value = true;
    await membershipStore.fetchPlans();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Something went wrong. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchMembershipPlans();
});

watch(
  () => props.open,
  (open) => {
    if (open) {
      currentStep.value = 0;
      state.membershipPlanOptionId = 0;
      state.subscriptionStartDate = "";
      state.paymentMethod = "";
      state.promoCode = "";
      appliedPromo.value = null;
    }
  },
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
      :schema="currentSchema"
      :state="state"
      :validate-on="['input', 'change', 'blur']"
      class="flex min-h-0 justify-between flex-1 flex-col"
    >
      <div class="flex-1 overflow-y-auto min-h-0">
        <FormEditStepper
          :steps="steps"
          :current-step="currentStep"
        />

        <!-- Step 1: Membership Plan + Start Date -->
        <section
          v-if="currentStep === 0"
          class="space-y-6 p-6"
        >
          <div class="flex flex-col gap-4">
            <h2 class="text-stone-900 font-medium text-base">
              Select a membership plan
            </h2>

            <UFormField name="membershipPlanOptionId">
              <div class="flex flex-col gap-2">
                <members-membership-card
                  v-for="plan in membershipStore.plans.data.filter(p => p.isActive)"
                  :key="plan.id"
                  :name="plan.name"
                  :currency="plan.currency"
                  :options="plan.options"
                  :is-selected="isPlanSelected(plan)"
                  @select="handlePlanSelect"
                />
              </div>
            </UFormField>

            <USeparator />

            <base-date-picker
              v-model="state.subscriptionStartDate"
              name="subscriptionStartDate"
              label="Start Date*"
              placeholder="Select start date"
            />
          </div>
        </section>

        <!-- Step 2: Overview + Payment Method -->
        <section
          v-else-if="currentStep === 1"
          class="p-6"
        >
          <div class="rounded-xl flex flex-col gap-4 p-5 shadow-xl">
            <div class="flex flex-col bg-stone-50 p-4 border border-stone-200 rounded-md gap-2">
              <h2 class="text-stone-900 font-medium text-base">
                Overview
              </h2>

              <div class="flex justify-between">
                <p class="text-secondary-500 text-xs">
                  {{ selectedPlanOption?.plan.name }}
                  ({{ selectedPlanOption?.option.frequency }})
                </p>
                <p class="text-secondary text-xs font-normal">
                  {{ selectedPlanOption?.plan.currency }}
                  {{ subTotal.toLocaleString() }}
                </p>
              </div>

              <div
                v-if="promoDiscount > 0"
                class="flex justify-between"
              >
                <p class="text-secondary-500 text-xs">
                  Promo Discount
                </p>
                <p class="text-emerald-600 text-xs font-normal">
                  - {{ selectedPlanOption?.plan.currency }} {{ promoDiscount.toLocaleString() }}
                </p>
              </div>

              <USeparator />

              <div class="flex justify-between">
                <p class="text-secondary font-medium text-sm">
                  Total
                </p>
                <p class="text-secondary text-sm font-medium">
                  {{ selectedPlanOption?.plan.currency }}
                  {{ totalAmount.toLocaleString() }}
                </p>
              </div>
            </div>

            <!-- Promo code -->
            <div class="flex gap-2 flex-row items-end">
              <div class="relative w-full">
                <base-input
                  v-model="state.promoCode"
                  name="promoCode"
                  label="Promo Code"
                  placeholder="e.g PROMO20"
                  class="flex-1"
                  @update:model-value="removePromo"
                  @keypress.enter="applyPromoCode"
                />
                <div
                  v-if="appliedPromo?.isValid"
                  class="absolute right-2 bottom-0.5"
                >
                  <UIcon
                    :name="ICONS.CIRCLE_CHECK"
                    class="w-5 h-5 text-green-500"
                  />
                </div>
              </div>
              <base-button
                variant="outline"
                :loading="promoLoading"
                @click="applyPromoCode"
              >
                Apply
              </base-button>
            </div>

            <h2 class="text-stone-900 font-medium text-base">
              Payment Method
            </h2>

            <div class="flex flex-col gap-2">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  v-for="method in paymentMethods"
                  :key="method.value"
                  class="border rounded-lg p-3 cursor-pointer flex items-center gap-3 transition-all"
                  :class="state.paymentMethod === method.value
                    ? 'border-stone-200 bg-[#F9F6F2]'
                    : 'border-stone-200 hover:border-stone-300'"
                  @click="state.paymentMethod = method.value"
                >
                  <div class="bg-primary-700 p-2 rounded-full flex items-center justify-center">
                    <UIcon :name="method.icon" class="w-5 h-5 text-white" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold">{{ method.label }}</span>
                    <span class="text-xs text-stone-500">{{ method.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div>
        <div
          v-if="currentStep === steps.length - 1"
          class="flex items-center justify-between border-t border-stone-200 px-5 py-4"
        >
          <base-button
            variant="outline"
            size="md"
            @click="handleBack"
          >
            Back
          </base-button>
          <base-button
            variant="solid"
            size="md"
            :loading="loading"
            @click="handleSubmit"
          >
            Add Membership
          </base-button>
        </div>

        <div
          v-else
          class="flex items-center justify-end border-t border-stone-200 px-5 py-4"
        >
          <base-button
            variant="solid"
            size="md"
            @click="handleNext"
          >
            Next
          </base-button>
        </div>
      </div>
    </UForm>
  </base-drawer>
</template>
