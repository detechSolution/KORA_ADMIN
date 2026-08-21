<script setup lang="ts">
import { Time } from "@internationalized/date";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import * as z from "zod";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useInstructorsStore } from "~/stores/instructors";
import { useSessionsStore } from "~/stores/sessions";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.sessions.create",
});

const { success, error: showError } = useNotification();
const sessionsStore = useSessionsStore();
const instructorsStore = useInstructorsStore();
const router = useRouter();

const currentStep = ref(0);
const loading = ref(false);
const apiError = ref<string | null>(null);
const sessionTypeOptions = [
  { label: "Class", value: "class" },
  { label: "Event", value: "event" },
  { label: "Workshop", value: "workshop" },
];

const instructorOptions = computed(() =>
  instructorsStore.instructors.data
    .filter((i: any) => i.isActive)
    .map((i: any) => ({
      label: i.fullName,
      value: i.id,
    })),
);

type ValidatableForm = {
  validate: () => Promise<void>;
};

const formRef = ref<ValidatableForm | null>(null);

const sessionTypeSchema = z.string().min(1, "Session type is required");

const timeValueSchema = z.string().min(1, "Please select a valid time");

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

function stripHtml(input: string | undefined | null): string {
  if (!input)
    return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTimeValue(value: Time | undefined): string {
  if (!value) {
    return "";
  }

  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}

const step1Schema = z.object({
  sessionName: z.string().trim().min(1, "Session name is required"),
  sessionType: sessionTypeSchema,
  bannerImage: z.string().or(z.instanceof(File)),
  bannerVideo: z.string().or(z.instanceof(File)),
  sessionDescription: z.string().refine(v => stripHtml(v).length > 0, { message: "Description is required" }),
});

const step2Schema = z.object({
  instructorId: z.union([
    z.coerce.number({ message: "Please select a valid instructor" }).int("Please select a valid instructor"),
    z.null(),
  ]).optional(),
  venue: z.string().trim().min(1, "Please enter a venue"),
  capacity: z.coerce.number({ message: "Please enter a capacity" }).int({ message: "Capacity must be a number" }).positive("Capacity must be at least 1"),
  date: z.array(z.string().min(1, "Please select a valid date")).min(1, "Please add at least one date"),
  startTime: timeValueSchema,
  endTime: timeValueSchema,
}).superRefine((data, ctx) => {
  const startTime = parseTimeValue(data.startTime);
  const endTime = parseTimeValue(data.endTime);

  if (!startTime || !endTime || endTime.compare(startTime) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after start time",
    });
  }
});

