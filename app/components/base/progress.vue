<script setup lang="ts">
import { useAttrs } from "vue";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  max: 100,
  color: "primary",
  size: "md",
  indicator: false,
  showText: false,
});

type Props = {
  value?: number;
  max?: number;
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  indicator?: boolean;
  animation?: "elastic" | "carousel" | "carousel-inverse" | "swing";
  label?: string;
  description?: string;
  showText?: boolean;
};

const attrs = useAttrs();
</script>

<template>
  <div class="w-full">
    <div v-if="label || $slots.label || showText" class="flex justify-between items-center mb-2">
      <span v-if="label || $slots.label" class="text-secondary-500 text-xs capitalize">
        <slot name="label">{{ label }}</slot>
      </span>
      <span v-if="showText" class="text-secondary-700 text-xs font-medium">
        <slot name="description">{{ description || `${value || 0} / ${max || 0}` }}</slot>
      </span>
    </div>

    <UProgress
      :value="props.value"
      :model-value="props.value"
      :max="props.max"
      :color="props.color"
      :size="props.size"
      :indicator="props.indicator"
      :animation="props.animation"
      v-bind="attrs"
    />
  </div>
</template>
