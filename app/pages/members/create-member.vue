<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import z from "zod";

import type { MembershipPlan } from "~/types/membership";

import { ICONS } from "~/config/icons";
import { useBookingStore } from "~/stores/booking";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  layout: "dashboard",
  auth: true,
  permission: "members.create",
});

const steps: StepItem[] = [
  { label: "Basic Info", description: "Member name & details", title: "Start by entering the member's personal details.", icon: ICONS.INFO },
  { label: "Membership Plan", description: "Select a subscription plan", title: "Select the membership plan for the member", icon: ICONS.AWARD },
  { label: "Payment", description: "Payment & Create", title: "Finalize the payment details and create the membership.", icon: ICONS.CREDIT_CARD },
];
const paymentMethods = [
  { value: "cash", label: "Cash", description: "Paid at counter", icon: ICONS.MONEY },
  { value: "online", label: "Online Transfer", description: "Card/Online Transfer", icon: ICONS.WIFI },
];

const currentStep = ref(0);
const bookingStore = useBookingStore();
const membershipStore = useMembershipStore();
const { error: showError, success } = useNotification();
const router = useRouter();

const loading = ref(false);
const promoLoading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);
const appliedPromo = ref<{ code: string; type: string; amount: number; isValid: boolean } | null>(null);

const stepOneSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required").regex(/^\d{10}$/, "Phone number must be 10 digits"),
  email: z.string().email("Invalid email address"),
  identificationDocument: z.file({ error: "Identification document is required" }),
});

const stepTwoSchema = z.object({
  membershipPlanOptionId: z.number().min(1, "Membership plan option is required"),
  subscriptionStartDate: z.string().min(1, "Subscription start date is required"),
});

const stepThreeSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
});

type Step1Schema = z.output<typeof stepOneSchema>;
type Step2Schema = z.output<typeof stepTwoSchema>;
type Step3Schema = z.output<typeof stepThreeSchema>;
type CombinedSchema = Step1Schema & Step2Schema & Step3Schema;

const currentSchema = computed(() => {
  if (currentStep.value === 0)
    return stepOneSchema;
  if (currentStep.value === 1)
    return stepTwoSchema;
  if (currentStep.value === 2)
    return stepThreeSchema;
  return stepOneSchema;
});

const state = reactive<Partial<CombinedSchema> & { promoCode?: string }>({
  fullName: "",
  phoneNumber: "",
  email: "",
  membershipPlanOptionId: 0,
  subscriptionStartDate: "",
  paymentMethod: "",
  promoCode: "",
});

function isPlanSelected(plan: MembershipPlan): boolean {
  return plan.options.some(option => option.id === state.membershipPlanOptionId);
}

function handlePlanSelect(optionId: number | null): void {
  if (optionId != null) {
    state.membershipPlanOptionId = optionId;
  }
}

function goToStep(step: number) {
  if (step > currentStep.value) {
    void validateCurrentStep().then((isValid) => {
      if (isValid) {
        currentStep.value = step;
      }
    });
    return;
  }

  currentStep.value = step;
}

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
  const isValid = await validateCurrentStep();
  if (!isValid)
    return;
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
}

function handleBack(): void {
  currentStep.value = Math.max(currentStep.value - 1, 0);
}

function clearApiError(): void {
  apiError.value = null;
}

