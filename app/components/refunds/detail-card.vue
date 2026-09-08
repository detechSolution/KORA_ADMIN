<script setup lang="ts">
type Props = {
  label: string;
  value: string;
  icon: string;
  green?: boolean;
};

defineProps<Props>();
</script>

<template>
  <div
    class="flex flex-col gap-2 rounded-md border p-3"
    :class="green
      ? 'border-emerald-300 bg-emerald-50'
      : 'border-stone-200 bg-stone-50'"
  >
    <div
      class="flex items-center gap-1 text-xs font-normal"
      :class="green ? 'text-emerald-600' : 'text-secondary-400'"
    >
      <UIcon :name="icon" class="h-3 w-3" />
      <h3>{{ label }}</h3>
    </div>
    <p
      class="text-sm font-medium"
      :class="green ? 'text-emerald-600' : 'text-secondary'"
    >
      {{ value }}
    </p>
  </div>
</template>
