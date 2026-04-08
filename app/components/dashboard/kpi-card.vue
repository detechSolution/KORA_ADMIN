<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import { ICONS } from "~/config/icons";

const props = withDefaults(defineProps<Props>(), {
  subtitle: "",
  icon: ICONS.DASHBOARD,
  link: undefined,
});

const router = useRouter();

type Props = {
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
    class="relative rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm transition-colors duration-200"
    :class="[
      isClickable
        ? 'cursor-pointer hover:bg-primary/10'
        : '',
    ]"
    @click="handleClick"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col gap-2 min-w-0">
        <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {{ title }}
        </h3>
        <p class="text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
          {{ typeof value === 'number' ? value.toLocaleString() : value }}
        </p>

        <!-- Subtitle -->
        <p v-if="subtitle" class="text-[11px] text-muted-foreground mt-1">
          {{ subtitle }}
        </p>
      </div>

      <!-- Icon badge -->
      <div class="flex items-center justify-center rounded-full bg-primary/10 text-primary h-10 w-10 shrink-0">
        <UIcon :name="icon" class="h-5 w-5" />
      </div>
    </div>
  </div>
</template>
