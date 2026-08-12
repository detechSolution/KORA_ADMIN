<script setup lang="ts">
import { ICONS } from "~/config/icons";

defineProps<{
  icon?: string;
  label: string;
  description: string;
}>();
</script>

<template>
  <div class="bg-stone-50 border border-stone-200 rounded-lg p-4 flex gap-2 items-start">
    <UIcon :name="icon || ICONS.INFO" class="text-primary" />
    <div class="flex flex-col gap-0.5">
      <h3 class="text-sm text-secondary font-medium">
        {{ label }}
      </h3>
      <p class="text-secondary-500 text-xs">
        {{ description }}
      </p>
    </div>
  </div>
</template>
