<script setup lang="ts">
type Step = {
  title: string;
  description?: string;
};

type Props = {
  steps: Step[];
  currentStep: number;
};

defineProps<Props>();

const emit = defineEmits<{
  (e: "select", step: number): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-6">
    <button
      v-for="(step, index) in steps"
      :key="step.title"
      type="button"
      class="group grid grid-cols-[40px_minmax(0,1fr)] gap-3 text-left"
      @click="emit('select', index + 1)"
    >
      <div class="flex flex-col items-center">
        <div
          class="flex h-10 w-10 bg-primary-700 items-center text-white justify-center rounded-full border text-sm font-semibold transition"
          :class="index + 1 === currentStep
            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#966F33]'
            : ''"
        >
          {{ index + 1 }}
        </div>
        <div
          v-if="index !== steps.length - 1"
          class="mt-2 h-14 w-px"
          :class="index + 1 < currentStep ? 'bg-amber-200' : 'bg-stone-200'"
        />
      </div>

      <div class="pt-1">
        <p
          class="text-sm font-semibold transition"
          :class="index + 1 === currentStep ? 'text-secondary' : 'group-hover:text-secondary'"
        >
          {{ step.title }}
        </p>
        <p class="text-sm text-stone-400">
          {{ step.description }}
        </p>
      </div>
    </button>
  </div>
</template>
