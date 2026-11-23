<script setup lang="ts">
import { ICONS } from "~/config/icons";

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

    <bookings-manual-booking />
  </div>
</template>
