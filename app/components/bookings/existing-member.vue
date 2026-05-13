<script setup lang="ts">
import { ref } from "vue";

import { ICONS } from "~/config/icons";

type Step = {
  label: string;
  description: string;
};

type Visitor = {
  fullName: string;
  phone: string;
  email: string;
};

const steps: Step[] = [
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

const currentStep = ref(0);
const selectedMember = ref("");
const selectedService = ref("");
const selectedDate = ref<string | null>(null);
const selectedTime = ref("");
const loading = ref(false);
const visitors = ref<Visitor[]>([]);
const selectedPaymentMethod = ref("cash");

const memberOptions = [
  { label: "John Doe", value: "john-doe" },
  { label: "Jane Smith", value: "jane-smith" },
];

const serviceOptions = [
  { label: "Morning Yoga Session", value: "morning-yoga" },
  { label: "Spa Day Pass", value: "spa-day-pass" },
];

function goToStep(step: number): void {
  currentStep.value = step;
}

function handleNext(): void {
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
}

function handleBack(): void {
  currentStep.value = Math.max(currentStep.value - 1, 0);
}

function addVisitor(): void {
  visitors.value.push({
    fullName: "",
    phone: "",
    email: "",
  });
}

function removeVisitor(index: number): void {
  visitors.value.splice(index, 1);
}

async function handleCreateBooking(): Promise<void> {
  loading.value = true;
  try {
    await formRef.value?.validate();
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex w-full flex-col gap-6 ">
    <form-stepper
      :steps="steps"
      :current-step="currentStep"
      @select="goToStep"
    />

    <div class="flex flex-col gap-6">
      <section
        v-if="currentStep === 0"
        key="member"
        class="flex flex-col gap-6"
      >
        <div class="rounded-md bg-white p-4 shadow-sm  ">
          <base-select
            v-model="selectedMember"
            name="member"
            label="Select a existing member/guest*"
            placeholder="Select a member"
            :options="memberOptions"
          />
        </div>

        <div
          v-for="(visitor, index) in visitors"
          :key="index"
          class="flex flex-col gap-4 rounded-md bg-white p-4 shadow-sm  "
        >
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <base-input
              v-model="visitor.fullName"
              :name="`visitor-${index}-name`"
              label="Full Name*"
              placeholder="Enter full name"
            />
            <base-input
              v-model="visitor.phone"
              :name="`visitor-${index}-phone`"
              label="Phone Number*"
              placeholder="Enter phone number"
            />
          </div>
          <base-input
            v-model="visitor.email"
            :name="`visitor-${index}-email`"
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
          v-model="selectedService"
          name="service"
          label="Select Session/Spa Service/Passes*"
          :options="serviceOptions"
          placeholder="Select a session/service"
        />

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <base-date-picker
            v-model="selectedDate"
            name="bookingDate"
            label="Select Date*"
          />
          <UFormField label="Select Time*" name="bookingTime">
            <UInputTime
              v-model="selectedTime"
              class="w-full"
            />
          </UFormField>
        </div>
      </section>

      <section
        v-else
        key="pricing"
        class="flex flex-col gap-4 rounded-md bg-white p-4 text-sm text-secondary-500 shadow-sm "
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
            <bookings-payment-method
              v-for="method in methods"
              :key="method.label"
              :title="method.label"
              :description="method.description"
              :icon="method.icon"
              :is-active="selectedPaymentMethod === method.value"
              @click="selectedPaymentMethod = method.value"
            />
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
  </div>
</template>
