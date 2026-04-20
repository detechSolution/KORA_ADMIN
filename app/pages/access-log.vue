<script setup lang="ts">
import { ICONS } from "~/config/icons";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "INQUIRIES",
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Access Logs
      </template>
      <template #description>
        View access logs based on gate entries
      </template>
    </base-page-header>

    <div class="bg-white flex flex-col p-4">
      <div class="px-4">
        <h2 class="text-base font-semibold">
          Access Logs List
        </h2>
      </div>

      <div class="flex flex-col sm:flex-row justify-between gap-4 p-4">
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
    </div>
    <base-table
      :data="[]"
      :columns="[]"
      :loading="false"
      empty-title="No communities found"
      empty-description="It looks like you haven't added any communities. Create one to get started."
    />
  </div>
</template>
