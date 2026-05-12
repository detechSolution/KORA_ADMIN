<script setup lang="ts">
import { Time } from "@internationalized/date";
import { computed, reactive, ref, watch } from "vue";
import * as z from "zod";

import type { Day, Spa } from "~/types/spa";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useSpaStore } from "~/stores/spa";
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
const videoInputRef = ref<HTMLInputElement | null>(null);
const selectedVideoFile = ref<File | null>(null);

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
  availableFromTime: z.string().min(1, "From time is required"),
  availableToTime: z.string().min(1, "To time is required"),
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
  videoName: z.string().min(1, "Spa video is required"),
});

const form = reactive({
  availableDays: [] as Day[],
  availableFromTime: "",
  availableToTime: "",
  capacityPerSlot: undefined as number | undefined,
  videoName: "",
});

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => {
    if (!value) {
      emit("close");
    }
  },
});

const availableFromTimeModel = computed({
  get: () => parseTimeString(form.availableFromTime),
  set: (value) => {
    form.availableFromTime = formatTimeValue(value);
  },
});

const availableToTimeModel = computed({
  get: () => parseTimeString(form.availableToTime),
  set: (value) => {
    form.availableToTime = formatTimeValue(value);
  },
});

const existingVideoName = computed(() => {
  if (!props.spa?.videoUrl) {
    return "";
  }

  return props.spa.videoUrl.split("/").pop() ?? "";
});

function parseTimeString(value: string): Time | undefined {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.trim();
  const twelveHourMatch = normalizedValue.match(
    /^(\d{1,2}):(\d{2})\s*([AP]M)$/i,
  );

  if (twelveHourMatch) {
    const [, rawHours = "0", rawMinutes = "0", meridiem = "AM"]
      = twelveHourMatch;
    const parsedHours = Number(rawHours);
    const minute = Number(rawMinutes);

    if (Number.isNaN(parsedHours) || Number.isNaN(minute)) {
      return undefined;
    }

    const normalizedHours
      = (parsedHours % 12) + (meridiem.toUpperCase() === "PM" ? 12 : 0);
    return new Time(normalizedHours, minute);
  }

  const [hours = "0", minutes = "0"] = normalizedValue.split(":");
  const hour = Number(hours);
  const minute = Number(minutes);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return undefined;
  }

  return new Time(hour, minute);
}

function formatTimeValue(value: Time | undefined): string {
  if (!value) {
    return "";
  }

  return `${String(value.hour).padStart(2, "0")}:${String(
    value.minute,
  ).padStart(2, "0")}`;
}

function formatApiTime(value: string): string {
  const parsed = parseTimeString(value);

  if (!parsed) {
    return value;
  }

  const meridiem = parsed.hour >= 12 ? "PM" : "AM";
  const displayHour = parsed.hour % 12 || 12;

  return `${String(displayHour).padStart(2, "0")}:${String(
    parsed.minute,
  ).padStart(2, "0")} ${meridiem}`;
}

function populateForm(spa: Spa | null): void {
  form.availableDays = spa?.availableDays ? [...spa.availableDays] : [];
  form.availableFromTime = spa?.availableFromTime ?? "";
  form.availableToTime = spa?.availableToTime ?? "";
  form.capacityPerSlot = spa?.capacityPerSlot;
  form.videoName = existingVideoName.value;
  selectedVideoFile.value = null;
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

function openVideoPicker(): void {
  videoInputRef.value?.click();
}

function handleVideoChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;

  selectedVideoFile.value = file;
  form.videoName = file?.name ?? existingVideoName.value;
}

function clearSelectedVideo(): void {
  selectedVideoFile.value = null;
  form.videoName = existingVideoName.value;

  if (videoInputRef.value) {
    videoInputRef.value.value = "";
  }
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
    await spaStore.updateSpa({
      availableDays: form.availableDays,
      availableFromTime: formatApiTime(form.availableFromTime),
      availableToTime: formatApiTime(form.availableToTime),
      capacityPerSlot: form.capacityPerSlot ?? 0,
      videoFile: selectedVideoFile.value,
    });
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
  () => [props.open, props.spa] as const,
  ([open]) => {
    if (open) {
      populateForm(props.spa);
    }
  },
  { immediate: true },
);
</script>

<template>
  <base-drawer
    title="Edit Spa"
    :open="isOpen"
    :drawer-width="480"
    @close="emit('close')"
  >
    <UForm
      ref="formRef"
      :state="form"
      :schema="schema"
      :validate-on="['blur']"
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex-1 overflow-y-auto px-5 py-5">
        <div class="grid gap-5">
          <UFormField
            name="videoName"
            label="Spa Video"
            required
            :ui="{ error: 'mt-1 text-red-500 text-xs' }"
          >
            <div class="grid gap-3">
              <input
                ref="videoInputRef"
                type="file"
                accept="video/*"
                class="hidden"
                @change="handleVideoChange"
              >

              <button
                type="button"
                class="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-center"
                @click="openVideoPicker"
              >
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-white"
                >
                  <UIcon :name="ICONS.UPLOAD" class="h-5 w-5" />
                </span>
                <div>
                  <p class="text-sm font-medium text-secondary">
                    Drop your video here
                  </p>
                  <p class="text-xs text-secondary-400">
                    mp4, mov, webm or m4v (max. 25MB)
                  </p>
                </div>
              </button>

              <div
                v-if="form.videoName"
                class="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
              >
                <div class="min-w-0">
                  <p
                    class="truncate text-sm font-medium text-secondary max-w-100"
                  >
                    {{ form.videoName }}
                  </p>
                </div>

                <button
                  type="button"
                  class="text-secondary-400 transition hover:text-secondary"
                  @click="clearSelectedVideo"
                >
                  <UIcon :name="ICONS.X" class="h-4 w-4" />
                </button>
              </div>

              <p class="text-xs text-secondary-400">
                Spa video is displayed on website and app
              </p>
            </div>
          </UFormField>

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
