<script setup lang="ts">
import { ICONS } from "~/config/icons";

definePageMeta({
  auth: true,
  layout: "dashboard",
  // permission: "COMMUNITIES.VIEW",
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Membership Plans
      </template>
      <template #description>
        Create and manage membership plans
      </template>
      <template #actions>
        <NuxtLink
          to="/communities/create"
        >
          <base-button
            variant="solid"
            size="md"
            :trailing-icon="ICONS.PLUS"
          >
            Create Plan
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>
    <div class=" bg-white rounded-xl p-6 flex flex-col gap-4 page-content-height">
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
        <base-input
          name="search"
          :leading-icon="ICONS.SEARCH"
          placeholder="Search plans"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-select
          name="status"
          placeholder="Select details"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-select
          name="status"
          placeholder="Select type"
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
            class="flex-1 sm:flex-none"
            variant="outline"
            :leading-icon="ICONS.SEARCH"
          >
            Search
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
  </div>
</template>
