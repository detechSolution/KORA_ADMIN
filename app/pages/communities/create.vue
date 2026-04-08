<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { SUBSCRIPTION_INTERVAL } from "~/config/constants";
import { ICONS } from "~/config/icons";
import { useCommunitiesStore } from "~/stores/communities";
import { useSubscriptionsStore } from "~/stores/subscriptions";
import { getApiErrorMessage, isApiError } from "~/utils/error";

/** Compute subscription end date from start date and plan interval. Returns null for CUSTOM (user sets manually). */
function getEndDateFromInterval(startDateStr: string, interval: string): string | null {
  if (!startDateStr || !interval)
    return null;
  if (interval === SUBSCRIPTION_INTERVAL.CUSTOM)
    return null;
  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime()))
    return null;
  const end = new Date(start);
  switch (interval) {
    case SUBSCRIPTION_INTERVAL.MONTHLY:
      end.setMonth(end.getMonth() + 1);
      break;
    case SUBSCRIPTION_INTERVAL.QUARTERLY:
      end.setMonth(end.getMonth() + 3);
      break;
    case SUBSCRIPTION_INTERVAL.YEARLY:
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return end.toISOString().slice(0, 10);
}

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "COMMUNITIES.CREATE",
});

const { success, error: showError } = useNotification();
const communitiesStore = useCommunitiesStore();
const subscriptionsStore = useSubscriptionsStore();

const loading = ref(false);
const loadingPlans = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);
const emailError = ref<string | null>(null);
const communityNameError = ref<string | null>(null);
const adminNameError = ref<string | null>(null);

const steps = [
  { label: "Info", description: "Community profile and contact details" },
  { label: "Subscription", description: "Units and subscription plan" },
  { label: "Account", description: "Admin credentials" },
  { label: "Creation", description: "Review and Create" },
];

const currentStep = ref(0);

// Step 1: Info
const step1Schema = z.object({
  communityName: z.string().min(1, "Community name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  email: z.string().min(1, "Contact email is required").email("Invalid email"),
  phone: z.string().min(1, "Contact phone is required").regex(/^\d+$/, "Contact phone must contain only numbers").min(10, "Contact phone is too short").max(10, "Contact phone is too long"),
}).superRefine((data, ctx) => {
  if (communityNameError.value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["communityName"],
      message: communityNameError.value,
    });
  }
});

// Step 2: Subscription
const step2Schema = z
  .object({
    declaredUnits: z.number("Declared units are required").int().positive("Declared units must be a positive number"),
    billedUnits: z.number("Billing units are required").int().positive({ message: "Billing units must be a positive number" }),
    subscriptionPlan: z.number({ message: "Subscription plan is required" }).int().positive({ message: "Subscription plan is required" }),
    subscriptionDateRange: z.object({
      start: z.string().min(1, "Start date is required"),
      end: z.string().min(1, "End date is required"),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.billedUnits > data.declaredUnits) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["billedUnits"],
        message: "Billing units cannot exceed declared units",
      });
    }
    if (data.subscriptionDateRange?.start && data.subscriptionDateRange?.end) {
      const startDate = new Date(data.subscriptionDateRange.start);
      const endDate = new Date(data.subscriptionDateRange.end);
      if (endDate <= startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subscriptionDateRange", "end"],
          message: "End date must be after start date",
        });
      }
    }
  });

// Step 3: Account
const step3Schema = z.object({
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().min(1, "Admin email is required").email("Invalid email"),
  adminPassword: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
}).superRefine((_data, ctx) => {
  if (emailError.value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["adminEmail"],
      message: emailError.value,
    });
  }
  if (adminNameError.value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["adminName"],
      message: adminNameError.value,
    });
  }
});

type Step1Schema = z.output<typeof step1Schema>;
type Step2Schema = z.output<typeof step2Schema>;
type Step3Schema = z.output<typeof step3Schema>;
type CombinedSchema = Step1Schema & Step2Schema & Step3Schema;

const currentSchema = computed(() => {
  if (currentStep.value === 0)
    return step1Schema;
  if (currentStep.value === 1)
    return step2Schema;
  if (currentStep.value === 2)
    return step3Schema;
  return step1Schema; // Step 4 has no form validation
});

