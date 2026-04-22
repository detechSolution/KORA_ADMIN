<script setup lang="ts">
import { ICONS } from "~/config/icons";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "offerings.sessions.view",
});

const state = ref({
  status: "",
  referenceNumber: "",
  referenceDateRange: { start: null, end: null },
  dueDateRange: { start: null, end: null },
});

const sessions = [
  {
    title: "Session Title",
    type: "Type",
    trainer: "Trainer",
    date: "Date",
    time: "Time",
    location: "Location",
    price: "Price",
    capacity: 10,
    registered: 5,
  },
  {
    title: "Session Title",
    type: "Type",
    trainer: "Trainer",
    date: "Date",
    time: "Time",
    location: "Location",
    price: "Price",
    capacity: 10,
    registered: 8,
  },
  {
    title: "Session Title",
    type: "Type",
    trainer: "Trainer",
    date: "Date",
    time: "Time",
    location: "Location",
    price: "Price",
    capacity: 20,
    registered: 30,
  },
];
</script>

<template>
  <div class="w-full gap-6 flex flex-col">
    <base-page-header>
      <template #title>
        Sessions
      </template>
      <template #description>
        Manage classes, events and workshops
      </template>
      <template #actions>
        <NuxtLink
          to="/offerings/session/create"
        >
          <base-button
            variant="solid"
            size="md"
            :leading-icon="ICONS.PLUS"
          >
            Create Session
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
          placeholder="Search by reference number"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-input
          v-model="state.referenceNumber"
          type="date"
          name="referenceNumber"
          placeholder="Search by reference number"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-select
          v-model="state.referenceNumber"
          name="referenceNumber"
          placeholder="Search by reference number"
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

    <div class=" rounded-b-xl  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-4 ">
      <session-card
        v-for="(session, index) in sessions"
        :key="index"
        :title="session.title"
        :type="session.type"
        :trainer="session.trainer"
        :date="session.date"
        :time="session.time"
        :location="session.location"
        :price="session.price"
        :capacity="session.capacity"
        :registered="session.registered"
      />
    </div>
  </div>
</template>
