<script setup lang="ts">
import { ICONS } from "~/config/icons";

defineProps<roleCardProps>();

type roleCardProps = {
  id: number;
  name: string;
  description: string;
  operators: number;
  isActive: boolean;

};
</script>

<template>
  <div class="min-w-65 w-full md:min-w-0 border-2 flex flex-col gap-4 rounded-lg cursor-pointer p-4 shrink-0 md:shrink" :class="isActive ? 'border-primary-700' : 'border-stone-200'">
    <h2 class="font-semibold text-sm">
      {{ name }}
    </h2>
    <div class="flex flex-col gap-3">
      <p class="text-xs text-secondary-500">
        {{ description }}
      </p>
      <hr class="border border-stone-200">
      <div class="flex gap-2 text-xs font-normal text-secondary-500 items-center">
        <UIcon :name="ICONS.USERS" />
        <p>{{ operators }} Operators</p>
      </div>
    </div>
  </div>
</template>
