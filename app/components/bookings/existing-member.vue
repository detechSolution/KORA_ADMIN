<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import { computed, onMounted, reactive, ref, watch } from "vue";
import z from "zod";

import type { CreateExistingMemberBookingPayload } from "~/types/booking";
import type { StepItem } from "~/types/stepper";

import { useNotification } from "~/composables/use-notification";
import { useBookingStore } from "~/stores/booking";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

const steps: StepItem[] = [
  {
    label: "Member/Client  Info",
    description: "Member/Client",
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
const memberSearchTerm = ref("");
const currentStep = ref(0);
const loading = ref(false);
const formRef = ref<any>(null);
const overviewRef = ref<any>(null);

const stepOneSchema = z.object({
  selectedMemberId: z.number({ message: "Please select a member" }).min(1, "Please select a member"),
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

const stepTwoSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
  promoCode: z.string().optional(),
});

const formSchema = computed(() => (currentStep.value === 0 ? stepOneSchema : stepTwoSchema) as any);

const state = reactive({
  selectedMemberId: undefined as number | undefined,
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

});

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

function resetForm(): void {
  state.selectedMemberId = undefined;
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
}

const loadMembersOptions = useDebounceFn(async (q = ""): Promise<void> => {
  const selectedMember = membersOptions.value.find(
    member => member.value === state.selectedMemberId,
  );
  const selectedMemberData = (membershipStore.membershipOptions as any[]).find(
    member => member.memberId === state.selectedMemberId,
  );

  await membershipStore.getMembersOptions({ q: q.trim() });

  if (
    selectedMemberData
    && !(membershipStore.membershipOptions as any[]).some(
      member => member.memberId === selectedMemberData.memberId,
    )
  ) {
    membershipStore.membershipOptions.unshift(selectedMemberData);
  }

  const options = membershipStore.membershipOptions.map((m: any) => ({
    label: m.label,
    value: m.memberId,
    description: m.email,
  }));

  if (selectedMember && !options.some(option => option.value === selectedMember.value))
    options.unshift(selectedMember);

  membersOptions.value = options;
}, 300);

watch(memberSearchTerm, loadMembersOptions);

async function handleCreateBooking(): Promise<void> {
  try {
    await formRef.value?.validate();
    loading.value = true;

    const payload: CreateExistingMemberBookingPayload = {
      selectedMemberId: state.selectedMemberId!,
      promoCode: overviewRef.value?.appliedPromo?.code || undefined,
      paymentMethod: state.paymentMethod,
      item: {
        id: state.resolvedItemId!,
        name: state.resolvedItemName!,
        type: state.resolvedItemType!,
      },
      bookingDate: state.date,
      bookingTime: state.time || undefined,
    };

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
  await loadMembersOptions();
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
            <base-select-menu
              v-model="state.selectedMemberId"
              v-model:search-term="memberSearchTerm"
              name="selectedMemberId"
              label="Select an existing member*"
              placeholder="Select a member"
              :options="membersOptions"
            />
            <BookingsServiceSelector
              v-model="state"
            />
          </div>

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
