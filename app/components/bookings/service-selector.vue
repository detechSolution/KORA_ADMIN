<script setup lang="ts">
import { Time } from "@internationalized/date";
import { computed, ref, watch } from "vue";

import type { ServiceState } from "~/types/booking";

import { ICONS } from "~/config/icons";
import { useBookingStore } from "~/stores/booking";

const props = withDefaults(defineProps<{
  namePrefix?: string;
}>(), {
  namePrefix: "",
});

const form = defineModel<ServiceState>({ required: true });
const bookingStore = useBookingStore();

const serviceTypes = [
  { label: "Session", value: "session" },
  { label: "Spa Service", value: "spa" },
  { label: "Passes", value: "passes" },
];

const localOptions = ref<any[]>([]);
const localLoading = ref(false);
const spaTimes = ref<{ label: string; value: string }[]>([]);
const loadingTimes = ref(false);

function n(field: string): string {
  return props.namePrefix ? `${props.namePrefix}.${field}` : field;
}

function findItem(id: number | undefined): any {
  if (!id)
    return undefined;
  return localOptions.value.flatMap((g: any) => g.items).find((item: any) => item.id === id);
}

function findGroup(id: number | undefined): any {
  if (!id)
    return undefined;
  return localOptions.value.find((g: any) => g.items?.some((item: any) => item.id === id));
}

type SelectOption
  = | { type: "label"; label: string }
    | { type: "separator" }
    | { label: string; value: number; description?: string; metaColor?: string; meta?: string };

const serviceOptions = computed<SelectOption[]>(() =>
  localOptions.value.flatMap((group: any, i: number, arr: any[]): SelectOption[] => [
    { type: "label", label: group.label },
    ...group.items.map((item: any): SelectOption => ({
      label: item.name,
      value: item.id,
      description: item.sessionDate,
      meta: group.type === "session" ? `${item.occupied}/${item.capacity}` : undefined,
      metaColor: item.occupied === item.capacity ? "error" : "success",
    })),
    ...(i < arr.length - 1 ? [{ type: "separator" } as SelectOption] : []),
  ]),
);

const selectedGroup = computed(() => findGroup(form.value.serviceId));
const showDuration = computed(() => selectedGroup.value?.type?.toLowerCase() === "spa");

const durationOptions = computed(() => {
  const item = findItem(form.value.serviceId);
  const durations: any[] = Array.isArray(item?.duration) ? item.duration : [];
  return durations
    .map((d: any) => ({ label: `${d?.duration} ${d?.timeUnit}`, value: d?.id }))
    .filter(d => d.value != null);
});

const spaAvailableDays = computed(() => {
  const item = findItem(form.value.serviceId);
  const durations: any[] = Array.isArray(item?.duration) ? item.duration : [];
  const selected = durations.find((d: any) => d?.id === form.value.durationId);
  if (selected?.availableDays?.length)
    return selected.availableDays as string[];
  return (item?.availableDays ?? selectedGroup.value?.availableDays ?? []) as string[];
});

function parseTimeValue(value: string): Time | undefined {
  const [h = "0", m = "0"] = (value ?? "").trim().split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (Number.isNaN(hour) || Number.isNaN(minute))
    return undefined;
  return new Time(hour, minute);
}

function formatTimeValue(v: Time | undefined): string {
  if (!v)
    return "";
  return `${String(v.hour).padStart(2, "0")}:${String(v.minute).padStart(2, "0")}`;
}

const timeModel = computed({
  get: () => parseTimeValue(form.value.time ?? ""),
  set: (v) => { form.value.time = formatTimeValue(v); },
});

function weekdayFromDate(dateStr: string | undefined): string | null {
  if (!dateStr)
    return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime()))
    return null;
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()] ?? null;
}

function nextAvailableDate(availableDays: string[]): string | null {
  if (!availableDays?.length)
    return null;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];
    if (weekday && availableDays.includes(weekday))
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return null;
}

function updateResolved() {
  const item = findItem(form.value.serviceId);
  const group = findGroup(form.value.serviceId);
  if (item && group) {
    const isSpa = group.type?.toLowerCase() === "spa";
    const durations: any[] = Array.isArray(item.duration) ? item.duration : [];
    const selectedDuration = durations.find((d: any) => d?.id === form.value.durationId);

    const price = isSpa
      ? Number(selectedDuration?.amount ?? selectedDuration?.price)
      : Number(item.amount ?? item.price);
    const discount = Number(item.memberDiscount ?? item.discountPercent ?? item.discount);

    form.value.resolvedItemName = item.name;
    form.value.resolvedItemType = group.type;
    form.value.resolvedItemId = isSpa ? form.value.durationId : form.value.serviceId;
    form.value.resolvedPrice = Number.isNaN(price) ? 0 : price;
    form.value.resolvedDiscountPercent = Number.isNaN(discount) ? 0 : discount;
    form.value.resolvedDurationLabel = selectedDuration
      ? `${selectedDuration.duration} ${selectedDuration.timeUnit}`
      : "";
  }
  else {
    form.value.resolvedItemName = undefined;
    form.value.resolvedItemType = undefined;
    form.value.resolvedItemId = undefined;
    form.value.resolvedPrice = undefined;
    form.value.resolvedDiscountPercent = undefined;
    form.value.resolvedDurationLabel = undefined;
  }
}