const subscriptionPlanOptions = computed(() =>
  subscriptionsStore.subscriptionPlans.data
    .map((plan: any) => ({
      label: `${plan.name} (${plan.interval}) - $${plan.price}`,
      value: plan.id,
    })),
);

const state = reactive<Partial<CombinedSchema>>({
  communityName: "",
  contactName: "",
  address: "",
  city: "",
  state: "",
  email: "",
  phone: "",
  declaredUnits: 0,
  billedUnits: 0,
  subscriptionPlan: "",
  subscriptionDateRange: { start: "", end: "" },
  adminName: "",
  adminEmail: "",
  adminPassword: "",
});

const selectedPlan = computed(() => {
  if (!state.subscriptionPlan)
    return null;
  return subscriptionsStore.subscriptionPlans.data.find(
    (p: any) => p.id === state.subscriptionPlan,
  );
});

// Auto-fill subscription end date when plan (interval) or start date changes (except CUSTOM)
watch(
  () => [
    state.subscriptionPlan,
    state.subscriptionDateRange?.start,
  ] as const,
  ([planId, startStr]) => {
    if (!state.subscriptionDateRange)
      return;
    const start = startStr ?? "";
    if (!start) {
      state.subscriptionDateRange.end = "";
      return;
    }
    const plan = planId
      ? subscriptionsStore.subscriptionPlans.data.find((p: any) => p.id === planId)
      : null;
    const interval = plan?.interval;
    if (!interval) {
      return;
    }
    const end = getEndDateFromInterval(start, interval);
    if (end != null) {
      state.subscriptionDateRange.end = end;
    }
  },
  { immediate: true },
);

const selectedPlanName = computed(() => {
  if (!state.subscriptionPlan)
    return "N/A";
  const plan = selectedPlan.value;
  return plan ? `${plan.name} (${plan.interval}) - $${plan.price}` : state.subscriptionPlan;
});

/** End date is editable only when the selected plan has CUSTOM interval; otherwise it is auto-calculated and disabled. */
const isEndDateEditable = computed(() => selectedPlan.value?.interval === SUBSCRIPTION_INTERVAL.CUSTOM);

/** Error message when end date is before or equal to start date (for inline display). */
const subscriptionDateRangeError = computed(() => {
  const start = state.subscriptionDateRange?.start;
  const end = state.subscriptionDateRange?.end;
  if (!start || !end)
    return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (endDate <= startDate)
    return "End date must be after start date";
  return null;
});

async function getSubscriptionPlans(): Promise<void> {
  try {
    loadingPlans.value = true;
    await subscriptionsStore.getSubscriptionPlans({
      pagination: { page: 1, limit: 100 },
      is_active: true,
    });
  }
  catch {
    showError({ message: "Failed to load subscription plans" });
  }
  finally {
    loadingPlans.value = false;
  }
}

function generatePassword(): void {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  state.adminPassword = pwd;
}

function resetError(field: string): void {
  if (field === "communityName") {
    communityNameError.value = null;
  }
  else if (field === "adminEmail") {
    emailError.value = null;
  }
}

async function validateStep(step: number): Promise<boolean> {
  try {
    if (step === 0) {
      step1Schema.parse({
        communityName: state.communityName,
        address: state.address,
        city: state.city,
        state: state.state,
        contactName: state.contactName,
        email: state.email,
        phone: state.phone,
      });
    }
    else if (step === 1) {
      step2Schema.parse({
        declaredUnits: state.declaredUnits,
        billedUnits: state.billedUnits,
        subscriptionPlan: state.subscriptionPlan,
        subscriptionDateRange: state.subscriptionDateRange,
      });
    }
    else if (step === 2) {
      step3Schema.parse({
        adminName: state.adminName,
        adminEmail: state.adminEmail,
        adminPassword: state.adminPassword,
      });
    }
    return true;
  }
  catch {
    await formRef.value?.validate();
    return false;
  }
}

async function handleNext(): Promise<void> {
  const isValid = await validateStep(currentStep.value);
  if (!isValid)
    return;
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
}

