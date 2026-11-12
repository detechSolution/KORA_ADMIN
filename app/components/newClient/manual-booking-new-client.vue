<script setup lang="ts">
import { computed, nextTick, reactive, ref } from "vue";
import z from "zod";

import type { CreateNewClientBookingPayload } from "~/types/booking";

import { findServiceGroup, findServiceItem } from "~/composables/services/use-booking";
import { useNotification } from "~/composables/use-notification";
import { useBookingStore } from "~/stores/booking";
import { getApiErrorMessage } from "~/utils/error";

/* ── State ──────────────────────────────────────────────── */

const loading = ref(false);
const currentStep = ref(0);
const navigating = ref(false);
const bookingStore = useBookingStore();
const { success, error: showError } = useNotification();

type ScheduleStep = {
  showDuration: boolean;
  spaAvailableDays: string[];
  weekdayFromDate: (date: string | undefined) => string | null;
  loadingTimes: boolean;
};
type PricingStep = {
  appliedPromo: { isValid: boolean; code: string } | null;
};
const step2Ref = ref<ScheduleStep | null>(null);
const step3Ref = ref<PricingStep | null>(null);

const steps = [
  { id: 1, title: "Client Info", description: "Client contact info" },
  { id: 2, title: "Schedule", description: "Schedule Session/Spa" },
  { id: 3, title: "Pricing", description: "Price & Payment Method" },
];

/* ── Schemas ────────────────────────────────────────────── */

const step1Schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().nullish().transform(value => value?.trim().replace(/[\s()-]/g, "") || undefined).refine(
    value => value === undefined || /^(?:\d{10}|\+[1-9]\d{6,14})$/.test(value),
    "Please enter a valid phone number",
  ),
  email: z.string().min(1, "Email address is required").email("Invalid email address"),
});

const step2Schema = z.object({
  serviceType: z.string().min(1, "Service type is required"),
  serviceId: z.coerce.number({ message: "Please select a service" }).min(1, "Please select a service"),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  durationId: z.number().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.serviceType === "spa") {
    if (!data.durationId || data.durationId <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durationId"],
        message: "Please select a duration",
      });
    }
    if (!data.time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time"],
        message: "Time is required for SPA services",
      });
    }
    else if (!data.time.includes(":")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time"],
        message: "Please enter a valid time in HH:mm format",
      });
    }
  }
});

const step3Schema = z.object({
  promoCode: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required").refine(
    v => ["cash", "online"].includes(v),
    "Invalid payment method",
  ),
});

type Step1 = z.output<typeof step1Schema>;
type Step2 = z.output<typeof step2Schema>;
type Step3 = z.output<typeof step3Schema>;
type FormState = Partial<Step1 & Step2 & Step3> & {
  roomType?: "private" | "shared";
};

const currentSchema = computed(() => {
  const schemas = [step1Schema, step2Schema, step3Schema];
  return schemas[currentStep.value] ?? step1Schema;
});

/* ── Form state ─────────────────────────────────────────── */

const form = reactive<FormState>({
  fullName: "",
  phone: "",
  email: "",
  serviceType: "",
  serviceId: undefined,
  date: "",
  time: "",
  durationId: null,
  roomType: "private",
  promoCode: "",
  paymentMethod: "cash",
});

/* ── Navigation ─────────────────────────────────────────── */

type ValidatableForm = { validate: () => Promise<void> };
const formRef = ref<ValidatableForm | null>(null);

const maxReachableStep = computed(() => {
  if (!step1Schema.safeParse(form).success)
    return 0;
  if (!step2Schema.safeParse(form).success || !validateScheduleSelection())
    return 1;
  return 2;
});

async function handleNext(): Promise<void> {
  if (navigating.value || loading.value || currentStep.value >= steps.length - 1)
    return;

  navigating.value = true;
  try {
    if (await validateCurrentStep())
      currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
  }
  finally {
    navigating.value = false;
  }
}

async function validateCurrentStep(): Promise<boolean> {
  try {
    if (!formRef.value)
      return false;
    await formRef.value.validate();
    if (currentStep.value === 1)
      return validateScheduleSelection();
    return true;
  }
  catch {
    return false;
  }
}

function validateScheduleSelection(): boolean {
  if (bookingStore.loading || step2Ref.value?.loadingTimes)
    return false;
  if (step2Ref.value?.showDuration) {
    const { spaAvailableDays, weekdayFromDate } = step2Ref.value;
    const allowed = spaAvailableDays ?? [];
    const weekday = weekdayFromDate(form.date);
    if (!weekday || (allowed.length > 0 && !allowed.includes(weekday)))
      return false;
  }
  return true;
}

function handleBack(): void {
  void goToStep(currentStep.value - 1);
}

async function goToStep(step: number): Promise<void> {
  if (navigating.value || loading.value || !Number.isInteger(step) || step < 0 || step >= steps.length || step === currentStep.value)
    return;
  if (step < currentStep.value) {
    currentStep.value = step;
    return;
  }
  if (step > maxReachableStep.value)
    return;

  navigating.value = true;
  try {
    if (await validateCurrentStep() && step <= maxReachableStep.value)
      currentStep.value = step;
  }
  finally {
    navigating.value = false;
  }
}

