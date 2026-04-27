<script setup lang="ts">
type Props = {
  title?: string;
  description?: string;
};

defineProps<Props>();
</script>

<template>
  <section class="rounded-[6px]">
    <div
      v-if="title || description || $slots.icon"
      class="flex items-start gap-2 px-5 py-4"
    >
      <slot name="icon" />

      <div class="min-w-0">
        <p v-if="title" class="text-base font-semibold text-secondary">
          {{ title }}
        </p>
        <p v-if="description" class="text-sm text-secondary-500">
          {{ description }}
        </p>
      </div>
    </div>

    <slot />
  </section>
</template>