async function handleCreatePlan() {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }
  try {
    loading.value = true;
    clearApiError();

    const formData = new FormData();

    formData.append("fullName", state.fullName);
    formData.append("phoneNumber", state.phoneNumber);
    formData.append("email", state.email);
    formData.append("membershipPlanOptionId", state.membershipPlanOptionId.toString());
    formData.append("subscriptionStartDate", state.subscriptionStartDate);
    formData.append("identificationDocument", state.identificationDocument);
    formData.append("paymentMethod", state.paymentMethod);
    if (appliedPromo.value?.isValid)
      formData.append("promoCode", appliedPromo.value.code);

    await membershipStore.createMember(formData);
    success({ message: "Membership plan created successfully" });
    router.push("/members/members-list");
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Something went wrong. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

async function fetchMembershipPlanOptions() {
  try {
    loading.value = true;
    clearApiError();
    await membershipStore.fetchPlans();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Something went wrong. Please try again.") });
  }
  finally {
    loading.value = false;
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

onMounted(() => {
  fetchMembershipPlanOptions();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Create New Member
      </template>
      <template #description>
        Create and manage members
      </template>

      <template #actions>
        <NuxtLink to="/members/members-list">
          <base-button
            variant="outline"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            Back to list
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl p-4 sm:p-6 page-content-height">
      <div class="flex flex-col lg:flex-row gap-6">
        <FormStepper
          :steps="steps"
          :current-step="currentStep"
          aria-label="Session creation progress"
          @select="goToStep"
        />
        <div class="flex-1 flex flex-col gap-4 min-w-0 lg:pl-0">
          <form-header-card
            :label="steps[currentStep]?.label ?? ''"
            :description="steps[currentStep]?.title ?? ''"
            :icon="steps[currentStep]?.icon ?? ''"
          />

          <UForm
            ref="formRef"
            :schema="currentSchema"
            :state="state"
            class="space-y-6"
            @submit="handleCreatePlan"
          >
            <Transition
              name="step-fade"
              mode="out-in"
            >
              <section
                v-if="currentStep === 0"
                key="step-1"
                class="space-y-6"
              >
                <div class="rounded-xl bg-muted/20 p-5 sm:p-6 shadow-sm">
                  <div class="grid grid-cols-1 gap-4">
                    <base-input
                      v-model="state.fullName"
                      name="fullName"
                      label="Member Name*"
                      placeholder="Enter member name"
                    />

                    <div class="flex flex-col md:flex-row gap-4">
                      <base-input
                        v-model="state.phoneNumber"
                        name="phoneNumber"
                        label="Phone Number*"
                        placeholder="Enter phone number"
                        class="w-full"
                      />

                      <base-input
                        v-model="state.email"
                        name="email"
                        label="Email Address*"
                        placeholder="Enter email address"
                        class="w-full"
                      />
                    </div>

                    <base-file-upload
                      v-model="state.identificationDocument"
                      name="identificationDocument"
                      label="Identification Document*"
                      placeholder="Drop your image here"
                      :max-file-size="5 * 1024 * 1024"
                      accept="image"
                    />
                  </div>
                </div>
              </section>
              <section
                v-else-if="currentStep === 1"
                key="step-2"
                class="space-y-6"
              >
                <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm space-y-6">
                  <div class="flex flex-col gap-4">
                    <h2 class="text-stone-900 font-medium text-base">
                      Select a membership plan
                    </h2>

                    <UFormField name="membershipPlanOptionId">
                      <div
                        class=" flex flex-col gap-2"
                      >
                        <members-membership-card
                          v-for="plan in membershipStore.plans.data.filter(p => p.isPurchasable)"
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
                </div>
              </section>

              <section
                v-else-if="currentStep === 2"
                key="step-3"
              >
                <div class="rounded-xl flex flex-col gap-4 p-5 sm:p-6 shadow-xl">
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

                  <!-- Payment method -->
                  <div class="flex flex-col gap-2">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        v-for="method in paymentMethods"
                        :key="method.value"
                        class="border rounded-lg p-3 cursor-pointer flex items-center gap-3 transition-all"
                        :class="
                          state.paymentMethod === method.value
                            ? 'border-stone-200 bg-[#F9F6F2]'
                            : 'border-stone-200 hover:border-stone-300'
                        "
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
            </Transition>
            <div
              v-if="currentStep < 2"
              class="flex items-center"
              :class="currentStep > 0 ? 'justify-between' : 'justify-end'"
            >
              <base-button
                v-if="currentStep > 0"
                variant="outline"
                @click="handleBack"
              >
                Back
              </base-button>
              <base-button @click="handleNext">
                Next
              </base-button>
            </div>
            <div v-else class="flex items-center justify-between">
              <base-button variant="outline" @click="handleBack">
                Back
              </base-button>
              <base-button :loading="loading" @click="handleCreatePlan">
                Create Member
              </base-button>
            </div>
          </UForm>
        </div>
      </div>
    </div>
  </div>
</template>
