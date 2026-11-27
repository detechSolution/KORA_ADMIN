<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import { computed, reactive, ref, watch } from "vue";
import z from "zod";

import type { CreateManualBookingPayload } from "~/types/booking";
import type { MemberBookingOption } from "~/types/membership";
import type { StepItem } from "~/types/stepper";

import { useNotification } from "~/composables/use-notification";
import { SESSION_TYPE } from "~/config/constants";
import { useBookingStore } from "~/stores/booking";
import { useMembershipStore } from "~/stores/membership";
import { availableBookingTickets } from "~/utils/booking-lines";
import { getApiErrorMessage } from "~/utils/error";

const steps: StepItem[] = [
  { label: "Client & Service", description: "Client and schedule" },
  { label: "Pricing", description: "Price and payment method" },
];

const bookingStore = useBookingStore();
const membershipStore = useMembershipStore();
const { success, error: showError } = useNotification();
const router = useRouter();
const currentStep = ref(0);
const loading = ref(false);
const searching = ref(false);
const searchError = ref("");
const searchTerm = ref("");
const clientResults = ref<MemberBookingOption[]>([]);
let searchRequestId = 0;
const formRef = ref<{ validate: () => Promise<void> } | null>(null);
const overviewRef = ref<{
  appliedPromo?: { code: string; isValid: boolean } | null;
} | null>(null);

const state = reactive({
  clientKind: "" as "existing" | "new" | "",
  selectedMemberId: undefined as number | undefined,
  clientName: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  paymentMethod: "cash",
  promoCode: "",
  serviceType: "",
  serviceId: undefined as number | undefined,
  durationId: null as number | null,
  sessionQuantity: null as number | null,
  roomType: "private" as "private" | "shared",
  date: "",
  time: "",
  resolvedItemId: null as number | null | undefined,
  resolvedItemName: "" as string | undefined,
  resolvedItemType: "" as string | undefined,
  resolvedPrice: undefined as number | undefined,
  resolvedDurationLabel: "" as string | undefined,
});

const bookingSchema = z
  .object({
    clientKind: z.string(),
    selectedMemberId: z.number().optional(),
    fullName: z.string().optional(),
    email: z.string().optional(),
    phoneNumber: z.string().optional(),
    serviceType: z.string(),
    serviceId: z.coerce
      .number({ message: "Please select a service" })
      .min(1, "Please select a service"),
    date: z.string().min(1, "Please select a date"),
    durationId: z.number().nullable().optional(),
    sessionQuantity: z.number().int().min(1).nullable().optional(),
    time: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.clientKind === "existing" && !data.selectedMemberId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedMemberId"],
        message: "Select a client",
      });
    }
    if (data.clientKind === "new") {
      if (!data.fullName?.trim() || data.fullName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fullName"],
          message: "Enter the client's full name",
        });
      }
      if (
        !data.email?.trim()
        || !z.string().email().safeParse(data.email.trim()).success
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Enter a valid email address",
        });
      }
    }
    if (data.serviceType === "session") {
      const item = bookingStore.bookingItemOptions
        .flatMap(group => group.items)
        .find(option => option.id === data.serviceId);
      const sessionType = String(item?.sessionType ?? "").toLowerCase();
      if (
        sessionType === SESSION_TYPE.EVENT
        || sessionType === SESSION_TYPE.WORKSHOP
      ) {
        const available = availableBookingTickets(item);
        if (!data.sessionQuantity) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sessionQuantity"],
            message: "Select a quantity",
          });
        }
        else if (data.sessionQuantity > Math.min(20, available)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sessionQuantity"],
            message: "Quantity exceeds available spots",
          });
        }
      }
    }
    if (data.serviceType === "spa") {
      if (!data.durationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["durationId"],
          message: "Select a spa duration",
        });
      }
      if (!data.time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["time"],
          message: "Select an available spa time",
        });
      }
    }
  });

const paymentSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
  promoCode: z.string().optional(),
});
const formSchema = computed(() =>
  currentStep.value === 0 ? bookingSchema : paymentSchema,
);

const searchClients = useDebounceFn(async (term: string) => {
  const requestId = ++searchRequestId;
  const query = term.trim();
  searchError.value = "";
  if (query.length < 3) {
    clientResults.value = [];
    searching.value = false;
    return;
  }
  searching.value = true;
  try {
    const matches = await membershipStore.getMembersOptions({
      q: query,
    });
    if (requestId === searchRequestId)
      clientResults.value = matches;
  }
  catch (error) {
    if (requestId === searchRequestId) {
      searchError.value = getApiErrorMessage(
        error,
        "Could not search clients. Try again.",
      );
    }
  }
  finally {
    if (requestId === searchRequestId)
      searching.value = false;
  }
}, 300);
watch(searchTerm, (term) => {
  searchRequestId++;
  clientResults.value = [];
  searchError.value = "";
  searching.value = false;
  void searchClients(term);
});