const step3Schema = z.object({
  isFreeSession: z.boolean(),
  price: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
  // If it's a free session, no price validation needed
  if (data.isFreeSession) {
    return;
  }

  // If it's NOT a free session, price must be provided and greater than 0
  if (!data.isFreeSession) {
    if (data.price === undefined || data.price === null || data.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Price is required and must be greater than 0",
      });
    }
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

const form = reactive<Partial<CombinedSchema>>({
  sessionName: "",
  bannerImage: undefined,
  bannerVideo: undefined,
  sessionDescription: "",
  sessionType: "class",
  instructorId: undefined,
  venue: "",
  capacity: 0,
  date: [],
  startTime: "",
  endTime: "",
  price: undefined,
  isFreeSession: false,
});

const startTimeModel = computed({
  get: () => parseTimeValue(form.startTime ?? ""),
  set: (value) => {
    form.startTime = formatTimeValue(value);
  },
});

const endTimeModel = computed({
  get: () => parseTimeValue(form.endTime ?? ""),
  set: (value) => {
    form.endTime = formatTimeValue(value);
  },
});

type StepItem = {
  label: string;
  description: string;
};

const steps: StepItem[] = [
  { label: "Session Info", description: "Session name & details" },
  { label: "Schedule", description: "Date, time, & capacity" },
  { label: "Pricing", description: "Costs & payment rules" },
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

function clearFormData(): void {
  currentStep.value = 0;
  form.sessionName = "";
  form.sessionType = "Class";
  form.sessionDescription = "";
  form.bannerImage = undefined;
  form.bannerVideo = undefined;
  form.instructorId = undefined;
  form.venue = "";
  form.capacity = 0;
  form.date = [];
  form.startTime = undefined;
  form.endTime = undefined;
  form.price = undefined;
  form.isFreeSession = false;
}

async function handleCreateSession(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    loading.value = true;
    apiError.value = null;

    const payload: any = {
      ...form,
    };
    await sessionsStore.createSession(payload);
    success({
      message: "Session created successfully",
    });
    clearFormData();

    router.push("/offerings/session");
  }
  catch (err) {
    showError({ message: getApiErrorMessage(err, "Failed to create community") });
  }
  finally {
    loading.value = false;
  }
}

watch(() => form.isFreeSession, (isFree) => {
  if (isFree) {
    form.price = 0;
  }
});

onMounted(async () => {
  await instructorsStore.fetchInstructors();
  if (sessionsStore.sessionToCopy) {
    const s = sessionsStore.sessionToCopy;
    form.sessionName = s.name;
    form.sessionType = s.type;
    form.sessionDescription = s.description;
    form.instructorId = s.instructorId;
    form.venue = s.venue;
    form.capacity = s.capacity;
    // Date in list is usually a single string sessionDate, but create expects an array
    // form.date = s.sessionDate ? [s.sessionDate] : [];
    // form.startTime = s.startTime;
    // form.endTime = s.endTime;
    form.price = s.price;
    form.isFreeSession = s.isFree;
    form.bannerImage = s.bannerUrl;
    form.bannerVideo = s.videoUrl;

    // Reset the copy state so it doesn't persist on next visit
    sessionsStore.sessionToCopy = null;
  }
});
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <base-page-header>
      <template #title>
        Create Session
      </template>

      <template #description>
        Create classes, spa sessions, events and workshops
      </template>

      <template #actions>
        <NuxtLink to="/offerings/session">
          <base-button
            variant="outline"
            size="md"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            Back to list
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6 page-content-height">
      <div class="flex flex-col lg:flex-row gap-6">
        <FormStepper
          :steps="steps"
          :current-step="currentStep"
          aria-label="Session creation progress"
          @select="goToStep"
        />

        <div class="flex-1 min-w-0 lg:pl-0 space-y-6">
          <form-header-card
            :label="steps[currentStep]?.label ?? ''"
            :description="steps[currentStep]?.description ?? ''"
            :icon="currentStep === 0 ? ICONS.INFO : currentStep === 1 ? ICONS.CALENDAR : ICONS.CREDIT_CARD"
          />

          <UForm
            ref="formRef"
            :state="form"
            :schema="currentSchema"
            :validate-on="['input', 'change', 'blur']"
            class="flex flex-col gap-6 min-h-80"
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
                  <div class="grid grid-cols-1 gap-4">
                    <base-input
                      v-model="form.sessionName"
                      name="sessionName"
                      label="Session Name"
                      placeholder="Enter session name"
                    />

                    <UFormField
                      name="sessionType"
                      label="Session Type*"
                      :ui="{
                        error: 'mt-1 text-red-500 text-xs',
                      }"
                    >
                      <div class="flex flex-wrap gap-2">
                        <button
                          v-for="(type, index) in sessionTypeOptions"
                          :key="index"
                          type="button"
                          class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                          :class="form.sessionType === type.value
                            ? 'bg-primary-700 text-white shadow-sm'
                            : 'border-primary-100 bg-white text-foreground hover:border-primary-400'"
                          @click="form.sessionType = type.value"
                        >
                          {{ type.label }}
                        </button>
                      </div>
                    </UFormField>

                    <base-file-upload
                      v-model="form.bannerImage"
                      accept="image"
                      label="Banner Image*"
                      name="bannerImage"
                      class-names="min-h-32"
                    />

                    <base-file-upload
                      v-model="form.bannerVideo"
                      accept="video"
                      label="Banner Video*"
                      name="bannerVideo"
                      class-names="min-h-32"
                    />

                    <base-text-editor
                      v-model="form.sessionDescription"
                      name="sessionDescription"
                      label="About this session*"
                      placeholder="Enter the session description details here..."
                      class="w-full min-h-30 max-h-60 overflow-y-auto"
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
                    <base-select-searchable
                      v-model="form.instructorId"
                      name="instructorId"
                      label="Instructor Name"
                      placeholder="Select instructor"
                      :options="instructorOptions"
                      :loading="instructorsStore.loading"
                      clearable
                    />
                    <base-input
                      v-model="form.venue"
                      name="venue"
                      label="Venue"
                      placeholder="Enter venue location"
                    />
                    <base-input
                      v-model.number="form.capacity"
                      name="capacity"
                      label="Capacity"
                      type="number"
                      placeholder="Max participants"
                    />
                    <base-date-picker
                      v-model="form.date"
                      name="date"
                      label="Session Dates"
                      multiple
                      :no-of-months="1"
                    />
                    <UFormField
                      name="startTime"
                      label="Start Time"
                      :ui="{
                        error: 'mt-1 text-red-500 text-xs',
                      }"
                    >
                      <UInputTime
                        v-model="startTimeModel"
                        label="Start Time"
                        :trailing-icon="ICONS.CLOCK"
                        class="w-full"
                      />
                    </UFormField>
                    <UFormField
                      name="endTime"
                      label="End Time"
                      :ui="{
                        error: 'mt-1 text-red-500 text-xs',
                      }"
                    >
                      <UInputTime
                        v-model="endTimeModel"
                        label="End Time"
                        :trailing-icon="ICONS.CLOCK"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                </div>
              </section>

              <section
                v-else-if="currentStep === 2"
                key="step-3"
                class="space-y-6"
              >
                <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm space-y-6">
                  <div class="flex justify-between items-center bg-stone-50 border border-stone-300 rounded-lg p-4">
                    <div>
                      <span class="text-sm text-stone-900">Free session</span>
                      <p class="text-xs text-muted-foreground">
                        Toggle if this session is free of charge
                      </p>
                    </div>
                    <base-switch
                      v-model="form.isFreeSession"
                      label=""
                      name="isFreeSession"
                      :show-label="false"
                    />
                  </div>

                  <div class="h-px w-full bg-stone-200 rounded-lg" />

                  <div class="">
                    <base-input
                      v-model.number="form.price"
                      name="price"
                      label="Price (Rs)"
                      type="number"
                      placeholder="Enter session price"
                      :min="1"
                      :disabled="form.isFreeSession"
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

<style scoped>

</style>
