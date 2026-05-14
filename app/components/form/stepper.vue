<script setup lang="ts">
import { ICONS } from "../../config/icons";

type Step = {
  label?: string;
  title?: string;
  description?: string;
};

type Props = {
  steps: Step[];
  currentStep: number;
  ariaLabel?: string;
  orientation?: "horizontal" | "vertical";
};

withDefaults(defineProps<Props>(), {
  ariaLabel: "Progress",
  orientation: "vertical",
});

const emit = defineEmits<{
  (e: "select", step: number): void;
}>();

function getStepLabel(step: Step) {
  return step.label ?? step.title ?? "";
}
</script>

<template>
  <div
    class="flex shrink-0"
    :class="[
      orientation === 'vertical'
        ? 'flex-col lg:w-56 xl:w-64 lg:border-r lg:border-border lg:pr-8'
        : 'flex-col w-full',
    ]"
  >
    <!-- Mobile View (Always Horizontal-ish Circles) -->
    <div
      class="lg:hidden flex items-center justify-between gap-2 px-1 py-3 border-b border-border"
    >
      <span class="text-sm font-medium text-muted-foreground">
        Step {{ currentStep + 1 }} of {{ steps.length }}
      </span>
      <div class="flex gap-1.5">
        <button
          v-for="(step, index) in steps"
          :key="getStepLabel(step) || index"
          type="button"
          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors"
          :class="[
            index === currentStep
              ? 'bg-primary text-primary-foreground border-primary'
              : index < currentStep
                ? 'bg-primary/10 text-primary border-primary'
                : 'bg-muted/50 text-muted-foreground border-border',
          ]"
          :aria-label="`Go to step ${index + 1}: ${getStepLabel(step)}`"
          :aria-current="index === currentStep ? 'step' : undefined"
          :disabled="index > currentStep"
          @click="index <= currentStep && emit('select', index)"
        >
          <UIcon
            v-if="index < currentStep"
            :name="ICONS.CHECK"
            class="w-3.5 h-3.5"
          />
          <span v-else>{{ index + 1 }}</span>
        </button>
      </div>
    </div>

    <!-- Main Stepper View -->
    <nav
      :class="[
        orientation === 'vertical' ? 'hidden lg:flex lg:flex-col' : 'flex flex-row items-center justify-between w-full',
      ]"
      :aria-label="ariaLabel"
    >
      <template
        v-for="(step, index) in steps"
        :key="getStepLabel(step) || index"
      >
        <!-- Vertical Step -->
        <div
          v-if="orientation === 'vertical'"
          class="flex items-start gap-3"
        >
          <div class="flex flex-col items-center shrink-0">
            <button
              type="button"
              class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border-2 shrink-0 transition-colors"
              :class="[
                index === currentStep
                  ? 'bg-primary-700 text-primary-foreground border-primary-700 ring-2 ring-offset-2 ring-primary-700'
                  : index < currentStep
                    ? 'bg-primary/10 text-primary border-primary cursor-pointer hover:bg-primary/20'
                    : 'bg-muted text-muted-foreground border-border cursor-default',
              ]"
              :aria-current="index === currentStep ? 'step' : undefined"
              :disabled="index > currentStep"
              @click="index <= currentStep && emit('select', index)"
            >
              <UIcon
                v-if="index < currentStep"
                :name="ICONS.CHECK"
                class="w-4 h-4"
              />
              <span v-else>{{ index + 1 }}</span>
            </button>
            <div
              v-if="index < steps.length - 1"
              class="w-px h-10 my-0.5"
              :class="index < currentStep ? 'bg-primary' : 'bg-border'"
            />
          </div>
          <div class="flex flex-col pt-1 min-w-0">
            <span
              class="text-sm font-medium whitespace-nowrap"
              :class="index === currentStep ? 'text-foreground' : 'text-muted-foreground'"
            >
              {{ getStepLabel(step) }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{ step.description }}
            </span>
          </div>
        </div>

        <!-- Horizontal Step -->
        <div
          v-else
          class="hidden lg:flex lg:flex-1 lg:items-center lg:last:flex-none"
        >
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm shrink-0 border-2"
              :class="[
                index === currentStep
                  ? 'bg-primary-700 text-primary-foreground border-primary-700 ring-2 ring-offset-2 ring-primary-700'
                  : index < currentStep
                    ? 'bg-primary/10 text-primary border-primary cursor-pointer hover:bg-primary/20'
                    : 'bg-muted text-muted-foreground border-border cursor-default',
              ]"
              :aria-current="index === currentStep ? 'step' : undefined"
              :disabled="index > currentStep"
              @click="index <= currentStep && emit('select', index)"
            >
              <UIcon
                v-if="index < currentStep"
                :name="ICONS.CHECK"
                class="w-4 h-4"
              />
              <span v-else>{{ index + 1 }}</span>
            </button>
            <div class="flex flex-col">
              <span
                class="text-sm font-medium whitespace-nowrap"
                :class="index === currentStep ? 'text-foreground' : 'text-muted-foreground'"
              >
                {{ getStepLabel(step) }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ step.description }}
              </span>
            </div>
          </div>
          <!-- Horizontal Connector -->
          <div
            v-if="index < steps.length - 1"
            class="flex-1 h-px mx-4 min-w-5"
            :class="index < currentStep ? 'bg-primary' : 'bg-stone-300'"
          />
        </div>
      </template>
    </nav>
  </div>
</template>
