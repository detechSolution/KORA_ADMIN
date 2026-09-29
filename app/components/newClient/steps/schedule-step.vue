<script setup lang="ts">
import { Time } from "@internationalized/date";
import { computed, ref, watch } from "vue";

import { useBookingStore } from "~/stores/booking";

import { ICONS } from "../../../config/icons";

const form = defineModel<any>({ required: true });
const bookingStore = useBookingStore();

const serviceTypes = [
  { label: "Session", value: "session" },
  { label: "Spa Service", value: "spa" },
  { label: "Passes", value: "passes" },
];

const roomTypes = [
  { label: "Private Room", value: "private" },
  { label: "Shared Room", value: "shared" },
] as const;

/* ── Time helpers ───────────────────────────────────────── */

function parseTimeValue(value: string): Time | undefined {
  const [h = "0", m = "0"] = value.trim().split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (Number.isNaN(hour) || Number.isNaN(minute))
    return undefined;
  return new Time(hour, minute);
}

function formatTimeValue(value: Time | undefined): string {
  if (!value)
    return "";
  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}

const timeModel = computed({
  get: () => parseTimeValue(form.value.time ?? ""),
  set: (v) => { form.value.time = formatTimeValue(v); },
});

/* ── Service helpers ────────────────────────────────────── */

type BadgeColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";

type SelectOption
  = | { type: "label"; label: string }
    | { type: "separator" }
    | { label: string; value: number; description?: string; metaColor?: string; meta?: string; badge?: { label: string; color?: BadgeColor } };

function findServiceItem(serviceId: number | undefined) {
  if (!serviceId)
    return undefined;
  return bookingStore.bookingItemOptions
    .flatMap((g: any) => g.items)
    .find((item: any) =>
      item.id === serviceId,
    );
}

function findServiceGroup(serviceId: number | undefined) {
  if (!serviceId)
    return undefined;
  return bookingStore.bookingItemOptions.find((g: any) =>
    g.items?.some((item: any) =>
      item.id === serviceId,
    ),
  );
}

const serviceOptions = computed<SelectOption[]>(() =>
  bookingStore.bookingItemOptions.flatMap((group: any, i: number, arr: any[]): SelectOption[] => [
    { type: "label", label: group.label },
    ...group.items.map((item: any): SelectOption => ({
      label: item.name,
      value: item.id,
      description: item.sessionDate,
      meta: group.type === "session" ? `${item.occupied}/${item.capacity}` : undefined,
      badge: { label: item.sessionType },
      metaColor: item.occupied === item.capacity ? "error" : "success",
    })),
    ...(i < arr.length - 1 ? [{ type: "separator" } as SelectOption] : []),
  ]),
);

const selectedGroup = computed(() => findServiceGroup(form.value.serviceId));

// Show duration only when the selected service belongs to a "spa" group
const showDuration = computed(() =>
  selectedGroup.value?.type?.toLowerCase() === "spa",
);

const durationOptions = computed(() => {
  const group = selectedGroup.value;
  if (!group)
    return [];

  const item = group.items?.find((i: any) =>
    i.id === form.value.serviceId,
  );

  const rawDurations = item?.duration;
  const durations: any[] = Array.isArray(rawDurations) ? rawDurations : [];

  return durations
    .map((d: any) => ({
      label: `${d?.duration} ${d?.timeUnit}`,
      value: d?.id,
    }))
    .filter(d => d.value != null);
});

const spaAvailableDays = computed(() => {
  const group = selectedGroup.value as any;
  if (!group)
    return [] as string[];

  const item = findServiceItem(form.value.serviceId) as any;
  // Try duration-level availableDays when a duration is selected
  const rawDurations = item?.duration ?? item?.durations ?? item?.duration_options ?? item?.durationOptions;
  const durations: any[] = Array.isArray(rawDurations) ? rawDurations : [];
  const selected = durations.find((d: any) =>
    d?.id === form.value.durationId || d?.duration_id === form.value.durationId || d?.value === form.value.durationId,
  );

  if (selected && Array.isArray(selected.availableDays) && selected.availableDays.length)
    return selected.availableDays as string[];

  // Fallback to item-level or group-level availableDays
  return (item?.availableDays ?? item?.available_days ?? group.availableDays ?? []) as string[];
});

function weekdayFromDate(dateStr: string | undefined): string | null {
  if (!dateStr)
    return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime()))
    return null;
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[d.getDay()] ?? null;
}

function nextAvailableDate(availableDays: string[]): string | null {
  if (!availableDays || !availableDays.length)
    return null;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];
    if (weekday && availableDays.includes(weekday)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  }
  return null;
}

watch(() => form.value.serviceType, async (newType, oldType) => {
  // Only reset if the type actually changed (and it's not the initial mount)
  if (oldType !== undefined && newType !== oldType) {
    form.value.serviceId = undefined;
    form.value.durationId = null;
    form.value.roomType = "private";
  }

  if (newType) {
    await bookingStore.fetchBookingItemOptions(newType);
  }
}, { immediate: true });

watch(() => form.value.serviceId, (id) => {
  const group = selectedGroup.value;
  const item = findServiceItem(id);
  if (!group || !item) {
    return;
  }

  if (group.type?.toLowerCase() === "session") {
    const sessionDate = item.sessionDate;
    if (sessionDate) {
      form.value.date = sessionDate;
    }
    if (item.startTime) {
      form.value.time = item.startTime;
    }
  }

  if (group.type?.toLowerCase() === "spa") {
    const available = (group.availableDays ?? []) as string[];
    const currentWeekday = weekdayFromDate(form.value.date);
    if (!currentWeekday || !available.includes(currentWeekday)) {
      const next = nextAvailableDate(available);
      if (next)
        form.value.date = next;
    }
  }
}, { immediate: true });

