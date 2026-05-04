<script setup lang="ts">
import { ICONS } from "~/config/icons";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "refunds.manage",
});

const columns = [
  { id: "id", header: "Client", accessorKey: "id" },
  { id: "customer", header: "Reference ID", accessorKey: "customer" },
  { id: "date", header: "Requested Date", accessorKey: "date" },
  { id: "status", header: "Refunded Date", accessorKey: "status" },
  { id: "amount", header: "Amount", accessorKey: "amount" },
  { id: "amount", header: "Status", accessorKey: "amount" },
  { id: "amount", header: "Actions", accessorKey: "amount" },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Cancellations
      </template>
      <template #description>
        View cancellation details & status and manage refunds
      </template>
    </base-page-header>

    <div class="bg-white flex flex-col p-4 gap-4">
      <div>
        <h2 class="text-base font-semibold">
          Cancellations List
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
        :columns="columns"
        :loading="false"
        empty-title="No communities found"
        empty-description="It looks like you haven't added any communities. Create one to get started."
      />
    </div>
  </div>
</template>