const selectedClient = computed(() =>
  clientResults.value.find(item => item.memberId === state.selectedMemberId),
);
const needsNewClient = computed(() => state.clientKind === "new");

function chooseClient(client: MemberBookingOption): void {
  if (!client.memberId) {
    showError({
      message:
        "This account does not have a booking profile. Please add them as a new client or contact support.",
    });
    return;
  }
  state.clientKind = "existing";
  state.selectedMemberId = client.memberId;
  state.clientName = client.fullName;
  state.fullName = client.fullName;
  state.email = client.email ?? "";
  state.phoneNumber = client.phoneNumber ?? "";
}

function startNewClient(): void {
  state.clientKind = "new";
  state.selectedMemberId = undefined;
  state.clientName = "";
  const query = searchTerm.value.trim();
  const emailQuery = query.includes("@");
  const phoneQuery
    = !emailQuery
      && /^[+\d\s().-]+$/.test(query)
      && query.replace(/\D/g, "").length >= 7;
  if (!emailQuery && !phoneQuery && !state.fullName)
    state.fullName = query;
  if (emailQuery && !state.email && z.string().email().safeParse(query).success)
    state.email = query;
  if (phoneQuery && !state.phoneNumber && /^[0-9+\-\s]{7,20}$/.test(query))
    state.phoneNumber = query;
}

function changeClient(): void {
  if (state.clientKind === "existing") {
    state.fullName = "";
    state.email = "";
    state.phoneNumber = "";
  }
  state.clientKind = "";
  state.selectedMemberId = undefined;
  state.clientName = "";
}

async function handleNext(): Promise<void> {
  try {
    await formRef.value?.validate();
    if (needsNewClient.value) {
      state.fullName = state.fullName.trim();
      state.email = state.email.trim();
      state.clientName = state.fullName;
    }
    currentStep.value = 1;
  }
  catch {
    // The form renders field-level validation messages.
  }
}

function handleBack(): void {
  currentStep.value = 0;
}

function clientTypeLabel(type: string): string {
  const names: Record<string, string> = {
    membership_plan_user: "Member",
    pass_user: "Pass holder",
    member: "Member",
    guest: "Guest",
    user: "Walk-in",
  };
  return names[type] ?? "Client";
}

function formatDate(value: string | null): string {
  if (!value)
    return "";
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString();
}

