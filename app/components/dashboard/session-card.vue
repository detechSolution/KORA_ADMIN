<script setup lang="ts">
withDefaults(defineProps<DashboardSessionCardProps>(), {
  title: "",
  capacity: "",
  startsAt: "",
  occupied: "",
});

type DashboardSessionCardProps = {
  title?: string;
  capacity?: string;
  startsAt?: string;
  occupied?: string;
};
</script>

<template>
  <div
    class="relative flex justify-between min-w-75 max-w-75 rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm transition-colors duration-200"
  >
    <div class="flex flex-col gap-2">
      <h2 class="text-sm font-medium text-secondary">
        {{ title }}
      </h2>

      <div class="flex gap-2 text-[10px] md:text-xs text-secondary-500 items-center">
        {{ formatDateTimeWithDot(startsAt) }}
      </div>
    </div>
    <div class="bg-primary-50 flex self-end w-fit h-fit rounded-full px-2 py-1">
      <p class="text-[10px] font-medium text-primary">
        {{ occupied }}/ {{ capacity }}
      </p>
    </div>
  </div>
</template>
