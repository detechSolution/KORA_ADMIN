<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { Day, SpaSubType } from "~/types/spa";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useSpaStore } from "~/stores/spa";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.spa.view",
});

const state = ref({
  status: "",
  referenceNumber: "",
  referenceDateRange: { start: null, end: null },
  dueDateRange: { start: null, end: null },
});

const spaStore = useSpaStore();
const { success, error: showError } = useNotification();
const loading = ref(false);
const deleting = ref(false);
const isEditDrawerOpen = ref(false);
const isSettingsDrawerOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedServiceId = ref<number | null>(null);
const selectedService = ref<SpaSubType | null>(null);

const dayLabels: Record<Day, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

async function fetchSpaData(): Promise<void> {
  try {
    loading.value = true;
    await spaStore.getSpaData(state.value.referenceNumber);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load spa services") });
  }
  finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchSpaData();
});

const spadata = computed(() => {
  return spaStore.spaData;
});

const spaInfo = computed(() => spaStore.spaInfo);

const orderedDayChips = computed(() => {
  return Object.entries(dayLabels).map(([value, label]) => ({
    value: value as Day,
    label,
    active: spaInfo.value?.availableDays?.includes(value as Day) ?? false,
  }));
});

const formattedOpeningHours = computed(() => {
  if (!spaInfo.value?.availableFromTime || !spaInfo.value?.availableToTime) {
    return "Not set";
  }

  return `${formatTime(spaInfo.value.availableFromTime)} - ${formatTime(spaInfo.value.availableToTime)}`;
});

function openEditDrawer(id: number): void {
  selectedServiceId.value = id;
  isEditDrawerOpen.value = true;
}

function openSettingsDrawer(): void {
  isSettingsDrawerOpen.value = true;
}

function closeEditDrawer(): void {
  isEditDrawerOpen.value = false;
  selectedServiceId.value = null;
}

function closeSettingsDrawer(): void {
  isSettingsDrawerOpen.value = false;
}

function openDeleteModal(service: SpaSubType): void {
  selectedService.value = service;
  isDeleteModalOpen.value = true;
}

function closeDeleteModal(): void {
  selectedService.value = null;
  isDeleteModalOpen.value = false;
}

async function handleServiceUpdated(): Promise<void> {
  closeEditDrawer();
  await fetchSpaData();
}

async function handleSpaUpdated(): Promise<void> {
  closeSettingsDrawer();
  await fetchSpaData();
}

async function handleDeleteSubtype(): Promise<void> {
  if (!selectedService.value) {
    return;
  }

  try {
    deleting.value = true;
    await spaStore.deleteSpaSubType(selectedService.value.id);
    success({ message: "Spa sub-type deleted successfully" });
    closeDeleteModal();
    await fetchSpaData();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to delete spa sub-type") });
  }
  finally {
    deleting.value = false;
  }
}

function formatTime(time: string): string {
  const [hours = "00", minutes = "00"] = time.split(":");
  const parsedHour = Number(hours);

  if (Number.isNaN(parsedHour)) {
    return time;
  }

  const displayHour = parsedHour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minutes}`;
}

function clearFilters(): void {
  state.value.referenceNumber = "";
  fetchSpaData();
}
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 class="text-2xl font-semibold leading-none text-secondary">
            Spa
          </h1>
          <p class="mt-2 text-sm text-secondary-400">
            Manage spa and its available days, time slots, duration & sub-types
          </p>
        </div>

        <NuxtLink to="/offerings/create-spa">
          <base-button
            variant="solid"
            size="md"
            :leading-icon="ICONS.PLUS"
          >
            Create Sub-Type
          </base-button>
        </NuxtLink>
      </div>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
        <base-input
          v-model="state.referenceNumber"
          :leading-icon="ICONS.SEARCH"
          name="referenceNumber"
          placeholder="Search spa services"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          @keyup.enter="fetchSpaData"
        />
        <div class="flex gap-2 w-full sm:w-auto">
          <base-button
            variant="outline"
            size="md"
            :leading-icon="ICONS.SEARCH"
            :loading="loading"
            @click="fetchSpaData"
          >
            Search
          </base-button>
          <base-button
            v-if="state.referenceNumber !== ''"
            variant="outline"
            class="flex-1 sm:flex-none"
            @click="clearFilters"
          >
            Clear Filters
          </base-button>
        </div>
      </div>

      <div
        v-if="spaInfo"
        class="rounded-[6px] border border-stone-200 bg-white p-4 shadow-[0px_0px_5px_0px_#0000000D]"
      >
        <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div class="grid flex-1 gap-5 md:grid-cols-3">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700 text-white">
                <UIcon :name="ICONS.CAPACITY" class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm text-secondary-400">
                  Capacity / Slot
                </p>
                <p class="text-lg font-semibold text-secondary">
                  {{ spaInfo.capacityPerSlot ?? 0 }} clients
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 border-stone-200 md:border-x md:px-6">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700 text-white">
                <UIcon :name="ICONS.CLOCK" class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm text-secondary-400">
                  Opening Hours
                </p>
                <p class="text-lg font-semibold text-secondary">
                  {{ formattedOpeningHours }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700 text-white">
                <UIcon :name="ICONS.CALENDAR" class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <p class="text-sm text-secondary-400">
                  Available Days
                </p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <span
                    v-for="day in orderedDayChips"
                    :key="day.value"
                    class="rounded px-2 py-1 text-[11px] font-medium"
                    :class="day.active
                      ? 'bg-secondary text-white'
                      : 'bg-stone-100 text-secondary-300'"
                  >
                    {{ day.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <base-button
            variant="outline"
            size="md"
            :leading-icon="ICONS.PEN_LINE"
            @click="openSettingsDrawer"
          >
            Edit
          </base-button>
        </div>
      </div>
    </div>

    <base-empty
      v-if="!loading && spadata.length === 0"
      title="No spa sub-types found"
    />

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <service-card
        v-for="service in spadata"
        :id="service.id"
        :key="service.id"
        :name="service.name"
        :description="service.description ?? ''"
        :prices="service.prices"
        @edit="openEditDrawer"
        @delete="openDeleteModal(service)"
      />
    </div>

    <OfferingsSpaSubtypeEditDrawer
      :open="isEditDrawerOpen"
      :service-id="selectedServiceId"
      @close="closeEditDrawer"
      @updated="handleServiceUpdated"
    />

    <OfferingsSpaSettingsDrawer
      :open="isSettingsDrawerOpen"
      :spa="spaInfo"
      @close="closeSettingsDrawer"
      @updated="handleSpaUpdated"
    />

    <OfferingsSpaSubtypeDeleteModal
      :open="isDeleteModalOpen"
      :service-name="selectedService?.name"
      :loading="deleting"
      @close="closeDeleteModal"
      @confirm="handleDeleteSubtype"
    />
  </div>
</template>
