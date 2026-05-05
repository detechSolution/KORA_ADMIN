<script setup lang="ts">
import { ICONS } from "~/config/icons";

defineProps<SessionCardProps>();

type SessionCardProps = {
  title: string;
  type: string;
  trainer: string;
  date: string;
  time: string;
  location: string;
  price: string;
  capacity: number;
  registered: number;
};
</script>

<template>
  <div class="bg-card rounded-xl box-shadow">
    <div class="p-4 border-b border-stone-100 flex  items-start justify-between">
      <div class="flex flex-col gap-2">
        <h2 class="text-base font-medium">
          {{ title }}
        </h2>
        <p class="text-[10px] text-secondary-500">
          <UIcon :name="ICONS.USER" /> {{ trainer }}
        </p>
      </div>

      <base-badge :color="getStatusColor(type)">
        {{ type }}
      </base-badge>
    </div>
    <div class="flex p-4 flex-col gap-2 text-xs text-secondary-700">
      <p class="flex items-center gap-2">
        <UIcon :name="ICONS.CALENDAR" class="text-primary" /> {{ date }}
      </p>
      <p class="flex items-center gap-2">
        <UIcon :name="ICONS.LOCATION" class="text-primary" /> {{ location }}
      </p>
      <p class="flex items-center gap-2">
        <UIcon :name="ICONS.CLOCK" class="text-primary" /> {{ time }}
      </p>
    </div>

    <div class="p-4 pt-0">
      <base-progress
        :value="registered"
        :max="capacity"
        size="sm"
        :color="registered >= capacity ? 'error' : 'success'"
        label="Capacity"
        show-text
      />
    </div>

    <!-- Footer -->
    <div class="px-4 py-3 border-t border-stone-100 flex items-center justify-between">
      <div class="text-sm font-semibold">
        {{ price }}
      </div>
      <div class="flex items-center gap-3 text-secondary-400">
        <UIcon :name="ICONS.CLIPBOARD_CHECK" class="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
        <UIcon :name="ICONS.EDIT" class="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
        <UIcon :name="ICONS.EYE" class="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
        <UIcon :name="ICONS.COPY" class="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
      </div>
    </div>
  </div>
</template>

<style>
.box-shadow {
  box-shadow: 0px 0px 5px 0px #0000000d;
}
</style>
