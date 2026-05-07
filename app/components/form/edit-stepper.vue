<script setup lang="ts">
defineProps<{
  steps: { title: string }[];
  currentStep: number;
}>();

const emit = defineEmits(["update:currentStep"]);
</script>

<template>
  <div class="flex items-center gap-3 px-5 py-5">
    <template v-for="(step, index) in steps" :key="step.title">
      <button
        type="button"
        class="flex min-w-0 flex-col items-center gap-1 text-center"
        @click="emit('update:currentStep', index)"
      >
        <span
          class="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium mb-1"
          :class="index === currentStep
            ? 'border-primary-700 bg-primary-700 text-white ring-2 ring-primary-700 ring-offset-2'
            : index < currentStep ? 'border-primary-700 bg-primary-700 text-white' : 'border-primary-700 text-primary-700'"
        >
          {{ index + 1 }}
        </span>
        <span class="text-xs font-medium" :class="index > currentStep ? 'text-secondary-500' : 'text-secondary'">
          {{ step.title }}
        </span>
      </button>

      <div
        v-if="index !== steps.length - 1"
        class="mb-5 h-px flex-1 bg-stone-200"
      />
    </template>
  </div>
</template>

<style scoped>

</style>