function handleBack(): void {
  currentStep.value = Math.max(currentStep.value - 1, 0);
}

function clearFormData(): void {
  currentStep.value = 0;
  state.communityName = "";
  state.contactName = "";
  state.address = "";
  state.city = "";
  state.state = "";
  state.email = "";
  state.phone = "";
  state.declaredUnits = 0;
  state.billedUnits = 0;
  state.subscriptionPlan = "";
  state.subscriptionDateRange = { start: "", end: "" };
  state.adminName = "";
  state.adminEmail = "";
  state.adminPassword = "";
}

async function handleActivate(): Promise<void> {
  try {
    loading.value = true;
    const payload: any = {
      community_name: state.communityName,
      contact_name: state.contactName,
      address: state.address,
      city: state.city,
      state: state.state,
      email: state.email,
      phone: state.phone,
      declared_units: state.declaredUnits,
      billed_units: state.billedUnits,
      subscription_plan_id: state.subscriptionPlan,
      subscription_start_date: state.subscriptionDateRange?.start,
      subscription_end_date: state.subscriptionDateRange?.end,
      admin: {
        name: state.adminName,
        email: state.adminEmail,
        password: state.adminPassword,
      },
    };
    await communitiesStore.createCommunity(payload);
    success({
      message: "Community has been created successfully.",
    });
    clearFormData();
  }
  catch (err: unknown) {
    if (isApiError(err) && err.data?.code === "communities.name.exists") {
      communityNameError.value = err.data?.message ?? "A community with this name already exists.";
      formRef.value?.validate();
      currentStep.value = 0;
      return;
    }
    showError({ message: getApiErrorMessage(err, "Failed to create community") });
  }
  finally {
    loading.value = false;
  }
}

