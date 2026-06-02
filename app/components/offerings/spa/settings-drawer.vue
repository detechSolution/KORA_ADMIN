<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import type { Day, Spa } from "~/types/spa";

import { useNotification } from "~/composables/use-notification";
import { useSpaStore } from "~/stores/spa";
import { formatTimeValue, parseTimeValue } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

type Props = {
  open: boolean;
  spa: Spa | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const spaStore = useSpaStore();
const { success, error: showError } = useNotification();

const loading = ref(false);
const formRef = ref<InstanceType<typeof UForm> | null>(null);

const dayOptions: { label: string; value: Day }[] = [
  { label: "Mon", value: "mon" },
  { label: "Tue", value: "tue" },
  { label: "Wed", value: "wed" },
  { label: "Thu", value: "thu" },
  { label: "Fri", value: "fri" },
  { label: "Sat", value: "sat" },
  { label: "Sun", value: "sun" },
];

const schema = z.object({
  availableDays: z
    .array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))
    .min(1, "Select at least one day"),
  availableFromTime: z.string().min(1, "Please select a valid time"),
  availableToTime: z.string().min(1, "Please select a valid time"),
  capacityPerSlot: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? undefined : Number(trimmed);
      }

      return value;
    },
    z
      .number()
      .refine(
        value => !Number.isNaN(value) && value > 0,
        "Capacity must be greater than 0",
      ),
  ),
  videoFile: z.string().or(z.instanceof(File)).optional(),
  imageFile: z.string().or(z.instanceof(File)).optional(),
}).superRefine((data, ctx) => {
  if (data.imageFile instanceof File) {
    if (!data.imageFile.type.startsWith("image/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imageFile"], // Field name
        message: "Banner image must be an image file",
      });
    }
  }
  if (data.videoFile instanceof File) {
    if (!data.videoFile.type.startsWith("video/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoFile"], // Field name
        message: "Banner video must be a video file",
      });
    }
  }

  if (data.availableFromTime && data.availableToTime) {
    const fromTime = parseTimeValue(data.availableFromTime);
    const toTime = parseTimeValue(data.availableToTime);

    if (fromTime && toTime) {
      const fromDate = new Date(2000, 0, 1, fromTime.hour, fromTime.minute);
      const toDate = new Date(2000, 0, 1, toTime.hour, toTime.minute);

      if (fromDate >= toDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["availableToTime"],
          message: "To time must be after from time",
        });
      }
    }
  }
});

type Schema = z.output<typeof schema>;

const form = reactive<Partial<Schema>>({
  availableDays: [] as Day[],
  availableFromTime: "",
  availableToTime: "",
  capacityPerSlot: undefined,
  videoFile: undefined,
  imageFile: undefined,
});

const availableFromTimeModel = computed({
  get: () => parseTimeValue(form.availableFromTime ?? ""),
  set: (value) => {
    form.availableFromTime = formatTimeValue(value);
  },
});

const availableToTimeModel = computed({
  get: () => parseTimeValue(form.availableToTime ?? ""),
  set: (value) => {
    form.availableToTime = formatTimeValue(value);
  },
});

function populateForm(spa: Spa | null): void {
  form.availableDays = spa?.availableDays ? [...spa.availableDays] : [];
  form.availableFromTime = formatTimeValue(parseTimeValue(spa?.availableFromTime ?? ""));
  form.availableToTime = formatTimeValue(parseTimeValue(spa?.availableToTime ?? ""));
  form.capacityPerSlot = spa?.capacityPerSlot;
  form.videoFile = spa?.videoUrl ?? undefined;
  form.imageFile = spa?.bannerUrl ?? undefined;
}

function closeDrawer(): void {
  emit("close");
}

function toggleDay(day: Day): void {
  if (form.availableDays.includes(day)) {
    form.availableDays = form.availableDays.filter(item => item !== day);
    return;
  }

  form.availableDays = [...form.availableDays, day];
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
  }
  catch {
    return;
  }

  try {
    loading.value = true;

    const payload = {
      availableDays: form.availableDays ?? [],
      availableFromTime: form.availableFromTime ?? "",
      availableToTime: form.availableToTime ?? "",
      capacityPerSlot: form.capacityPerSlot ?? 0,
      video: form.videoFile,
      file: form.imageFile,
    };

    if (typeof payload.file === "string")
      delete payload.file;
    if (typeof payload.video === "string")
      delete payload.video;
    await spaStore.updateSpa(payload);
    success({ message: "Spa updated successfully" });
    emit("updated");
    closeDrawer();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to update spa.") });
  }
  finally {
    loading.value = false;
  }
}

watch(
  () => props.spa,
  (newValue) => {
    if (newValue) {
      populateForm(newValue);
    }
  },
  { immediate: true },
);
</script>

<template>
  <base-drawer
    title="Edit Spa"
    :open="open"
    :drawer-width="600"
    @close="emit('close')"
  >
    <UForm
      ref="formRef"
      :state="form"
      :schema="schema"
      :validate-on="['input', 'change', 'blur']"
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex-1 overflow-y-auto px-5 py-5">
        <div class="grid gap-5">
          <base-file-upload
            v-model="form.imageFile"
            accept="image"
            label="Service Image"
            name="imageFile"
          />

          <base-file-upload
            v-model="form.videoFile"
            accept="video"
            label="Service Video"
            name="videoFile"
          />

          <UFormField
            name="availableDays"
            label="Available Days"
            required
            :ui="{ error: 'mt-1 text-red-500 text-xs' }"
          >
            <div class="flex flex-wrap gap-2">
              <button
                v-for="day in dayOptions"
                :key="day.value"
                type="button"
                class="rounded-md border px-3 py-2 text-xs font-medium transition"
                :class="
                  form.availableDays.includes(day.value)
                    ? 'border-primary-700 bg-primary-700 text-white'
                    : 'border-stone-200 bg-white text-secondary-400 hover:border-primary-300 hover:text-secondary'
                "
                @click="toggleDay(day.value)"
              >
                {{ day.label }}
              </button>
            </div>
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              name="availableFromTime"
              label="From"
              required
              :ui="{ error: 'mt-1 text-red-500 text-xs' }"
            >
              <UInputTime
                v-model="availableFromTimeModel"
                granularity="minute"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="availableToTime"
              label="To"
              required
              :ui="{ error: 'mt-1 text-red-500 text-xs' }"
            >
              <UInputTime
                v-model="availableToTimeModel"
                granularity="minute"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid gap-2">
            <UFormField
              name="capacityPerSlot"
              label="Capacity Per Slot"
              required
              :ui="{ error: 'mt-1 text-red-500 text-xs' }"
            >
              <UInput
                v-model="form.capacityPerSlot"
                type="number"
                placeholder="e.g. 3"
                class="w-full"
              />
            </UFormField>

            <p class="text-xs text-secondary-400">
              e.g. 3 clients at once
            </p>
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between border-t border-stone-200 px-5 py-4"
      >
        <base-button
          variant="outline"
          size="md"
          @click="closeDrawer"
        >
          Cancel
        </base-button>

        <base-button
          variant="solid"
          size="md"
          :loading="loading"
          @click="handleSubmit"
        >
          Update
        </base-button>
      </div>
    </UForm>
  </base-drawer>
</template>
