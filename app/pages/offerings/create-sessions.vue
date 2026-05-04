<script setup lang="ts">
import { Time } from "@internationalized/date";
import { computed, reactive, ref } from "vue";
import * as z from "zod";

import { ICONS } from "~/config/icons";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.services.create",
});

const currentStep = ref(0);
const loading = ref(false);
const apiError = ref<string | null>(null);
const sessionTypeOptions = ["Class", "Event", "Workshop"] as const;

type ValidatableForm = {
  validate: () => Promise<void>;
};

const formRef = ref<ValidatableForm | null>(null);

const sessionTypeSchema = z.string().min(1, "Session type is required").refine(
  value => sessionTypeOptions.includes(value as typeof sessionTypeOptions[number]),
  { message: "Session type is required" },
);

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
  bannerImage: z.file({ error: "Banner image is required" }),
  bannerVideo: z.file({ error: "Banner video is required" }),
  sessionDescription: z.string().refine(v => stripHtml(v).length > 0, { message: "Description is required" }),
});

const step2Schema = z.object({
  instructorName: z.string().trim().min(1, "Instructor name is required"),
  venue: z.string().trim().min(1, "Venue is required"),
  capacity: z.coerce.number({ message: "Capacity is required" }).int({ message: "Capacity must be a whole number" }).positive("Capacity must be a positive integer"),
  date: z.array(z.string().min(1, "Invalid date")).min(1, "At least one session date is required"),
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
  price: z.coerce.number({ message: "Price is required" }).int({ message: "Price must be a whole number" }).positive("Price must be a positive integer"),
}).superRefine((data, ctx) => {
  if (data.isFreeSession) {
    if (data.price !== undefined && data.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Free sessions should not have a price",
      });
    }
    return;
  }

  if (data.price === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "Price is required",
    });
  }
});

const baseSchema = step1Schema.merge(step2Schema).merge(step3Schema);

const submitSchema = baseSchema.superRefine((data, ctx) => {
  const startTime = parseTimeValue(data.startTime);
  const endTime = parseTimeValue(data.endTime);

  if (!startTime || !endTime || endTime.compare(startTime) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after start time",
    });
  }

  if (data.isFreeSession) {
    if (data.price !== undefined && data.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Free sessions should not have a price",
      });
    }
    return;
  }

  if (data.price === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "Price is required",
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

const form = reactive<Partial<CombinedSchema>>({
  sessionName: "",
  bannerImage: undefined,
  bannerVideo: undefined,
  sessionDescription: "",
  sessionType: "Class",
  instructorName: "",
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

async function handleCreate(): Promise<void> {
  const isValid = await validateCurrentStep();
  if (!isValid)
    return;

  const submission = submitSchema.safeParse(form);
  if (!submission.success) {
    apiError.value = submission.error.issues[0]?.message ?? "Please fix the highlighted fields";
    return;
  }

  try {
    loading.value = true;
    apiError.value = null;
    // TODO: call API to create session with form data
    const payload = submission.data;
    console.log("🚀 ~ handleCreate ~ payload:", payload);
    const formData = new FormData();
    for (const key in payload) {
      formData.append(key, String(payload[key as keyof typeof payload]));
    }
    // await createSession(payload);
    // Show success notification
    // Reset form
    // currentStep.value = 0;
    // form.sessionName = "";
    // form.sessionType = "";
    // form.sessionDescription = "";
    // form.bannerImage = undefined;
    // form.bannerVideo = undefined;
    // form.instructorName = "";
    // form.venue = "";
    // form.capacity = 0;
    // form.date = [];
    // form.startTime = undefined;
    // form.endTime = undefined;
    // form.price = undefined;
    // form.isFreeSession = false;
  }
  catch (err) {
    // Handle error
    apiError.value = err instanceof Error ? err.message : "Failed to create session";
    await formRef.value?.validate();
  }
  finally {
    loading.value = false;
  }
}
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

    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-4 sm:p-6 page-content-height">
      <div class="flex flex-col lg:flex-row gap-6">
        <FormStepper
          :steps="steps"
          :current-step="currentStep"
          aria-label="Session creation progress"
          @select="goToStep"
        />

        <div class="flex-1 min-w-0 lg:pl-0">
          <div class="mb-6 flex items-start gap-3 rounded-lg bg-muted/40 p-4 border border-border">
            <div class="rounded-lg bg-primary/10 p-2 shrink-0">
              <UIcon
                :name="currentStep === 0 ? ICONS.INFO : currentStep === 1 ? ICONS.CALENDAR : ICONS.CREDIT_CARD"
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
                          v-for="type in sessionTypeOptions"
                          :key="type"
                          type="button"
                          class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                          :class="form.sessionType === type
                            ? 'bg-primary-700 text-white shadow-sm'
                            : 'border-primary-100 bg-white text-foreground hover:border-primary-400'"
                          @click="form.sessionType = type"
                        >
                          {{ type }}
                        </button>
                      </div>
                    </UFormField>

                    <base-file-upload
                      v-model="form.bannerImage"
                      accept="image"
                      label="Banner Image*"
                      name="bannerImage"
                      class-names="min-h-48"
                    />

                    <base-file-upload
                      v-model="form.bannerVideo"
                      accept="video"
                      label="Banner Video*"
                      name="bannerVideo"
                      class-names="min-h-48"
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
                    <base-input
                      v-model="form.instructorName"
                      name="instructorName"
                      label="Instructor Name"
                      placeholder="Enter instructor name"
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
                      label="Start Time*"
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
                      label="End Time*"
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
              <base-button :loading="loading" @click="handleCreate">
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