watch(() => form.value.serviceType, async (newType, oldType) => {
  if (oldType !== undefined && newType !== oldType) {
    form.value.serviceId = undefined;
    form.value.durationId = null;
    form.value.date = "";
    form.value.time = "";
    form.value.resolvedItemName = undefined;
    form.value.resolvedItemType = undefined;
    form.value.resolvedItemId = undefined;
    form.value.resolvedPrice = undefined;
    form.value.resolvedDiscountPercent = undefined;
    form.value.resolvedDurationLabel = undefined;
  }
  if (!newType)
    return;
  localLoading.value = true;
  try {
    await bookingStore.fetchBookingItemOptions(newType);
    localOptions.value = bookingStore.bookingItemOptions;
  }
  catch {
    localOptions.value = [];
  }
  finally {
    localLoading.value = false;
  }
}, { immediate: true });

watch(() => form.value.serviceId, (id) => {
  const group = selectedGroup.value;
  const item = findItem(id);
  if (group && item) {
    if (group.type?.toLowerCase() === "session" && item.sessionDate) {
      form.value.date = item.sessionDate;
      form.value.time = item.startTime;
    }
    if (group.type?.toLowerCase() === "spa") {
      const available = (group.availableDays ?? []) as string[];
      const current = weekdayFromDate(form.value.date);
      if (!current || !available.includes(current)) {
        const next = nextAvailableDate(available);
        if (next)
          form.value.date = next;
      }
    }
  }
  updateResolved();
}, { immediate: true });

watch(() => form.value.durationId, updateResolved);

watch([() => form.value.date, () => form.value.durationId, () => form.value.serviceId], async () => {
  if (form.value.serviceType !== "spa" || !form.value.date || !form.value.durationId) {
    spaTimes.value = [];
    return;
  }
  const item = findItem(form.value.serviceId);
  if (!item)
    return;
  const durations: any[] = item.duration ?? [];
  const selected = durations.find((d: any) => d?.id === form.value.durationId);
  if (!selected)
    return;

  loadingTimes.value = true;
  try {
    const res = await bookingStore.fetchSpaTimeAvailability({
      bookingDate: form.value.date,
      duration: Number(selected.minutes ?? selected.duration ?? selected.value),
      timeUnit: selected.timeUnit ?? "minutes",
    });
    spaTimes.value = res.map((t: any) => ({ label: t.label, value: t.time }));
    if (form.value.time && !spaTimes.value.some(t => t.value === form.value.time))
      form.value.time = "";
  }
  catch {
    spaTimes.value = [];
  }
  finally {
    loadingTimes.value = false;
  }
}, { immediate: true });
</script>

<template>
  <div class="space-y-4">
    <base-select
      v-model="form.serviceType"
      :name="n('serviceType')"
      label="Select Type"
      placeholder="Select service type"
      :options="serviceTypes"
      @update:model-value="form.date = ''"
    />

    <base-select-menu
      v-if="form.serviceType"
      v-model="form.serviceId"
      :name="n('serviceId')"
      label="Select Service"
      placeholder="Select a service"
      :options="serviceOptions"
      :loading="localLoading"
      class="w-full"
    />

    <!-- Spa: Duration + Date side by side -->
    <div
      v-if="showDuration && durationOptions.length"
      class="grid grid-cols-2 gap-4"
    >
      <base-select
        v-model="form.durationId"
        :name="n('durationId')"
        label="Select Duration"
        placeholder="Select duration"
        :options="durationOptions"
      />
      <base-date-picker
        v-if="form.serviceId"
        v-model="form.date"
        :name="n('date')"
        label="Date*"
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
        :name="n('date')"
        label="Date*"
        placeholder="Select date"
        :no-of-months="1"
        :disabled="form.serviceType === 'session'"
        :readonly="form.serviceType === 'session'"
      />
      <UFormField
        :name="n('time')"
        label="Time*"
        :ui="{ error: 'mt-1 text-red-500 text-xs' }"
      >
        <UInputTime
          v-model="timeModel"
          :trailing-icon="ICONS.CLOCK"
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- Passes: Date only, full width -->
    <base-date-picker
      v-else-if="form.serviceId && form.serviceType === 'passes'"
      v-model="form.date"
      :name="n('date')"
      label="Date*"
      placeholder="Select date"
      :no-of-months="1"
    />

    <!-- Spa: time slots -->
    <UFormField
      v-if="form.serviceType === 'spa' && form.serviceId && form.durationId"
      :name="n('time')"
      label="Available Times*"
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
</template>
