<script setup lang="ts">
import { ICONS } from "~/config/icons";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "COMMUNITIES.CREATE",
});

const state = ref({
  status: "",
  referenceNumber: "",
  referenceDateRange: { start: null, end: null },
  dueDateRange: { start: null, end: null },
});

const services = ref([
  {
    id: "1",
    name: "Gymnasium",
    days: ["Mon", "Wed", "Fri"],
    time: "10:00 AM - 12:00 PM",
    price: 100,
    duration: 60,
  },
  {
    id: "2",
    name: "Jacuzzi",
    days: ["Tue", "Thu", "Sat"],
    time: "02:00 PM - 04:00 PM",
    price: 200,
    duration: 90,
  },
  {
    id: "2",
    name: "Jacuzzi",
    days: ["Tue", "Thu", "Sat"],
    time: "02:00 PM - 04:00 PM",
    price: 200,
    duration: 90,
  },
]);
</script>

<template>
  <div class="w-full gap-6 flex flex-col">
    <base-page-header>
      <template #title>
        Service
      </template>
      <template #description>
        Manage services and its available days, time slots and duration
      </template>

      <template #actions>
        <NuxtLink
          to="/offerings/service/create"
        >
          <base-button
            variant="solid"
            size="md"
            :leading-icon="ICONS.PLUS"
          >
            Create Service
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>
    <div class=" rounded-b-xl flex flex-col gap-4 ">
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
        <base-input
          v-model="state.referenceNumber"
          :leading-icon="ICONS.SEARCH"
          name="referenceNumber"
          placeholder="Search sessions"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-button
          variant="outline"
          size="md"
          :leading-icon="ICONS.SEARCH"
        >
          Search
        </base-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <service-card
        v-for="service in services"
        :id="service.id"
        :key="service.id"
        :name="service.name"
        :days="service.days"
        :time="service.time"
        :price="service.price"
        :duration="service.duration"
      />
    </div>
  </div>
</template>
