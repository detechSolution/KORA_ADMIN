<script setup lang="ts">
import type { RouteLocationAsPathGeneric, RouteLocationAsRelativeGeneric } from "vue-router";

import { computed } from "vue";

type Props = {
  variant?: "solid" | "link" | "outline" | "ghost";
  leadingIcon?: string;
  trailingIcon?: string;
  loading?: boolean;
  disabled?: boolean;
  to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary";
};

const props = withDefaults(defineProps<Props>(), {
  variant: "solid",
  color: "primary",
  leadingIcon: "",
  trailingIcon: "",
  loading: false,
  disabled: false,
  type: "button",
  to: "",
  size: "lg",
});

// Use explicit class names so Tailwind includes them at build time (no dynamic class names)
const getStyles = computed(() => {
  if (props.color === "primary") {
    switch (props.variant) {
      case "solid":
        return "bg-secondary dark:bg-secondary hover:bg-secondary/75 active:bg-secondary/75 text-white";
      case "outline":
        return "border ring-0 text-secondary bg-transparent border-stone-300 hover:bg-stone-50";
      case "ghost":
        return "text-foreground hover:bg-primary/10";
      case "link":
        return "text-foreground hover:text-primary";
      default:
        return "bg-primary hover:bg-primary/75";
    }
  }
  return "bg-primary hover:bg-primary/75";
});
</script>

<template>
  <UButton
    :leading-icon="leadingIcon"
    :trailing-icon="trailingIcon"
    loading-icon="i-ph-spinner-gap"
    :loading="loading"
    :disabled="disabled"
    :type="type"
    :to="to"
    :size="size"
    :variant="variant"
    :class="`cursor-pointer ${getStyles} flex items-center justify-center font-semibold`"
  >
    <slot />
  </UButton>
</template>
