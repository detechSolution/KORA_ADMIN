<script setup lang="ts">
withDefaults(defineProps<DashboardSessionCardProps>(), {
  title: "",
  date: "",
  time: "",
  capacity: "",
});

type DashboardSessionCardProps = {
  title?: string;
  date?: string;
  time?: string;
  capacity?: string;
};
</script>

<template>
  <div
    class="relative flex justify-between w-full rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm transition-colors duration-200"
  >
    <div class="flex flex-col gap-2">
      <h2 class="text-sm font-medium text-secondary">
        {{ title }}
      </h2>

      <div class="flex gap-2 text-secondary-500 items-center">
        <p class="text-xs">
          {{ formatDate(date) }}
        </p>
        <div class="h-1 w-1 bg-secondary-500 rounded-full" />
        <p class="text-xs">
          {{ time }}
        </p>
      </div>
    </div>
    <div class="bg-primary-50 w-fit h-fit rounded-full px-2 py-1">
      <p class="text-[10px] font-medium text-primary">
        {{ capacity }}
      </p>
    </div>
  </div>
</template>