async function createBooking(): Promise<void> {
  try {
    const bookingValidation = bookingSchema.safeParse(state);
    if (!bookingValidation.success) {
      currentStep.value = 0;
      showError({
        message:
          "Please review the client and service details before creating the booking.",
      });
      return;
    }
    await formRef.value?.validate();
    loading.value = true;
    const quantity = state.sessionQuantity ?? 1;
    const payload: CreateManualBookingPayload = {
      client:
        state.clientKind === "existing"
          ? { kind: "existing", memberId: state.selectedMemberId! }
          : {
              kind: "new",
              fullName: state.fullName.trim(),
              email: state.email.trim(),
              ...(state.phoneNumber.trim()
                ? { phoneNumber: state.phoneNumber.trim() }
                : {}),
            },
      item: {
        id: state.resolvedItemId!,
        name: state.resolvedItemName!,
        type: state.resolvedItemType!,
        quantity,
      },
      bookingDate: state.date,
      ...(state.time && state.serviceType !== "session"
        ? { bookingTime: state.time }
        : {}),
      ...(state.serviceType === "spa" ? { roomType: state.roomType } : {}),
      promoCode: overviewRef.value?.appliedPromo?.isValid
        ? overviewRef.value.appliedPromo.code
        : undefined,
      paymentMethod: state.paymentMethod,
    };
    await bookingStore.createManualBooking(payload);
    success({ message: "Booking created successfully!" });
    await router.push("/bookings/bookings-list");
  }
  catch (error) {
    showError({
      message: getApiErrorMessage(error, "Failed to create booking"),
    });
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-1 md:p-8 pt-6 gap-8 min-w-0">
    <div class="flex-1 flex flex-col min-w-0">
      <FormStepper
        :steps="steps"
        :current-step="currentStep"
        orientation="horizontal"
        class="mb-8"
      />
      <UForm
        ref="formRef"
        :state="state"
        :schema="formSchema"
        class="flex flex-col gap-6 min-w-0"
      >
        <div v-show="currentStep === 0" class="flex flex-col gap-6">
          <section
            class="rounded-xl border border-border bg-white p-5 sm:p-6 shadow-sm space-y-4"
          >
            <div>
              <h2 class="font-semibold text-stone-900">
                Who is this booking for?
              </h2>
              <p class="text-sm text-stone-500">
                Search members, pass holders, walk-ins and invited guests.
              </p>
            </div>
            <div
              v-if="state.clientKind === 'existing'"
              class="flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4"
            >
              <div class="min-w-0">
                <p class="font-semibold">
                  {{ state.clientName }}
                </p>
                <p class="text-sm text-stone-500">
                  {{ state.phoneNumber
                  }}<span v-if="state.phoneNumber && state.email" />{{ state.email }}
                </p>
                <p
                  v-if="
                    selectedClient?.membershipPlanName
                      || selectedClient?.passName
                  "
                  class="text-xs text-stone-500 mt-1"
                >
                  {{
                    selectedClient?.membershipPlanName
                      || selectedClient?.passName
                  }}
                  <span v-if="selectedClient?.endDate">
                    active until {{ formatDate(selectedClient.endDate) }}</span>
                </p>
                <base-badge v-if="selectedClient" class="mt-2">
                  {{
                    clientTypeLabel(selectedClient.type)
                  }}
                </base-badge>
              </div>
              <button
                type="button"
                class="text-sm underline"
                @click="changeClient"
              >
                Change client
              </button>
            </div>
            <template v-else-if="needsNewClient">
              <div
                class="space-y-4 rounded-lg border border-stone-200 bg-stone-50/60 p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <h3 class="font-semibold">
                    Add as new client
                  </h3>
                  <button
                    type="button"
                    class="text-sm underline"
                    @click="changeClient"
                  >
                    Back to search
                  </button>
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <base-input
                    v-model="state.fullName"
                    name="fullName"
                    label="Full name *"
                    placeholder="As on ID"
                  />
                  <base-input
                    v-model="state.phoneNumber"
                    name="phoneNumber"
                    label="Phone (optional)"
                    placeholder="98XXXXXXXX"
                  />
                  <base-input
                    v-model="state.email"
                    name="email"
                    label="Email *"
                    placeholder="Booking confirmation and app login"
                    class="sm:col-span-2"
                  />
                </div>
                <p class="text-xs text-stone-500">
                  The system checks the email and phone before creating the
                  client, to prevent duplicate accounts.
                </p>
              </div>
            </template>
            <template v-else>
              <div>
                <base-input
                  v-model="searchTerm"
                  name="clientSearch"
                  label="Name, phone or email"
                  placeholder="e.g. Sita, 98XXXXXXXX or sita@email.com"
                />
              </div>
              <p class="text-xs text-stone-500">
                Enter at least 3 characters. Email and phone match exactly;
                names match partially. Phone matches with or without +977.
              </p>
              <div v-if="searching" class="text-sm text-stone-500">
                Searching clients...
              </div>
              <p
                v-else-if="searchError"
                role="alert"
                class="text-sm text-red-600"
              >
                {{ searchError }}
              </p>
              <div
                v-else-if="
                  searchTerm.trim().length >= 3 && clientResults.length
                "
                class="overflow-hidden rounded-lg border border-stone-200 bg-white divide-y divide-stone-200"
              >
                <button
                  v-for="client in clientResults"
                  :key="client.userId"
                  type="button"
                  class="flex w-full items-center justify-between gap-4 p-3 text-left transition-colors hover:bg-stone-50"
                  @click="chooseClient(client)"
                >
                  <span class="min-w-0">
                    <span class="flex flex-wrap items-center gap-2 font-medium">{{ client.fullName }}
                      <base-badge>{{
                        clientTypeLabel(client.type)
                      }}</base-badge></span>
                    <span class="block text-xs text-stone-500">{{ client.phoneNumber || "No phone" }} |
                      {{ client.email || "No email"
                      }}<template
                        v-if="client.membershipPlanName || client.passName"
                      >
                        |
                        {{
                          client.membershipPlanName || client.passName
                        }}</template><template v-if="client.endDate">
                        | until {{ formatDate(client.endDate) }}</template></span>
                  </span>
                  <span
                    class="shrink-0 rounded-md bg-stone-900 px-3 py-2 text-sm text-white"
                  >Select</span>
                </button>
              </div>
              <div
                v-else-if="searchTerm.trim().length >= 3 && !searching"
                class="flex flex-col items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p class="font-medium">
                    No client found for {{ searchTerm }}
                  </p>
                  <p class="text-stone-500">
                    Search checked existing member, pass holder, walk-in and
                    guest accounts.
                  </p>
                </div>
                <base-button
                  variant="outline"
                  @click="startNewClient"
                >
                  Add as new client
                </base-button>
              </div>
            </template>
          </section>

          <section
            class="rounded-xl border border-border bg-white p-5 sm:p-6 shadow-sm"
          >
            <BookingsServiceSelector v-model="state" />
          </section>
          <div class="flex justify-end">
            <base-button
              :disabled="!state.clientKind"
              @click="handleNext"
            >
              Next
            </base-button>
          </div>
        </div>

        <div
          v-show="currentStep === 1"
          class="flex flex-col gap-6 rounded-2xl border border-border bg-white p-4 min-w-0"
        >
          <BookingsExistingMemberOverview ref="overviewRef" v-model="state" />
          <div class="flex justify-between items-center">
            <base-button
              variant="outline"
              @click="handleBack"
            >
              Back
            </base-button>
            <base-button
              :loading="loading"
              @click="createBooking"
            >
              Create Booking
            </base-button>
          </div>
        </div>
      </UForm>
    </div>
  </div>
</template>