/* ── Actions ────────────────────────────────────────────── */
function resetForm(): void {
  form.fullName = "";
  form.phone = "";
  form.email = "";
  form.serviceType = "";
  form.serviceId = undefined;
  form.date = "";
  form.time = "";
  form.durationId = null;
  form.roomType = "private";
  form.promoCode = "";
  form.paymentMethod = "cash";

  currentStep.value = 0;
}
async function handleCreateBooking(): Promise<void> {
  if (loading.value || navigating.value || currentStep.value !== steps.length - 1)
    return;

  try {
    loading.value = true;
    const schemas = [step1Schema, step2Schema, step3Schema];
    for (const [step, schema] of schemas.entries()) {
      if (!schema.safeParse(form).success) {
        currentStep.value = step;
        await nextTick();
        await validateCurrentStep();
        return;
      }
    }
    if (!await validateCurrentStep())
      return;
    if (!validateScheduleSelection()) {
      currentStep.value = 1;
      showError({ message: "Please review the selected schedule before booking." });
      return;
    }
    const clientInfo = step1Schema.parse(form);

    if (!form.serviceId || !form.date || !form.fullName || !form.email || !form.paymentMethod) {
      console.warn("Missing required fields");
      return;
    }

    const serviceItem = findServiceItem(form.serviceId);
    if (!serviceItem) {
      currentStep.value = 1;
      showError({ message: "Please select an available service." });
      return;
    }

    const serviceGroup = findServiceGroup(form.serviceId);
    if (!serviceGroup || serviceGroup.type?.toLowerCase() !== form.serviceType) {
      currentStep.value = 1;
      showError({ message: "Please select an available service for the selected type." });
      return;
    }

    const isSpa = serviceGroup.type?.toLowerCase() === "spa";
    if (isSpa && !form.durationId) {
      console.warn("Duration is required for spa services");
      return;
    }

    const itemTypeId = isSpa ? form.durationId : form.serviceId;
    if (!itemTypeId) {
      console.warn("Item type id not found");
      return;
    }

    const payload: CreateNewClientBookingPayload = {
      itemType: {
        id: itemTypeId,
        name: serviceItem.name,
        type: serviceGroup.type,
      },
      bookingDate: form.date,
      bookingTime: form.time,
      roomType: isSpa ? form.roomType : undefined,
      fullName: form.fullName,
      ...(clientInfo.phone ? { phoneNumber: clientInfo.phone } : {}),
      email: form.email,
      promoCode: step3Ref.value?.appliedPromo?.isValid ? step3Ref.value.appliedPromo.code : undefined,
      paymentMethod: form.paymentMethod,
    };
    if (payload.bookingTime === "" || payload.itemType.type.toLowerCase() === "session") {
      delete payload.bookingTime;
    }
    await bookingStore.createNewClientBooking(payload);

    success({ message: "Booking created successfully" });
    resetForm();
  }
  catch (error) {
    console.warn("Error creating booking:", error);
    showError({ message: getApiErrorMessage(error, "Failed to create booking") });
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-1 p-8 pt-6 gap-8">
    <div class="flex-1 flex flex-col">
      <FormStepper
        :steps="steps"
        :current-step="currentStep"
        :max-step="Math.max(currentStep, maxReachableStep)"
        :disabled="navigating || loading"
        orientation="horizontal"
        class="mb-8"
        @select="goToStep"
      />

      <div class="flex-1 min-w-0">
        <UForm
          ref="formRef"
          :state="form"
          :schema="currentSchema"
          :validate-on="['input', 'change', 'blur']"
          class="flex flex-col gap-6 min-h-80"
        >
          <div>
            <!-- Step 1: Client Info -->
            <NewClientStepsClientInfoStep
              v-show="currentStep === 0"
              key="step-1"
              v-model="form"
            />

            <!-- Step 2: Schedule -->
            <NewClientStepsScheduleStep
              v-show="currentStep === 1"
              ref="step2Ref"
              key="step-2"
              v-model="form"
            />

            <!-- Step 3: Pricing -->
            <NewClientStepsPricingStep
              v-show="currentStep === 2"
              ref="step3Ref"
              key="step-3"
              v-model="form"
            />
          </div>

          <!-- Navigation -->
          <div
            class="flex items-center"
            :class="currentStep > 0 ? 'justify-between' : 'justify-end'"
          >
            <base-button
              v-if="currentStep > 0"
              variant="outline"
              :disabled="navigating || loading"
              @click="handleBack"
            >
              Back
            </base-button>
            <base-button
              v-if="currentStep < steps.length - 1"
              :loading="navigating"
              :disabled="loading || (currentStep === 1 && (bookingStore.loading || step2Ref?.loadingTimes))"
              @click="handleNext"
            >
              Next
            </base-button>
            <base-button
              v-else
              :loading="loading"
              :disabled="navigating"
              @click="handleCreateBooking"
            >
              Create Booking
            </base-button>
          </div>
        </UForm>
      </div>
    </div>
  </div>
</template>
