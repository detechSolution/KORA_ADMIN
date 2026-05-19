<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import z from "zod";

import type { Member } from "~/types/membership";

import { useNotification } from "~/composables/use-notification";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  plan: Member;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

// const options = [
//   { label: "Active", value: "active" },
//   { label: "Inactive", value: "inactive" },
//   { label: "Blacklisted", value: "blacklisted" },
//   { label: "Paused", value: "paused" },
// ];

const membershipStore = useMembershipStore();
const { success, error: showError } = useNotification();
const membershipPlanOptionId = ref<number>(props.plan?.membershipPlanOptionId);

const currentStep = ref(0);
const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);
const steps = [
  { title: "Basic Info" },
  { title: "Membership Plans" },
];

const schema = z.object({
  fullName: z.string().min(1, "Plan name is required"),
  phoneNumber: z.string().min(1, "Description is required"),
  email: z.string().email(),
  // status: z.enum(options.map(option => option.value)),
});

type EditMemberSchema = z.output<typeof schema>;

const state = reactive<Partial<EditMemberSchema>>({
  fullName: "",
  phoneNumber: "",
  email: "",
  // status: "active",
});

function populateForm(plan: Member | null): void {
  if (!plan) {
    return;
  }

  state.fullName = plan.fullName;
  state.phoneNumber = plan.phoneNumber;
  state.email = plan.email;
  // state.status = plan.user.isActive;
}

function closeDrawer(): void {
  emit("close");
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
    if (!membershipPlanOptionId.value) {
      showError({ message: "Membership plan option is required" });
      return;
    }
    loading.value = true;
    const payload: Record<string, unknown> = {
      membershipPlanOptionId: membershipPlanOptionId.value,
    };

    if (state.fullName !== props.plan.fullName)
      payload.fullName = state.fullName;
    if (state.phoneNumber !== props.plan.phoneNumber)
      payload.phoneNumber = state.phoneNumber;
    if (state.email !== props.plan.email)
      payload.email = state.email;
    if (membershipPlanOptionId.value !== props.plan.membershipPlanOptionId)
      payload.membershipPlanOptionId = membershipPlanOptionId.value;

    await membershipStore.updateMember(props.plan.id, payload);
    success({ message: "Member updated successfully" });
    emit("updated");
    closeDrawer();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to update member.") });
  }
  finally {
    loading.value = false;
  }
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

function handleBack(): void {
  currentStep.value = Math.max(currentStep.value - 1, 0);
}

async function handleNext(): Promise<void> {
  const isValid = await validateCurrentStep();
  if (!isValid) {
    return;
  }
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
}

async function fetchMembershipPlans() {
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

onMounted(() => {
  fetchMembershipPlans();
});

watch(
  () => [props.open, props.plan] as const,
  ([open]) => {
    if (open) {
      // membershipPlanOptionId.value = props.plan.membershipPlanOptionId;
      populateForm(props.plan);
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
      class="flex min-h-0 justify-between flex-1 flex-col"
    >
      <div>
        <FormEditStepper
          :steps="steps"
          :current-step="currentStep"
        />
        <section v-if="currentStep === 0" class="grid gap-5 p-6">
          <div class="flex-1 overflow-y-auto">
            <div class="grid gap-5">
              <base-input
                v-model="state.fullName"
                label="Member Name"
                name="name"
                placeholder="Enter member name"
              />
              <div class="flex flex-col md:flex-row gap-4">
                <base-input
                  v-model="state.phoneNumber"
                  label="Phone Number"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                />
                <base-input
                  v-model="state.email"
                  label="Email"
                  name="email"
                  placeholder="Enter email"
                />
              </div>
            </div>
          </div>
        </section>
        <section
          v-else-if="currentStep === 1"
          key="step-2"
          class="space-y-6 p-6"
        >
          <div class="flex flex-col gap-4">
            <h2 class="text-stone-900 text-base font-medium">
              Membership Plans
            </h2>

            <div class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              <div
                v-for="item in flattenedPlans"
                :key="item.option.id"
                class="flex justify-between items-center p-3 rounded-sm cursor-pointer border transition-colors"
                :class="membershipPlanOptionId === item.option.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'"
                @click="membershipPlanOptionId = item.option.id"
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
            Update Plan
          </base-button>
        </div>

        <div
          v-else
          class="flex items-center border-t border-stone-200 px-5 py-4"
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
      </div>
    </UForm>
  </base-drawer>
</template>
