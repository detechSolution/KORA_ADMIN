<script setup lang="ts">
import type { Time } from "@internationalized/date";

import { computed, reactive, ref } from "vue";
import z from "zod";

import type { StepItem } from "~/types/booking";

import { ICONS } from "~/config/icons";

const steps: StepItem[] = [
  {
    label: "Member/guest Info",
    description: "Member & guest",
  },
  {
    label: "Schedule",
    description: "Schedule Session/Spa",
  },
  {
    label: "Pricing",
    description: "Price & Payment Method",
  },
];

const methods = {
  cash: {
    label: "Cash",
    description: "paid at counter",
    icon: ICONS.BANKNOTE,
    value: "cash",
  },
  online: {
    label: "Online",
    description: "Fonepay/bank/card transfer",
    icon: ICONS.WIFI,
    value: "online",
  },
};

function formatTimeValue(value: Time | undefined): string {
  if (!value) {
    return "";
  }

  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}
function parseTimeValue(value: string): Time | undefined {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  const [hours = "0", minutes = "0"] = normalizedValue.split(":");
  const hour = Number(hours);
  const minute = Number(minutes);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return undefined;
  }

  return new Time(hour, minute);
}

const bookingStore = useBookingStore();
const currentStep = ref(0);
const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const stepOneSchema = z.object({
  selectedMemberId: z.string().min(1, "Member is required"),
  visitors: z.array(
    z.object({
      fullName: z.string().min(1, "Full name is required"),
      phoneNumber: z.string().min(10, "Phone number is required"),
      email: z.string().email("Invalid email address"),
    }),
  ),
});

const stepTwoSchema = z.object({
  selectedServiceId: z.string().min(1, "Service is required"),
  item: z.object({
    id: z.string().min(1, "Service ID is required"),
    name: z.string().min(1, "Service name is required"),
    type: z.enum(["session", "spa", "pass"], {
      errorMap: () => ({ message: "Invalid service type" }),
    }),
  }),
  bookingDate: z.string().min(1, "Date is required"),
  bookingTime: z.string().min(1, "Time is required"),
});

const stepThreeSchema = z.object({
  selectedPaymentMethod: z.enum(["cash", "online"], {
    errorMap: () => ({ message: "Payment method is required" }),
  }),
  promoCode: z.string().optional(),
});

type Step1Schema = z.infer<typeof stepOneSchema>;
type Step2Schema = z.infer<typeof stepTwoSchema>;
type Step3Schema = z.infer<typeof stepThreeSchema>;
type Booking = Step1Schema & Step2Schema & Step3Schema;

const state = reactive<Partial<Booking>>({
  selectedMemberId: "",
  visitors: [],
  selectedServiceId: "",
  item: {
    id: "",
    name: "",
    type: "session",
  },
  bookingDate: "",
  bookingTime: "",
  selectedPaymentMethod: "cash",
  promoCode: "",
});

const bookingTimeModel = computed({
  get: () => parseTimeValue(state.bookingTime ?? ""),
  set: (value) => {
    state.bookingTime = formatTimeValue(value);
  },
});

// Get schema for current step only
const currentSchema = computed(() => {
  switch (currentStep.value) {
    case 0:
      return stepOneSchema;
    case 1:
      return stepTwoSchema;
    case 2:
      return stepThreeSchema;
    default:
      return stepOneSchema;
  }
});

const memberOptions = [
  { label: "John Doe", value: "john-doe" },
  { label: "Jane Smith", value: "jane-smith" },
];

const serviceOptions = [
  { label: "Morning Yoga Session", value: "morning-yoga" },
  { label: "Spa Day Pass", value: "spa-day-pass" },
];

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

function addVisitor(): void {
  if (!state.visitors)
    state.visitors = [];
  state.visitors.push({
    fullName: "",
    phoneNumber: "",
    email: "",
  });
}

function removeVisitor(index: number): void {
  state.visitors?.splice(index, 1);
}

async function handleCreateBooking(): Promise<void> {
  loading.value = true;
  try {
    await formRef.value?.validate();

    const payload: any = {
      ...state,
    };
    await bookingStore.createBooking(payload);
    success({ message: "Booking created successfully" });
    clearFormData();
    route.push("/bookings");
  }
  catch (error) {
    console.error("Validation failed:", error);
  }
  finally {
    loading.value = false;
  }
}

async function fetchBookingOptions() {
  try {
    const response = bookingStore.getBookingOptions();
    bookingOptions.value = response.data;
  }
  catch (error) {
    console.error("Failed to fetch booking options:", error);
  }
}