/* ── SPA Time fetching ──────────────────────────────────── */

const spaTimes = ref<{ label: string; value: string }[]>([]);
const loadingTimes = ref(false);

async function fetchSpaTimes() {
  if (form.value.serviceType !== "spa" || !form.value.date || !form.value.durationId) {
    spaTimes.value = [];
    return;
  }

  const item = findServiceItem(form.value.serviceId) as any;
  if (!item)
    return;

  const durations = item.duration;
  const selected = durations.find((d: any) => d?.id === form.value.durationId);

  if (!selected)
    return;

  loadingTimes.value = true;
  try {
    const times = await bookingStore.fetchSpaTimeAvailability({
      bookingDate: form.value.date,
      duration: selected.minutes ?? selected.duration ?? selected.value,
      timeUnit: selected.timeUnit ?? "minutes",
      roomType: form.value.roomType,
    });
    spaTimes.value = times.map((item: any) => ({
      label: item.label,
      value: item.time,
    }));

    if (form.value.time && !times.some((t: any) => {
      return t.time === form.value.time;
    })) {
      form.value.time = "";
    }
  }
  catch (error) {
    console.error(error);
    spaTimes.value = [];
  }
  finally {
    loadingTimes.value = false;
  }
}

watch([() => form.value.date, () => form.value.durationId, () => form.value.serviceId, () => form.value.roomType], () => {
  if (form.value.serviceType === "spa") {
    fetchSpaTimes();
  }
}, { immediate: true });

defineExpose({
  spaAvailableDays,
  showDuration,
  weekdayFromDate,
  findServiceItem,
  findServiceGroup,
});
</script>

<template>
  <section class="space-y-6">
    <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm space-y-4">
      <base-select
        v-model="form.serviceType"
        name="serviceType"
        label="Select Type"
        placeholder="Select service type"
        :options="serviceTypes"
        @update:model-value="form.date = ''"
      />

      <!-- Spa: Room Type -->
      <fieldset v-if="form.serviceType === 'spa'" class="space-y-2">
        <legend class="text-sm font-medium">
          Room Type
        </legend>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            v-for="room in roomTypes"
            :key="room.value"
            class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary"
            :class="form.roomType === room.value ? 'border-border bg-primary-50/60' : 'border-secondary-100 bg-white hover:border-primary-300'"
          >
            <input
              v-model="form.roomType"
              type="radio"
              name="roomType"
              :value="room.value"
              class="sr-only"
            >
            <span
              aria-hidden="true"
              class="flex size-[18px] shrink-0 items-center justify-center rounded-full border"
              :class="form.roomType === room.value ? 'border-primary bg-primary' : 'border-secondary-100 bg-white'"
            >
              <span v-if="form.roomType === room.value" class="size-1.5 rounded-full bg-white" />
            </span>
            <span>{{ room.label }}</span>
          </label>
        </div>
      </fieldset>

      <base-select-menu
        v-if="form.serviceType"
        v-model="form.serviceId"
        name="serviceId"
        label="Select Service"
        placeholder="Select a session or service"
        :options="serviceOptions"
        :loading="bookingStore.loading"
        class="w-full"
      />

      <!-- Spa: Duration + Date side by side -->
      <div
        v-if="showDuration && durationOptions.length"
        class="grid grid-cols-2 gap-4"
      >
        <base-select
          v-model="form.durationId"
          name="durationId"
          label="Select Duration"
          placeholder="Select duration for this service"
          :options="durationOptions"
        />
        <base-date-picker
          v-if="form.serviceId"
          v-model="form.date"
          name="date"
          label="Date"
          placeholder="Select date"
          :no-of-months="1"
          :allowed-weekdays="spaAvailableDays"
        />
      </div>

      <!-- Session: Date + Time side by side -->
      <div
        v-else-if="form.serviceId && form.serviceType === 'session'"
        class="grid grid-cols-2 gap-4"
      >
        <base-date-picker
          v-model="form.date"
          name="date"
          label="Date"
          placeholder="Select date"
          :no-of-months="1"
          :disabled="form.serviceType === 'session'"
        />
        <UFormField
          name="time"
          label="Time*"
          :ui="{ error: 'mt-1 text-red-500 text-xs' }"
        >
          <UInputTime
            v-model="timeModel"
            :trailing-icon="ICONS.CLOCK"
            class="w-full"
            disabled
          />
        </UFormField>
      </div>

      <!-- Passes: Date only, full width -->
      <base-date-picker
        v-else-if="form.serviceId && form.serviceType === 'passes'"
        v-model="form.date"
        name="date"
        label="Date"
        placeholder="Select date"
        :no-of-months="1"
      />

      <!-- Spa: time slots -->
      <UFormField
        v-if="form.serviceType === 'spa' && form.serviceId && form.durationId"
        name="time"
        label="Available Times"
        :ui="{ error: 'mt-1 text-red-500 text-xs' }"
      >
        <div
          v-if="loadingTimes"
          class="text-sm text-muted-foreground"
        >
          Loading available times...
        </div>
        <div
          v-else-if="!spaTimes.length"
          class="text-sm text-muted-foreground"
        >
          {{ form.date ? "No available slots for selected date" : "Select a date to see available times" }}
        </div>
        <div
          v-else
          class="flex flex-wrap gap-2"
        >
          <button
            v-for="slot in spaTimes"
            :key="slot.value"
            type="button"
            class="px-3 py-1.5 text-sm rounded-md border transition-all"
            :class="form.time === slot.value
              ? 'bg-primary text-white'
              : 'border-border hover:border-stone-400 '"
            @click="form.time = slot.value"
          >
            {{ slot.label }}
          </button>
        </div>
      </UFormField>
    </div>
  </section>
</template>
