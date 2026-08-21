<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import z from "zod";

import type { CreateExistingMemberBookingPayload } from "~/types/booking";
import type { StepItem } from "~/types/stepper";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useBookingStore } from "~/stores/booking";
import { useMembershipStore } from "~/stores/membership";
import { preventInvalidNumberInput } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

const steps: StepItem[] = [
  {
    label: "Member/Client & Guest Info",
    description: "Member/Client & Guest",
  },
  {
    label: "Pricing",
    description: "Price & Payment Method",
  },
];

const bookingStore = useBookingStore();
const { success, error: showError } = useNotification();
const membershipStore = useMembershipStore();
const router = useRouter();

const membersOptions = ref<{ label: string; value: number; description: string }[]>([]);
const currentStep = ref(0);
const loading = ref(false);
const formRef = ref<any>(null);
const overviewRef = ref<any>(null);

const visitorSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phoneNumber: z.coerce.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.string().trim().min(1, "Email is required").email("Valid email address"),
  serviceType: z.string().min(1, "Please select a service"),
  serviceId: z.coerce.number({ message: "Please select a service" }).min(1, "Please select a service"),
  date: z.string().min(1, "Please select a date"),
  durationId: z.number().nullable().optional(),
  time: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.serviceType === "spa") {
    if (!data.durationId)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["durationId"], message: "Please select a duration for the spa service" });
    if (!data.time)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["time"], message: "Please select an available time for the spa service" });
  }
});

const stepOneSchema = z.object({
  selectedMemberId: z.number({ message: "Please select a member" }).min(1, "Please select a member"),
  guestOnly: z.boolean(),
  serviceType: z.string().optional(),
  serviceId: z.coerce.number().optional(),
  date: z.string().optional(),
  durationId: z.number().nullable().optional(),
  time: z.string().optional(),
  visitors: z.array(visitorSchema),
}).superRefine((data, ctx) => {
  if (data.guestOnly && data.visitors.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["visitors"], message: "Please add a guest" });
  }

  if (!data.guestOnly) {
    if (!data.serviceType)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["serviceType"], message: "Please select a service" });
    if (!data.serviceId)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["serviceId"], message: "Please select a service" });
    if (!data.date)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "Please select a date" });
  }

  if (!data.guestOnly && data.serviceType === "spa") {
    if (!data.durationId)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["durationId"], message: "Please select a duration for the spa service" });
    if (!data.time)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["time"], message: "Please select an available time for the spa service" });
  }
});

const stepTwoSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
  promoCode: z.string().optional(),
});

const formSchema = computed(() => (currentStep.value === 0 ? stepOneSchema : stepTwoSchema) as any);

const state = reactive({
  selectedMemberId: undefined as number | undefined,
  guestOnly: false,
  paymentMethod: "cash",
  promoCode: "",

  // Member service
  serviceType: "",
  serviceId: undefined as number | undefined,
  durationId: null as number | null,
  date: "" as string,
  time: "" as string,

  // Resolved fields for booking
  resolvedItemId: null as number | null | undefined,
  resolvedItemName: "" as string | undefined,
  resolvedItemType: "" as string | undefined,

  visitors: [] as any[],
});

function emptyVisitor() {
  return {
    fullName: "",
    phoneNumber: "",
    email: "",
    serviceType: "",
    serviceId: undefined,
    durationId: null,
    date: "",
    time: "",
    resolvedItemId: null,
    resolvedItemName: "",
    resolvedItemType: "",
  };
}

async function handleNext(): Promise<void> {
  try {
    await formRef.value?.validate();
    currentStep.value = 1;
  }
  catch (err) {
    console.error("Step 1 validation failed", err);
  }
}

function handleBack(): void {
  currentStep.value = 0;
}

function addVisitor(): void {
  state.visitors.push(emptyVisitor());
}

function removeVisitor(index: number): void {
  state.visitors.splice(index, 1);
}

function resetForm(): void {
  state.selectedMemberId = undefined;
  state.guestOnly = false;
  state.paymentMethod = "cash";
  state.promoCode = "";
  state.serviceType = "";
  state.serviceId = undefined;
  state.durationId = null;
  state.date = "";
  state.time = "";
  state.resolvedItemId = null;
  state.resolvedItemName = "";
  state.resolvedItemType = "";
  state.visitors = [];
}

watch(() => state.guestOnly, (guestOnly) => {
  if (guestOnly && state.visitors.length === 0)
    addVisitor();
});

