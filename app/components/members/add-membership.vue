<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import z from "zod";

import type { Member } from "~/types/membership";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
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

const membershipStore = useMembershipStore();
const { success, error: showError } = useNotification();

const currentStep = ref(0);
const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const stepOneSchema = z.object({
  membershipPlanOptionId: z.number({ error: "Please select a membership plan" }).min(1, "Please select a membership plan"),
  subscriptionStartDate: z.string().min(1, "Start date is required"),
});

const stepTwoSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
});

type CombinedState = z.output<typeof stepOneSchema> & z.output<typeof stepTwoSchema>;

const state = reactive<Partial<CombinedState>>({
  membershipPlanOptionId: 0,
  subscriptionStartDate: "",
  paymentMethod: "",
});

const currentSchema = computed(() =>
  currentStep.value === 0 ? stepOneSchema : stepTwoSchema,
);

const flattenedPlans = computed(() =>
  membershipStore.plans.data.flatMap(plan =>
    plan.options.map(option => ({
      planId: plan.id,
      planName: plan.name,
      currency: plan.currency,
      option,
    })),
  ),
);

const selectedPlanOption = computed(() => {
  for (const plan of membershipStore.plans.data) {
    const option = plan.options.find(o => o.id === state.membershipPlanOptionId);
    if (option) {
      return { plan, option };
    }
  }
  return null;
});

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
      <div>
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
            <h2 class="text-stone-900 text-base font-medium">
              Membership Plans
            </h2>

            <div class="flex flex-col gap-2 max-h-[45vh] overflow-y-auto">
              <div
                v-for="item in flattenedPlans"
                :key="item.option.id"
                class="flex justify-between items-center p-3 rounded-sm cursor-pointer border transition-colors"
                :class="state.membershipPlanOptionId === item.option.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'"
                @click="state.membershipPlanOptionId = item.option.id"
              >
                <div class="flex flex-col gap-1">
                  <h2 class="font-medium text-xs">
                    {{ item.planName }}
                  </h2>
                  <p class="text-secondary-400 text-xs">
                    {{ item.option.durationDays }} days
                  </p>
                  <base-badge class="w-fit">
                    {{ item.option.frequency.charAt(0).toUpperCase() + item.option.frequency.slice(1) }}
                  </base-badge>
                </div>
                <p class="text-stone-500 text-xs font-semibold">
                  {{ item.currency }} {{ Number(item.option.price).toLocaleString() }}/{{ item.option.frequency }}
                </p>
              </div>
            </div>

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
          class="space-y-6 p-6"
        >
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
                {{ Number(selectedPlanOption?.option.price).toLocaleString() }}
              </p>
            </div>

            <USeparator />

            <div class="flex justify-between">
              <p class="text-secondary font-medium text-sm">
                Total
              </p>
              <p class="text-secondary text-sm font-medium">
                {{ selectedPlanOption?.plan.currency }}
                {{ Number(selectedPlanOption?.option.price).toLocaleString() }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <h2 class="text-stone-900 font-medium text-base">
              Payment Method
            </h2>

            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="method in paymentMethods"
                :key="method.value"
                class="border rounded-lg p-3 cursor-pointer flex items-center gap-3 transition-all"
                :class="state.paymentMethod === method.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'"
                @click="state.paymentMethod = method.value"
              >
                <div class="bg-primary-700 p-2 rounded-full flex items-center justify-center">
                  <UIcon :name="method.icon" class="w-4 h-4 text-white" />
                </div>
                <div class="flex flex-col">
                  <span class="text-xs font-semibold">{{ method.label }}</span>
                  <span class="text-xs text-stone-500">{{ method.description }}</span>
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
