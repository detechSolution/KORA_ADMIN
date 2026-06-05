<script setup lang="ts">
type Props = {
  name?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  class?: string;
};

const props = withDefaults(defineProps<Props>(), {
  name: "",
  size: "md",
  class: "",
});
</script>

<template>
  <UAvatar
    :src="props.src || undefined"
    :alt="props.name"
    :size="props.size"
    class="uppercase"
    :class="[props.class]"
    :ui="{
      root: 'bg-secondary-50',
      fallback: 'text-secondary-500',
      icon: 'text-secondary-500',
    }"
  />
</template>
