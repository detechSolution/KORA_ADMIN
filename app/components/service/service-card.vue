<script setup lang="ts">
import { ICONS } from "~/config/icons";

const props = defineProps<Service>();

type Service = {
  id: string;
  name: string;
  days: string[];
  time: string;
  price: number;

};

const DAYS = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};
</script>

<template>
  <div class="flex bg-white w-full rounded-xl flex-col">
    <div class="border-b border-stone-100 p-4 text-base font-medium text-secondary">
      <p>{{ props.name }}</p>
    </div>

    <div class="flex flex-col gap-4 p-4 border-b border-stone-100">
      <div class=" flex items-center gap-2">
        <UIcon class="text-secondary-500 h-4 w-4" :name="ICONS.CALENDAR" />
        <div
          v-for="day in DAYS"
          :key="day"
          class="px-2 py-1 rounded-sm text-xs"
          :class="[
            props.days.includes(day) ? 'bg-primary-700 text-white' : 'bg-stone-100 text-secondary-200 ',
          ]"
        >
          <p>
            {{ day }}
          </p>
        </div>
      </div>

      <div class=" flex items-center gap-2">
        <UIcon class="text-secondary-500 h-4 w-4" :name="ICONS.CLOCK" />
        <p class="text-secondary-700 text-xs font-medium">
          {{ props.time }}
        </p>
      </div>
    </div>

    <div class="flex items-center justify-between p-4">
      <p class="text-secondary text-xs font-medium">
        Rs. {{ props.price }}
      </p>
      <div class="flex items-center gap-4">
        <div class="w-fit h-fit cursor-pointer">
          <UIcon :name="ICONS.PEN_LINE" class="text-secondary-500 h-4 w-4" />
        </div>
        <div class="w-fit h-fit cursor-pointer">
          <UIcon :name="ICONS.EYE" class="text-secondary-500 h-4 w-4" />
        </div>
      </div>
    </div>
  </div>
</template>
