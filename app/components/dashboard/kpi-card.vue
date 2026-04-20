<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import { ICONS } from "~/config/icons";

const props = withDefaults(defineProps<KPICardProps>(), {
  subtitle: "",
  icon: ICONS.DASHBOARD,
  link: undefined,
});

const router = useRouter();

type KPICardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  link?: { path?: string; name?: string; params?: Record<string, any> };
};

const isClickable = computed(() => Boolean(props.link && (props.link.path || props.link.name)));

function handleClick(): void {
  if (!props.link)
    return;
  if (props.link.path) {
    router.push(props.link.path);
  }
  else if (props.link.name) {
    router.push({ name: props.link.name, params: props.link.params });
  }
}
</script>

<template>
  <div
    class="relative duration-200"
    :class="[
      isClickable
        ? 'cursor-pointer'
        : '',
    ]"
    @click="handleClick"
  >
    <div class="flex items-center gap-3">
      <!-- Icon badge -->
      <div class="flex items-center justify-center rounded bg-primary-600 text-white h-10 w-10 shrink-0">
        <UIcon :name="icon" class="h-5 w-5" />
      </div>
      <div class="flex flex-col gap-2 min-w-0">
        <h3 class="text-xs font-medium tracking-wide text-muted-foreground">
          {{ title }}
        </h3>
        <p class="text-lg sm:text-xl font-semibold text-foreground leading-tight">
          {{ typeof value === 'number' ? value.toLocaleString() : value }}
        </p>
      </div>
    </div>
  </div>
</template>
