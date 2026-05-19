<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import z from "zod";

import type { CreateExistingMemberBookingPayload, StepItem } from "~/types/booking";

import { findServiceGroup, findServiceItem } from "~/composables/services/use-booking";
import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useBookingStore } from "~/stores/booking";
import { useMembershipStore } from "~/stores/membership";

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

const bookingStore = useBookingStore();
const { success } = useNotification();
const membershipStore = useMembershipStore();

const membersOptions = ref([]);
const currentStep = ref(0);
const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const stepOneSchema = z.object({
  selectedMemberId: z.coerce.number().min(1, "Member is required"),
  visitors: z.array(
    z.object({
      fullName: z.string().min(1, "Full name is required"),
      phoneNumber: z.string().min(10, "Phone number is required"),
      email: z.string().email("Invalid email address"),
    }),
  ),
});

const stepTwoSchema = z.object({
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

const stepThreeSchema = z.object({
  promoCode: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required").refine(
    v => ["cash", "online"].includes(v),
    "Invalid payment method",
  ),
});

type Step1Schema = z.infer<typeof stepOneSchema>;
type Step2Schema = z.infer<typeof stepTwoSchema>;
type Step3Schema = z.infer<typeof stepThreeSchema>;
type Booking = Step1Schema & Step2Schema & Step3Schema;

const state = reactive<Partial<Booking>>({
  selectedMemberId: undefined,
  visitors: [],
  serviceType: "",
  serviceId: undefined,
  date: "",
  time: "",
  durationId: null,
  promoCode: "",
  paymentMethod: "cash",
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

function clearFormData(): void {
  state.selectedMemberId = undefined;
  state.visitors = [];
  state.serviceType = "";
  state.serviceId = undefined;
  state.date = "";
  state.time = "";
  state.durationId = null;
  state.promoCode = "";
  state.paymentMethod = "cash";

  currentStep.value = 0;
}

async function handleCreateBooking(): Promise<void> {
  loading.value = true;
  try {
    loading.value = true;

    const serviceItem = findServiceItem(state.serviceId);
    if (!serviceItem) {
      console.warn("Service item not found");
      return;
    }

    const serviceGroup = findServiceGroup(state.serviceId);
    if (!serviceGroup) {
      console.warn("Service group not found");
      return;
    }

    const isSpa = serviceGroup.type?.toLowerCase() === "spa";
    if (isSpa && !state.durationId) {
      console.warn("Duration is required for spa services");
      return;
    }

    const itemTypeId = isSpa ? state.durationId : state.serviceId;
    if (!itemTypeId) {
      console.warn("Item type id not found");
      return;
    }

    const payload = {
      selectedMemberId: state.selectedMemberId,
      item: {
        id: itemTypeId,
        name: serviceItem.name,
        type: serviceGroup.type,
      },
      visitors: state.visitors,
      bookingDate: state.date,
      bookingTime: state.time,
      promoCode: state.promoCode || undefined,
      paymentMethod: state.paymentMethod,
    };
    if (payload.bookingTime === "")
      delete payload.bookingTime;
    await bookingStore.createExistingMemberBooking(payload as CreateExistingMemberBookingPayload);

    success({ message: "Booking created successfully" });
    clearFormData();
  }
  catch (error) {
    console.error("Validation failed:", error);
  }
  finally {
    loading.value = false;
  }
}

async function fetchMembersOptions() {
  await membershipStore.getMembersOptions();

  membersOptions.value = membershipStore.membershipOptions.map((option: any) => ({
    label: option.fullName,
    value: option.memberId,
    description: option.email,
  }));
}

onMounted(() => fetchMembersOptions());
</script>

<template>
  <div class="flex flex-1 p-8 pt-6 gap-8">
    <div class="flex-1 flex flex-col">
      <FormStepper
        :steps="steps"
        :current-step="currentStep"
        orientation="horizontal"
        class="mb-8"
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
            <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm">
              <base-select-menu
                v-model="state.selectedMemberId"
                name="selectedMemberId"
                label="Select a existing member/guest*"
                placeholder="Select a member"
                :options="membersOptions"
              />
            </div>

            <div
              v-for="(visitor, index) in state.visitors || []"
              :key="index"
              class="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm"
            >
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <base-input
                  v-model="state.visitors[index].fullName"
                  :name="`visitors.${index}.fullName`"
                  label="Full Name*"
                  placeholder="Enter full name"
                />
                <base-input
                  v-model="state.visitors[index].phoneNumber"
                  :name="`visitors.${index}.phoneNumber`"
                  label="Phone Number*"
                  placeholder="Enter phone number"
                />
              </div>
              <base-input
                v-model="state.visitors[index].email"
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

          <!-- Step 2: Schedule -->
          <NewClientStepsScheduleStep
            v-else-if="currentStep === 1"
            key="step-2"
            v-model="state"
          />

          <!-- Step 3: Pricing -->
          <NewClientStepsPricingStep
            v-else-if="currentStep === 2"
            key="step-3"
            v-model="state"
          />

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
  </div>
</template>
