<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import z from "zod";

import type { CreateNewClientBookingPayload } from "~/types/booking";

import { findServiceGroup, findServiceItem } from "~/composables/services/use-booking";
import { useNotification } from "~/composables/use-notification";
import { useBookingStore } from "~/stores/booking";
import { getApiErrorMessage } from "~/utils/error";

/* ── State ──────────────────────────────────────────────── */

const loading = ref(false);
const currentStep = ref(0);
const bookingStore = useBookingStore();
const { success, error: showError } = useNotification();

const step2Ref = ref<any>(null);
const step3Ref = ref<any>(null);

const steps = [
  { id: 1, title: "Client Info", description: "Client contact info" },
  { id: 2, title: "Schedule", description: "Schedule Session/Spa" },
  { id: 3, title: "Pricing", description: "Price & Payment Method" },
];

/* ── Schemas ────────────────────────────────────────────── */

const step1Schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  email: z.string().min(1, "Email address is required").email("Invalid email address"),
});

const step2Schema = z.object({
  serviceType: z.string().min(1, "Service type is required"),
  serviceId: z.coerce.number().min(1, "Service selection is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  durationId: z.number().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.serviceType === "spa") {
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
type FormState = Partial<Step1 & Step2 & Step3>;

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
  promoCode: "",
  paymentMethod: "cash",
});

/* ── Navigation ─────────────────────────────────────────── */

type ValidatableForm = { validate: () => Promise<void> };
const formRef = ref<ValidatableForm | null>(null);

async function handleNext(): Promise<void> {
  if (!await validateCurrentStep())
    return;
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
}

async function validateCurrentStep(): Promise<boolean> {
  try {
    await formRef.value?.validate();
    if (currentStep.value === 1 && step2Ref.value) {
      const { showDuration, spaAvailableDays, weekdayFromDate } = step2Ref.value;
      if (showDuration) {
        const allowed = spaAvailableDays ?? [];
        const weekday = weekdayFromDate(form.date);
        if (!weekday || !allowed.includes(weekday)) {
          return false;
        }
      }
    }
    return true;
  }
  catch {
    return false;
  }
}

function handleBack(): void {
  currentStep.value = Math.max(currentStep.value - 1, 0);
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
  form.promoCode = "";
  form.paymentMethod = "cash";

  currentStep.value = 0;
}
async function handleCreateBooking(): Promise<void> {
  if (!await validateCurrentStep())
    return;

  try {
    loading.value = true;

    if (!form.serviceId || !form.date || !form.fullName || !form.email || !form.paymentMethod) {
      console.warn("Missing required fields");
      return;
    }

    const serviceItem = findServiceItem(form.serviceId);
    if (!serviceItem) {
      console.warn("Service item not found");
      return;
    }

    const serviceGroup = findServiceGroup(form.serviceId);
    if (!serviceGroup) {
      console.warn("Service group not found");
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

    const payload = {
      itemType: {
        id: itemTypeId,
        name: serviceItem.name,
        type: serviceGroup.type,
      },
      bookingDate: form.date,
      bookingTime: form.time,
      fullName: form.fullName,
      phoneNumber: form.phone || "",
      email: form.email,
      promoCode: form.promoCode || undefined,
      paymentMethod: form.paymentMethod,
    };
    if (payload.bookingTime === "")
      delete payload.bookingTime;
    await bookingStore.createNewClientBooking(payload as CreateNewClientBookingPayload);

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
        orientation="horizontal"
        class="mb-8"
        @select="(step) => currentStep = step"
      />

      <div class="flex-1 min-w-0">
        <UForm
          ref="formRef"
          :state="form"
          :schema="currentSchema"
          :validate-on="['input', 'change', 'blur']"
          class="flex flex-col gap-6 min-h-80"
        >
          <Transition name="step-fade" mode="out-in">
            <!-- Step 1: Client Info -->
            <NewClientStepsClientInfoStep
              v-if="currentStep === 0"
              key="step-1"
              v-model="form"
            />

            <!-- Step 2: Schedule -->
            <NewClientStepsScheduleStep
              v-else-if="currentStep === 1"
              ref="step2Ref"
              key="step-2"
              v-model="form"
            />

            <!-- Step 3: Pricing -->
            <NewClientStepsPricingStep
              v-else-if="currentStep === 2"
              ref="step3Ref"
              key="step-3"
              v-model="form"
            />
          </Transition>

          <!-- Navigation -->
          <div
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
            <base-button
              v-if="currentStep < steps.length - 1"
              @click="handleNext"
            >
              Next
            </base-button>
            <base-button
              v-else
              :loading="loading"
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
