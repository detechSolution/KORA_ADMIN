<script setup lang="ts">
type Props = {
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
};

defineProps<Props>();
</script>

<template>
  <div
    class="flex cursor-pointer w-full gap-6 border border-stone-200 rounded-md bg-[#F9F6F2] p-4 shadow-sm"
    :class="isActive ? 'border-primary-700' : 'bg-transparent'"
  >
    <div
      class="p-3 h-10 w-10 rounded-full flex items-center justify-center"
      :class="isActive ? 'bg-primary-700 text-white' : 'bg-primary-50 text-primary'"
    >
      <UIcon
        :name="icon"
        class="h-6 w-6"
      />
    </div>
    <div class="flex flex-col gap-1">
      <h2 class="font-medium text-sm text-secondary">
        {{ title }}
      </h2>
      <p class="text-xs text-secondary-600 font-normal">
        {{ description }}
      </p>
    </div>
  </div>
</template>