onMounted(() => {
  fetchBookingOptions();
});
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <form-stepper
      :steps="steps"
      :current-step="currentStep"
      @select="goToStep"
    />
    <UForm
      ref="formRef"
      :schema="currentSchema"
      :state="state"
      class="flex flex-col gap-6"
    >
      <div class="flex flex-col gap-6">
        <section
          v-if="currentStep === 0"
          key="member"
          class="flex flex-col gap-6"
        >
          <div class="rounded-md bg-white p-4 shadow-sm">
            <base-select
              v-model="state.selectedMemberId"
              name="selectedMemberId"
              label="Select a existing member/guest*"
              placeholder="Select a member"
              :options="memberOptions"
            />
          </div>

          <div
            v-for="(visitor, index) in state.visitors || []"
            :key="index"
            class="flex flex-col gap-4 rounded-md bg-white p-4 shadow-sm"
          >
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <base-input
                v-model="state.visitors![index].fullName"
                :name="`visitors.${index}.fullName`"
                label="Full Name*"
                placeholder="Enter full name"
              />
              <base-input
                v-model="state.visitors![index].phoneNumber"
                :name="`visitors.${index}.phoneNumber`"
                label="Phone Number*"
                placeholder="Enter phone number"
              />
            </div>
            <base-input
              v-model="state.visitors![index].email"
              :name="`visitors.${index}.email`"
              label="Email Address*"
              placeholder="Enter email address"
            />
            <base-button
              variant="ghost"
              :trailing-icon="ICONS.TRASH"
              class="self-end text-red-500 hover:bg-red-100"
              @click="removeVisitor(index)"
            >
              Remove
            </base-button>
          </div>

          <base-button
            variant="outline"
            :leading-icon="ICONS.PLUS"
            @click="addVisitor"
          >
            Add Visitor
          </base-button>
        </section>

        <section
          v-else-if="currentStep === 1"
          key="schedule"
          class="flex flex-col gap-4 rounded-md bg-white p-4 shadow-sm ring-1 ring-stone-200"
        >
          <base-select
            v-model="state.selectedServiceId"
            name="selectedServiceId"
            label="Select Session/Spa Service/Passes*"
            :options="serviceOptions"
            placeholder="Select a session/service"
          />

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <base-date-picker
              v-model="state.bookingDate"
              name="bookingDate"
              label="Date*"
            />
            <UFormField
              label=" Time*"
              name="bookingTime"
              :ui="{
                error: 'mt-1 text-red-500 text-xs',
              }"
            >
              <UInputTime
                v-model="bookingTimeModel"
                :trailing-icon="ICONS.CLOCK"
                label="Time"
                class="w-full"
              />
            </UFormField>
          </div>
        </section>

        <section
          v-else
          key="pricing"
          class="flex flex-col gap-4 rounded-md bg-white p-4 text-sm text-secondary-500 shadow-sm"
        >
          <div class="flex flex-col gap-4 bg-stone-50 p-4 rounded-md border border-stone-200">
            <h2 class="text-base text-secondary font-medium">
              Overview
            </h2>
            <div class="flex justify-between">
              <p class="text-secondary">
                Selected Member
              </p>
              <p class="text-secondary font-medium text-xs">
                Rs. 2000
              </p>
            </div>
            <div class="flex justify-between text-secondary font-normal text-xs">
              <p class="text-secondary-500">
                Promo Discount
              </p>
              <p>
                N/A
              </p>
            </div>
            <div class="flex justify-between text-secondary font-normal text-xs">
              <p class="text-secondary-500">
                Membership Discount
              </p>
              <p>
                10%
              </p>
            </div>
            <USeparator />
            <div class="flex justify-between">
              <p class="text-secondary font-medium">
                Total
              </p>
              <p class="text-secondary font-medium text-sm">
                Rs. 2000
              </p>
            </div>
          </div>

          <div class="flex justify-between gap-4 items-center">
            <div class="w-full">
              <base-input
                v-model="state.promoCode"
                name="promoCode"
                label="Promo Code"
                placeholder="e.g PROMO20"
              />
            </div>
            <base-button
              variant="outline"
              class="self-end"
            >
              Apply
            </base-button>
          </div>

          <div class="flex flex-col gap-4">
            <h2 class="text-sm text-stone-900 font-medium">
              Payment Method
            </h2>

            <div class="flex gap-4">
              <button
                v-for="method in Object.values(methods)"
                :key="method.value"
                type="button"
                class="flex-1 p-4 rounded-lg border-2 transition-colors cursor-pointer"
                :class="[
                  state.selectedPaymentMethod === method.value
                    ? 'border-primary bg-primary/5'
                    : 'border-stone-200 bg-white hover:border-primary/50',
                ]"
                @click="state.selectedPaymentMethod = method.value"
              >
                <div class="flex flex-col gap-2 items-center">
                  <UIcon :name="method.icon" class="w-6 h-6 text-primary" />
                  <p class="text-sm font-medium text-stone-900">
                    {{ method.label }}
                  </p>
                  <p class="text-xs text-stone-600">
                    {{ method.description }}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </section>

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
      </div>
    </UForm>
  </div>
</template>