async function handleCreateBooking(): Promise<void> {
  try {
    await formRef.value?.validate();
    loading.value = true;

    // Build payload
    const visitorsPayload = state.visitors.map(v => ({
      fullName: v.fullName,
      phoneNumber: v.phoneNumber,
      email: v.email,

      item: {
        id: v.resolvedItemId,
        name: v.resolvedItemName,
        type: v.resolvedItemType,
      },
      bookingDate: v.date,
      bookingTime: v.time || undefined,
    }));

    const payload: CreateExistingMemberBookingPayload = {
      selectedMemberId: state.selectedMemberId!,
      visitors: visitorsPayload,
      promoCode: overviewRef.value?.appliedPromo?.code || undefined,
      paymentMethod: state.paymentMethod,
    };

    if (!state.guestOnly) {
      payload.item = {
        id: state.resolvedItemId!,
        name: state.resolvedItemName!,
        type: state.resolvedItemType!,
      };
      payload.bookingDate = state.date;
      if (state.time) {
        payload.bookingTime = state.time;
      }
    }

    await bookingStore.createExistingMemberBooking(payload);
    success({ message: "Booking created successfully!" });
    router.push("/bookings/bookings-list");
    resetForm();
  }
  catch (error) {
    console.error("Booking failed", error);
    showError({ message: getApiErrorMessage(error, "Failed to create booking") });
  }
  finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await membershipStore.getMembersOptions();
  membersOptions.value = membershipStore.membershipOptions.map((m: any) => ({
    label: m.fullName,
    value: m.memberId,
    description: m.email,
  }));
});
</script>

<template>
  <div class="flex flex-1  md:p-8 pt-6 gap-8 min-w-0">
    <div class="flex-1 flex flex-col min-w-0">
      <FormStepper
        :steps="steps"
        :current-step="currentStep"
        orientation="horizontal"
        class="mb-8"
        @select="(step) => step < currentStep && (currentStep = step)"
      />

      <UForm
        ref="formRef"
        :state="state"
        :schema="formSchema"
        class="flex flex-col gap-6 min-w-0"
      >
        <!-- Step 1: Details -->
        <div
          v-show="currentStep === 0"
          class="flex flex-col gap-6"
        >
          <!-- Member Selection -->
          <div class="rounded-xl space-y-6 border border-border bg-muted/20 p-5 sm:p-6 shadow-sm">
            <h3 class="text-sm font-semibold text-stone-700">
              Member / Client
            </h3>
            <base-select-menu
              v-model="state.selectedMemberId"
              name="selectedMemberId"
              label="Select an existing member / guest*"
              placeholder="Select a member"
              :options="membersOptions"
            />
            <UCheckbox
              v-model="state.guestOnly"
              name="guestOnly"
              label="Only guest will attend"
              description="Use the selected member's booking for a new guest."
            />
            <BookingsServiceSelector
              v-if="!state.guestOnly"
              v-model="state"
            />
          </div>

          <!-- Visitors -->
          <div
            v-for="(visitor, index) in state.visitors"
            :key="index"
            class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm space-y-5"
          >
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <base-input
                v-model="visitor.fullName"
                :name="`visitors.${index}.fullName`"
                label="Full Name*"
                placeholder="Enter full name"
              />
              <base-input
                v-model="visitor.phoneNumber"
                :name="`visitors.${index}.phoneNumber`"
                label="Phone Number*"
                placeholder="Enter phone number"
                type="tel"
                @keydown="preventInvalidNumberInput"
              />
            </div>
            <base-input
              v-model="visitor.email"
              :name="`visitors.${index}.email`"
              label="Email Address*"
              placeholder="Enter email address"
            />

            <div class="border-t border-border pt-4">
              <BookingsServiceSelector
                v-model="state.visitors[index]"
                :name-prefix="`visitors.${index}`"
              />
            </div>

            <div class="flex justify-end">
              <base-button
                variant="ghost"
                :trailing-icon="ICONS.TRASH"
                class="text-red-500 hover:bg-red-100"
                @click="removeVisitor(index)"
              >
                Remove
              </base-button>
            </div>
          </div>

          <base-button
            variant="outline"
            :leading-icon="ICONS.PLUS"
            @click="addVisitor"
          >
            Add Guest
          </base-button>

          <div class="flex justify-end">
            <base-button @click="handleNext">
              Next
            </base-button>
          </div>
        </div>

        <!-- Step 2: Pricing -->
        <div
          v-show="currentStep === 1"
          class="flex flex-col gap-6 p-4 bg-white border border-border rounded-2xl min-w-0"
        >
          <BookingsExistingMemberOverview
            ref="overviewRef"
            key="step-2"
            v-model="state"
          />
          <div class="flex justify-between items-center">
            <base-button
              variant="outline"
              @click="handleBack"
            >
              Back
            </base-button>
            <base-button
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
