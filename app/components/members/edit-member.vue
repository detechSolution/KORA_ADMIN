<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import z from "zod";

import type { MembershipPlan } from "~/types/membership";

import { useNotification } from "~/composables/use-notification";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  plan: MembershipPlan | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const options = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Blacklisted", value: "blacklisted" },
  { label: "Paused", value: "paused" },
];

// const membershipStore = useMembershipStore();
const { success, error: showError } = useNotification();

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
  status: z.enum(options.map(option => option.value)),
});

type EditMemberSchema = z.output<typeof schema>;

const state = reactive<Partial<EditMemberSchema>>({
  fullName: "",
  phoneNumber: "",
  email: "",
  status: "active",
});

function populateForm(plan: Member | null): void {
  if (!plan) {
    return;
  }

  state.fullName = plan.fullName;
  state.phoneNumber = plan.phoneNumber;
  state.email = plan.email;
  state.status = plan.user.isActive;
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

  if (!props.plan?.id) {
    showError({ message: "Invalid plan selected." });
    return;
  }

  try {
    loading.value = true;

    success({ message: "Plan updated successfully" });
    emit("updated");
    closeDrawer();
  }
  catch (error: unknown) {
    showError({
      message: getApiErrorMessage(error, "Failed to update plan."),
    });
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

watch(
  () => [props.open, props.plan] as const,
  ([open]) => {
    if (open) {
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
      class="flex min-h-0 flex-1 flex-col"
    >
      <FormEditStepper
        :steps="steps"
        :current-step="currentStep"
      />
      <section v-if="currentStep === 0" class="grid gap-5 px-5 pb-6">
        <div class="flex-1 overflow-y-auto px-5 py-5">
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
            <base-select
              v-model="state.status"
              :options="options"
              label="Status"
              name="status"
              placeholder="Select status"
            />
          </div>
        </div>
      </section>
      <section
        v-else-if="currentStep === 1"
        key="step-2"
        class="space-y-6"
      >
        <div class="p-6 flex flex-col gap-4">
          <h2 class="text-stone-900 text-base font-semibold">
            Membership Plans
          </h2>

          <div class="flex border justify-between items-center p-3 border-stone-200 rounded-sm">
            <div class="flex flex-col gap-1">
              <h2 class="font-medium text-xs">
                Kora Premium
              </h2>
              <p class="text-secondary-400 text-xs">
                date
              </p>
              <base-badge class="w-fit">
                Monthly
              </base-badge>
            </div>
            <p class="text-stone-500 text-xs font-semibold">
              Rs. 10,000/month
            </p>
          </div>
        </div>
      </section>

      <div
        v-if="currentStep < 1"
        class="flex items-center px-5 pb-6"
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

      <div v-else class="flex items-center justify-between border-t border-stone-200 px-5 py-4">
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
          Update Plan
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
