<script setup lang="ts">
defineProps<{
  count?: number;
}>();
</script>

<template>
  <div
    v-for="n in (count || 1)"
    :key="`skeleton-session-card-${n}`"
    class="bg-card rounded-xl box-shadow p-4"
  >
    <!-- Header Section -->
    <div class="border-b border-stone-100 pb-4 mb-4 flex items-start justify-between">
      <div class="flex flex-col gap-2 flex-1">
        <USkeleton class="w-[80%] h-5" />
        <USkeleton class="w-[60%] h-3" />
      </div>
      <USkeleton class="w-15 h-5" />
    </div>

    <!-- Info Section -->
    <div class="flex flex-col gap-2 mb-4">
      <USkeleton class="w-[90%] h-3" />
      <USkeleton class="w-[85%] h-3" />
      <USkeleton class="w-[75%] h-3" />
    </div>

    <!-- Progress Section -->
    <div class="mb-4">
      <USkeleton class="w-full h-6" />
    </div>

    <!-- Footer Section -->
    <div class="border-t border-stone-100 pt-3 flex items-center justify-between">
      <USkeleton class="w-15 h-4" />
      <div class="flex gap-3">
        <USkeleton class="w-4 h-4" />
        <USkeleton class="w-4 h-4" />
        <USkeleton class="w-4 h-4" />
        <USkeleton class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>
