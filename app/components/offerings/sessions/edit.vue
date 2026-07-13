<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import z from "zod";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useInstructorsStore } from "~/stores/instructors";
import { useSessionsStore } from "~/stores/sessions";
import { formatTimeValue, parseTimeValue } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

const props = defineProps<Props>();
const emit = defineEmits(["closeSessionDrawer", "updateSessionList"]);

const { success, error: showError } = useNotification();
const sessionsStore = useSessionsStore();
const instructorsStore = useInstructorsStore();

type Props = {
  open: boolean;
  session: any;
};

const currentStep = ref(0);
const loading = ref(false);
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

const formRef = ref<InstanceType<typeof UForm> | null>(null);

const steps = [
  { title: "Session Info" },
  { title: "Schedule" },
  { title: "Pricing" },
];

function stripHtml(input: string | undefined | null): string {
  if (!input)
    return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const sessionTypeSchema = z.string().min(1, "Session type is required");
const timeValueSchema = z.string().min(1, "Please select a valid time");

const step1Schema = z.object({
  sessionName: z.string().trim().min(1, "Session name is required"),
  sessionType: sessionTypeSchema,
  bannerImage: z.string().or(z.instanceof(File)),
  bannerVideo: z.string().or(z.instanceof(File)).optional(),
  sessionDescription: z.string().refine(v => stripHtml(v).length > 0, { message: "Description is required" }),
}).superRefine((data, ctx) => {
  if (data.bannerImage instanceof File) {
    if (!data.bannerImage.type.startsWith("image/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bannerImage"], // Field name
        message: "Banner image must be an image file",
      });
    }
  }
  if (data.bannerVideo instanceof File) {
    if (!data.bannerVideo.type.startsWith("video/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bannerVideo"], // Field name
        message: "Banner video must be a video file",
      });
    }
  }
});

const step2Schema = z.object({
  instructorId: z.coerce.number().min(1, "Instructor is required"),
  venue: z.string().trim().min(1, "Venue is required"),
  capacity: z.coerce.number({ message: "Capacity is required" }).int({ message: "Capacity must be a whole number" }).positive("Capacity must be a positive integer"),
  date: z.string().min(1, "Invalid date").min(1, "At least one session date is required"),
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
  price: z.coerce.number({ message: "Price is required" }).int({ message: "Price must be a whole number" }),
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
  date: "",
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

async function validateCurrentStep(): Promise<boolean> {
  try {
    await formRef.value?.validate();
    return true;
  }
  catch {
    return false;
  }
}

function handleBack(): void {
  currentStep.value = Math.max(currentStep.value - 1, 0);
}

async function handleNext(): Promise<void> {
  const isValid = await validateCurrentStep();
  if (!isValid)
    return;
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
}

async function handleUpdateSession(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    loading.value = true;
    if (typeof form.bannerImage == "string") {
      delete form.bannerImage;
    }
    if (typeof form.bannerVideo == "string") {
      delete form.bannerVideo;
    }

    await sessionsStore.updateSession(props.session.id, form);
    success({ message: "Session updated successfully" });
    emit("updateSessionList");
    handleCloseSessionDrawer();
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to update session. Please try again.") });
  }
  finally {
    loading.value = false;
  }
}

function handleCloseSessionDrawer(): void {
  emit("closeSessionDrawer");
  currentStep.value = 0;
}

watch(() => props.session, (newValue) => {
  if (newValue) {
    form.sessionName = newValue.name;
    form.sessionType = newValue.type;
    form.bannerImage = newValue.bannerUrl;
    form.bannerVideo = newValue.videoUrl;
    form.sessionDescription = newValue.description;
    form.instructorId = newValue.instructorId;
    form.venue = newValue.venue;
    form.capacity = newValue.capacity;
    form.date = newValue.sessionDate || "";
    form.startTime = newValue.startTime;
    form.endTime = newValue.endTime;
    form.price = newValue.price;
    form.isFreeSession = newValue.isFree;
  }
}, { immediate: true });

onMounted(() => {
  void instructorsStore.fetchInstructors();
});
</script>

<template>
  <base-drawer
    :open="open"
    :drawer-width="600"
    title="Edit session"
    @close="handleCloseSessionDrawer"
  >
    <UForm
      ref="formRef"
      :state="form"
      :schema="currentSchema"
      :validate-on="['blur']"
      class="flex flex-col justify-between h-full overflow-auto [scrollbar-width:thin]"
    >
      <div class="flex flex-col space-y-3">
        <FormEditStepper
          :steps="steps"
          :current-step="currentStep"
        />

        <section v-if="currentStep === 0" class="grid gap-5 px-5 pb-6">
          <base-input
            v-model="form.sessionName"
            name="name"
            label="Spa Type Name"
            placeholder="e.g. Oil massage, stone healing"
            required
          />

          <UFormField
            name="sessionType"
            label="Session Type"
            :ui="{
              error: 'mt-1 text-red-500 text-xs',
            }"
            required
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
            label="Banner Image"
            name="bannerImage"
            class-names="min-h-32"
            required
          />

          <base-file-upload
            v-model="form.bannerVideo"
            accept="video"
            label="Banner Video"
            name="bannerVideo"
            class-names="min-h-32"
          />

          <base-text-editor
            v-model="form.sessionDescription"
            name="sessionDescription"
            label="About this session"
            placeholder="Enter the session description details here..."
            class="w-full min-h-30 max-h-60 overflow-y-auto"
            required
          />
        </section>

        <section
          v-else-if="currentStep === 1"
          key="step-2"
          class="space-y-6"
        >
          <div class="grid gap-5 px-5">
            <base-select-searchable
              v-model="form.instructorId"
              name="instructorId"
              label="Instructor Name"
              placeholder="Select instructor"
              :options="instructorOptions"
              :loading="instructorsStore.loading"
              required
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
        </section>

        <section
          v-else-if="currentStep === 2"
          key="step-3"
          class="space-y-6"
        >
          <div class="grid gap-5 px-5">
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
      </div>

      <div>
        <USeparator class="pb-4" />
        <div
          v-if="currentStep < 2"
          class="flex items-center px-5 pb-6"
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
        <div v-else class="flex items-center justify-between px-5 pb-6">
          <base-button variant="outline" @click="handleBack">
            Back
          </base-button>
          <base-button :loading="loading" @click="handleUpdateSession">
            Update Session
          </base-button>
        </div>
      </div>
    </UForm>
  </base-drawer>
</template>

<style scoped>

</style>