onMounted(() => {
  getSubscriptionPlans();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Create Community
      </template>
      <template #description>
        Add a new community with profile, subscription, and admin account.
      </template>
      <template #actions>
        <NuxtLink to="/communities/list">
          <base-button
            variant="outline"
            size="md"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            Back to List
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-4 sm:p-6 page-content-height">
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="lg:hidden flex items-center justify-between gap-2 px-1 py-3 border-b border-border">
          <span class="text-sm font-medium text-muted-foreground">
            Step {{ currentStep + 1 }} of {{ steps.length }}
          </span>
          <div class="flex gap-1.5">
            <button
              v-for="(step, index) in steps"
              :key="step.label"
              type="button"
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors"
              :class="[
                index === currentStep
                  ? 'bg-primary text-primary-foreground border-primary'
                  : index < currentStep
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border',
              ]"
              :aria-label="`Go to step ${index + 1}: ${step.label}`"
              @click="index <= currentStep && (currentStep = index)"
            >
              <UIcon
                v-if="index < currentStep"
                :name="ICONS.CHECK"
                class="w-3.5 h-3.5"
              />
              <span v-else>{{ index + 1 }}</span>
            </button>
          </div>
        </div>

        <nav
          class="hidden lg:flex lg:flex-col lg:w-56 xl:w-64 shrink-0 lg:border-r lg:border-border lg:pr-8"
          aria-label="Progress"
        >
          <template
            v-for="(step, index) in steps"
            :key="step.label"
          >
            <div class="flex items-start gap-3">
              <div class="flex flex-col items-center shrink-0">
                <button
                  type="button"
                  class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border-2 shrink-0 transition-colors"
                  :class="[
                    index === currentStep
                      ? 'bg-primary text-primary-foreground border-primary'
                      : index < currentStep
                        ? 'bg-primary/10 text-primary border-primary cursor-pointer hover:bg-primary/20'
                        : 'bg-muted text-muted-foreground border-border cursor-default',
                  ]"
                  :aria-current="index === currentStep ? 'step' : undefined"
                  @click="index <= currentStep && (currentStep = index)"
                >
                  <UIcon
                    v-if="index < currentStep"
                    :name="ICONS.CHECK"
                    class="w-4 h-4"
                  />
                  <span v-else>{{ index + 1 }}</span>
                </button>
                <div
                  v-if="index < steps.length - 1"
                  class="w-px h-10 my-0.5"
                  :class="index < currentStep ? 'bg-primary' : 'bg-border'"
                />
              </div>
              <div class="flex flex-col pt-1 min-w-0">
                <span
                  class="text-sm font-medium whitespace-nowrap"
                  :class="index === currentStep ? 'text-foreground' : 'text-muted-foreground'"
                >
                  {{ step.label }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ step.description }}
                </span>
              </div>
            </div>
          </template>
        </nav>

        <div class="flex-1 min-w-0 lg:pl-0">
          <div class="mb-6 flex items-start gap-3 rounded-lg bg-muted/40 p-4 border border-border">
            <div class="rounded-lg bg-primary/10 p-2 shrink-0">
              <UIcon
                :name="currentStep === 0 ? ICONS.BUILDING : currentStep === 1 ? ICONS.SUBSCRIPTIONS : currentStep === 2 ? ICONS.USERS : ICONS.CHECK_CIRCLE"
                class="h-5 w-5 text-primary"
              />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-foreground">
                {{ steps[currentStep]?.label ?? "" }}
              </h2>
              <p class="text-sm text-muted-foreground mt-0.5">
                {{ steps[currentStep]?.description ?? "" }}
              </p>
            </div>
          </div>
          <UForm
            ref="formRef"
            :state="state"
            :schema="currentSchema"
            :validate-on="['input', 'change', 'blur']"
            class="flex flex-col gap-6 min-h-[320px]"
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
                <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm">
                  <h3 class="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                    <UIcon :name="ICONS.BUILDING" class="h-4 w-4 text-muted-foreground" />
                    Community Profile
                  </h3>
                  <p class="text-xs text-muted-foreground mb-4">
                    Basic information about the community and primary contact.
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <base-input
                      v-model="state.communityName"
                      name="communityName"
                      label="Community Name"
                      placeholder="Enter community name"
                      @input="resetError('communityName')"
                    />
                    <base-input
                      v-model="state.contactName"
                      name="contactName"
                      label="Contact Name"
                      placeholder="Enter contact name"
                    />
                    <base-input
                      v-model="state.email"
                      name="email"
                      label="Email"
                      type="email"
                      placeholder="contact@example.com"
                    />
                    <base-input
                      v-model="state.phone"
                      name="phone"
                      label="Phone"
                      type="tel"
                      placeholder="e.g. 9851012345"
                    />
                    <base-input
                      v-model="state.address"
                      name="address"
                      label="Address"
                      placeholder="Address"
                    />
                    <base-input
                      v-model="state.city"
                      name="city"
                      label="City"
                      placeholder="City"
                    />
                    <base-input
                      v-model="state.state"
                      name="state"
                      label="State"
                      placeholder="State"
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
                  <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
                    <UIcon :name="ICONS.SUBSCRIPTIONS" class="h-4 w-4 text-muted-foreground" />
                    Billing Units
                  </h3>
                  <p class="text-xs text-muted-foreground mb-2">
                    Declared and billing units for this community.
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <base-input
                      v-model.number="state.declaredUnits"
                      name="declaredUnits"
                      label="Declared Units"
                      type="number"
                      min="0"
                    />
                    <base-input
                      v-model.number="state.billedUnits"
                      name="billedUnits"
                      label="Billing Units"
                      type="number"
                      min="1"
                    >
                      <template #description>
                        Final units used for billing. Editable only by Baha Super Admin.
                      </template>
                    </base-input>
                  </div>
                </div>
                <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm">
                  <h3 class="text-sm font-semibold text-foreground mb-2">
                    Subscription Plan
                  </h3>
                  <p class="text-xs text-muted-foreground mb-4">
                    Select a plan and set the subscription period.
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <base-select
                      v-model="state.subscriptionPlan"
                      name="subscriptionPlan"
                      label="Subscription Plan"
                      placeholder="Select plan"
                      :options="subscriptionPlanOptions"
                      :loading="loadingPlans"
                    />
                    <template v-if="state.subscriptionDateRange">
                      <base-date-picker
                        v-model="state.subscriptionDateRange.start"
                        name="subscriptionStartDate"
                        label="Start Date"
                        placeholder="Select start date"
                        :no-of-months="1"
                        required
                      />
                      <div class="flex flex-col gap-1">
                        <base-date-picker
                          v-model="state.subscriptionDateRange.end"
                          name="subscriptionEndDate"
                          label="End Date"
                          :placeholder="isEndDateEditable ? 'Select end date' : 'Auto-calculated from plan'"
                          :no-of-months="1"
                          :disabled="!isEndDateEditable"
                          required
                        />
                        <p
                          v-if="subscriptionDateRangeError"
                          class="text-xs text-destructive"
                          role="alert"
                        >
                          {{ subscriptionDateRangeError }}
                        </p>
                      </div>
                    </template>
                  </div>
                </div>
              </section>

              <section
                v-else-if="currentStep === 2"
                key="step-3"
                class="space-y-6"
              >
                <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm">
                  <h3 class="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                    <UIcon :name="ICONS.USERS" class="h-4 w-4 text-muted-foreground" />
                    Admin Credentials
                  </h3>
                  <p class="text-xs text-muted-foreground mb-4">
                    Create the primary admin account for this community.
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <base-input
                      v-model="state.adminName"
                      name="adminName"
                      label="Admin Name"
                      placeholder="Enter admin name"
                    />
                    <base-input
                      v-model="state.adminEmail"
                      name="adminEmail"
                      label="Admin Email"
                      type="email"
                      placeholder="admin@example.com"
                      @input="resetError('adminEmail')"
                    />
                    <div class="flex flex-col gap-1">
                      <base-input
                        v-model="state.adminPassword"
                        name="adminPassword"
                        label="Password"
                        type="password"
                        placeholder="Min 6 characters"
                      />
                      <base-button
                        variant="ghost"
                        size="sm"
                        class="self-end"
                        @click="generatePassword"
                      >
                        Generate Password
                      </base-button>
                    </div>
                  </div>
                </div>
              </section>

              <section
                v-else
                key="step-4"
                class="space-y-6"
              >
                <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm">
                  <h3 class="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                    <UIcon :name="ICONS.CHECK_CIRCLE" class="h-4 w-4 text-muted-foreground" />
                    Review & Activate
                  </h3>
                  <p class="text-sm text-muted-foreground mb-6">
                    Review the summary below. When you click
                    <span class="font-semibold text-foreground">Create Community</span>,
                    the community will be created and listed under Communities.
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div class="space-y-1">
                      <p class="text-xs font-medium text-muted-foreground">
                        Community Profile
                      </p>
                      <p class="rounded-md border border-border bg-background p-3">
                        {{ state.communityName || "N/A" }} · {{ state.address || "No address" }}
                      </p>
                    </div>
                    <div class="space-y-1">
                      <p class="text-xs font-medium text-muted-foreground">
                        Units & Subscription
                      </p>
                      <p class="rounded-md border border-border bg-background p-3">
                        Declared: {{ state.declaredUnits ?? "N/A" }}, Billing: {{ state.billedUnits ?? "N/A" }} ·
                        Plan: {{ selectedPlanName }}
                        <span v-if="state.subscriptionDateRange?.start && state.subscriptionDateRange?.end">
                          · {{ state.subscriptionDateRange.start }} to {{ state.subscriptionDateRange.end }}
                        </span>
                      </p>
                    </div>
                    <div class="space-y-1 md:col-span-2">
                      <p class="text-xs font-medium text-muted-foreground">
                        Admin
                      </p>
                      <p class="rounded-md border border-border bg-background p-3">
                        {{ state.adminName || "N/A" }} ({{ state.adminEmail || "N/A" }})
                      </p>
                    </div>
                  </div>
                  <div class="flex justify-end mt-6">
                    <base-button
                      :loading="loading"
                      @click="handleActivate"
                    >
                      Create Community
                    </base-button>
                  </div>
                </div>
              </section>
            </Transition>

            <div
              v-if="currentStep < 3"
              class="flex items-center "
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
          </UForm>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-fade-enter-active,
.step-fade-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.step-fade-enter-from,
.step-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
