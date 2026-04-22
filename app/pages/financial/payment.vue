<script setup lang="ts">
import { ICONS } from "~/config/icons";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "payments.view",
});

const kpiCards = [
  {
    title: "Cash Payments",
    value: "100",
    icon: ICONS.CREDIT_CARD,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "Online Payments",
    value: "100",
    icon: ICONS.REFRESH_CW,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    title: "Refunded",
    value: "100",
    icon: ICONS.CLOCK,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Payments
      </template>
      <template #description>
        View Payment Details, Status, and Types
      </template>
    </base-page-header>

    <div class="bg-white flex flex-col gap-4 p-4">
      <div class="grid bg-stone-50 rounded border border-border p-4 sm:p-6 py-6 grid-cols-1 md:grid-cols-3  gap-y-6 md:gap-y-8 gap-x-0 ">
        <dashboard-kpi-card
          v-for="(card, index) in kpiCards"
          :key="index"
          class="px-6 border-border"
          :class="[
            index % 3 === 0 ? 'md:border-r' : 'md:border-r-0',
            index !== 2 ? 'xl:border-r' : 'xl:border-r-0',
          ]"
          :title="card.title"
          :value="card.value"
          :icon="card.icon"
        />
      </div>

      <div class="">
        <h2 class="text-base font-semibold">
          Payments List
        </h2>
      </div>

      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
          <base-input
            name="search"
            placeholder="Search"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
            :leading-icon="ICONS.SEARCH"
          />

          <base-date-picker
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <base-select
            name="status"
            placeholder="All statuses"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
            >
              Clear Filters
            </base-button>
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
            >
              Search
            </base-button>
          </div>
        </div>

        <base-button
          variant="outline"
          :leading-icon="ICONS.DOWNLOAD"
        >
          Export
        </base-button>
      </div>
      <base-table
        :data="[]"
        :columns="[]"
        :loading="false"
        empty-title="No communities found"
        empty-description="It looks like you haven't added any communities. Create one to get started."
      />
    </div>
  </div>
</template>
