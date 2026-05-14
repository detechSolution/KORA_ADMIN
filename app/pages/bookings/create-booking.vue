<script setup lang="ts">
import { ref } from "vue";

import { ICONS } from "~/config/icons";

const items = [
  {
    label: "Existing Member / Guest",
    value: "existing",
  },
  {
    label: "New Client",
    value: "new",
  },
];

const selectedTab = ref("existing");

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "bookings.create",
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Manual Booking
      </template>
      <template #description>
        Create a manual booking by entering the required details below
      </template>

      <template #actions>
        <NuxtLink to="/bookings/bookings-list">
          <base-button
            :leading-icon="ICONS.ARROW_LEFT"
            variant="outline"
          >
            Back to List
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="rounded-xl flex flex-col md:flex-row gap-4 bg-white p-4 shadow-sm">
      <div class="flex flex-col bg-stone-50 gap-6 rounded-md border border-stone-200">
        <div class="flex flex-col p-4 gap-1">
          <h2 class="font-semibold">
            Use Type
          </h2>
          <p class="text-sm text-secondary-500">
            Is this user new or existing? Select accordingly.
          </p>
        </div>

        <USeparator />

        <base-tabs
          v-model="selectedTab"
          :items="items"
          variant="solid"
          color="primary"
          orientation="vertical"
        />
      </div>

      <bookings-existing-member v-if="selectedTab === 'existing'" />
      <div
        v-else
        class="rounded-md border border-dashed border-stone-300 bg-white p-4 text-sm text-secondary-500"
      >
        New client booking form will go here.
      </div>
    </div>
  </div>
</template>
