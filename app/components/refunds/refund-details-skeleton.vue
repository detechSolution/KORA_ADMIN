<script setup lang="ts">
const bookingFields = Array.from({ length: 4 });
const cancellationCards = Array.from({ length: 2 });
const refundCards = Array.from({ length: 5 });
</script>

<template>
  <div class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
    <USkeleton class="h-4 w-40" />

    <div class="grid grid-cols-2 gap-4">
      <div
        v-for="(_, index) in bookingFields"
        :key="`booking-field-${index}`"
        class="flex flex-col gap-2"
      >
        <USkeleton class="h-3 w-20" />
        <USkeleton class="h-4 w-28" />
      </div>
    </div>

    <USkeleton class="h-px w-full" />
    <USkeleton class="h-4 w-48" />

    <div class="grid grid-cols-2 gap-3">
      <USkeleton
        v-for="(_, index) in cancellationCards"
        :key="`cancellation-card-${index}`"
        class="h-20 w-full rounded-md"
      />
    </div>

    <USkeleton class="h-px w-full" />

    <div class="flex items-center justify-between">
      <USkeleton class="h-4 w-32" />
      <USkeleton class="h-6 w-24 rounded-md" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <USkeleton
        v-for="(_, index) in refundCards"
        :key="`refund-card-${index}`"
        class="h-20 w-full rounded-md"
        :class="index === refundCards.length - 1 ? 'col-span-2' : ''"
      />
    </div>
  </div>
</template>
