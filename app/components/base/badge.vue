<script setup lang="ts">
import { computed } from "vue";

type Color
  = | "primary"
    | "emerald"
    | "red"
    | "amber"
    | "orange"
    | "blue"
    | "indigo"
    | "sky"
    | "muted"
    | "success"
    | "purple"
    | "yellow";

type Props = {
  color?: Color;
  class?: string;
};

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
  class: "",
});

const colorClasses = computed(() => {
  const colorMap: Record<Color, string> = {
    primary: "bg-primary/10 text-primary border border-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 border border-emerald-500",
    red: "bg-red-500/10 text-red-500 border border-red-500",
    amber: "bg-amber-500/10 text-amber-600 border border-amber-500",
    orange: "bg-orange-500/10 text-orange-600 border border-orange-500",
    blue: "bg-blue-500/10 text-blue-600 border border-blue-500",
    indigo: "bg-indigo-500/10 text-indigo-600 border border-indigo-500",
    sky: "bg-sky-500/10 text-sky-600 border border-sky-500",
    muted: "bg-muted text-muted-foreground border border-border",
    success: "bg-emerald-500/10 text-emerald-600 border border-emerald-500",
    purple: "bg-purple-500/10 text-purple-600 border border-purple-500",
    yellow: "bg-yellow-500/10 text-yellow-600 border border-yellow-500",
  };

  return colorMap[props.color] || colorMap.primary;
});

const badgeClasses = computed(() => {
  const baseClasses = "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded-md shadow-sm";
  return `${baseClasses} ${colorClasses.value} ${props.class}`;
});
</script>

<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>
