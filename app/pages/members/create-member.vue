<script setup lang="ts">
import { reactive, ref } from "vue";
import z from "zod";

import type { CreateMembershipPlanPayload } from "~/types/membership";

import { ICONS } from "~/config/icons";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  layout: "dashboard",
  auth: true,
  permission: "administration.admins.create",
});

const steps: StepItem[] = [
  { label: "Basic Info", description: "Member name & details", title: "Start by entering the member's personal details.", icon: ICONS.INFO },
  { label: "Membership Plan", description: "Select a subscription plan", title: "Select the membership plan for the member", icon: ICONS.AWARD },
  { label: "Payment", description: "Payment & Create", title: "Finalize the payment details and create the membership.", icon: ICONS.CREDIT_CARD },
];

const currentStep = ref(0);
const membershipStore = useMembershipStore();
const toast = useNotification();
const router = useRouter();

const loading = ref(false);
const apiError = ref<string | null>(null);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  membershipPlanOptionId: z.number().min(1, "Membership plan option is required"),
  subscriptionStartDate: z.string().min(1, "Subscription start date is required"),
  paymentAmount: z.number().min(1, "Payment amount is required"),
  paymentCurrency: z.string().min(1, "Payment currency is required"),
  paymentStatus: z.string().min(1, "Payment status is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentPaidAt: z.string().min(1, "Payment paid at is required"),
  paymentNotes: z.string().min(1, "Payment notes is required"),
});

type CreatePlanSchema = z.output<typeof schema>;

const state = reactive<Partial<CreatePlanSchema>>({
  fullName: "",
  phoneNumber: "",
  email: "",
  membershipPlanOptionId: 0,
  subscriptionStartDate: "",
  paymentAmount: 0,
  paymentCurrency: "",
  paymentStatus: "",
  paymentMethod: "",
  paymentPaidAt: "",
  paymentNotes: "",
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
  const isValid = await validateCurrentStep();
  if (!isValid)
    return;
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
}

function handleBack(): void {
  currentStep.value = Math.max(currentStep.value - 1, 0);
}

function setApiError(error: string): void {
  apiError.value = error;
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
    const payload: CreateMembershipPlanPayload = {
      name: state.name,
      description: state.description,
      isActive: state.isActive,
      options: state.options.map(opt => ({
        frequency: opt.frequency,
        ...(opt.frequency === "custom" && { customDays: opt.customDays }),
        price: opt.price,
        memberBenefit: opt.memberBenefit,
        isVisible: opt.isVisible,
      })),
    };
    await membershipStore.createPlan(payload);
    toast.success({ message: "Membership plan created successfully" });
    router.push("/members/plan");
  }
  catch (error: unknown) {
    const message = getApiErrorMessage(error, "Something went wrong. Please try again.");
    if (message !== "Something went wrong. Please try again.") {
      setApiError(message);
      formRef.value?.validate();
      return;
    }
    toast.error({ message });
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

    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-4 sm:p-6 page-content-height">
      <div class="flex flex-col lg:flex-row gap-6">
        <FormStepper
          :steps="steps"
          :current-step="currentStep"
          aria-label="Session creation progress"
          @select="goToStep"
        />
        <div class="flex-1 min-w-0 lg:pl-0">
          <div class="mb-6 flex items-start gap-3 rounded-lg bg-muted/40 p-4 border border-border">
            <div class="rounded-lg bg-primary/10 p-2 shrink-0">
              <UIcon
                :name="steps[currentStep]?.icon ?? ''"
                class="h-5 w-5 text-primary"
              />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-foreground">
                {{ steps[currentStep]?.label ?? "" }}
              </h2>
              <p class="text-sm text-muted-foreground mt-0.5">
                {{ steps[currentStep]?.title ?? "" }}
              </p>
            </div>
          </div>

          <UForm
            ref="formRef"
            :schema="schema"
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
                      v-model="state.name"
                      name="name"
                      label="Member Name*"
                      placeholder="Enter member name"
                    />

                    <div class="flex flex-col md:flex-row gap-4">
                      <base-input
                        v-model="state.name"
                        name="name"
                        label="Phone Number*"
                        placeholder="Enter phone number"
                        class="w-full"
                      />

                      <base-input
                        v-model="state.name"
                        name="name"
                        label="Email Address*"
                        placeholder="Enter email address"
                        class="w-full"
                      />
                    </div>

                    <base-file-upload
                      v-model="state.name"
                      name="name"
                      label="Identification Document*"
                      placeholder="Drop your image here"
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
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <base-input
                      v-model="form.instructorName"
                      name="instructorName"
                      label="Instructor Name"
                      placeholder="Enter instructor name"
                    />
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
              <base-button :loading="loading" @click="handleCreateSession">
                Create Session
              </base-button>
            </div>
          </UForm>
        </div>
      </div>
    </div>
  </div>
</template>

<style>

</style>
