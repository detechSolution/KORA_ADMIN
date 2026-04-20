<script setup lang="ts">
import { ICONS } from "~/config/icons";

definePageMeta({
  auth: true,
  layout: "dashboard",
  // permission: "COMMUNITIES.CREATE",
});

const kpiData = [
  {
    title: "Total Clients",
    icon: ICONS.USERS,
    value: 13,
    link: { path: "/members/list" },
  },
  {
    title: "Members Count",
    icon: ICONS.USERS,
    value: 10,
    link: { path: "/members/list" },
  },
  {
    title: "Guests Count",
    icon: ICONS.USERS,
    value: 3,
    link: { path: "/members/list" },
  },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Members
      </template>
      <template #description>
        Create and manage members
      </template>
      <template #actions>
        <NuxtLink to="/communities/list">
          <base-button
            variant="solid"
            size="md"
            :leading-icon="ICONS.PLUS"
          >
            Create Member
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-card  rounded-xl p-4 sm:p-6 page-content-height flex flex-col gap-4">
      <div class="grid bg-stone-50 rounded border border-border p-4 sm:p-6 py-6 grid-cols-1 md:grid-cols-3  gap-y-6 md:gap-y-8 gap-x-0">
        <dashboard-kpi-card
          v-for="(kpi, index) in kpiData"
          :key="index"
          class="px-6 border-border"
          :class="[
            index % 3 === 0 ? 'md:border-r' : 'md:border-r-0',
            index !== 2 ? 'xl:border-r' : 'xl:border-r-0',
          ]"
          :title="kpi.title"
          :value="kpi.value"
          :icon="kpi.icon"
        />
      </div>
      <h2 class="text-base font-semibold">
        Members & Guests List
      </h2>

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

<style scoped>

</style>
