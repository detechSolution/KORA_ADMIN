<script setup lang="ts">
import { useRouter } from "vue-router";

import { ICONS } from "~/config/icons";

const props = withDefaults(defineProps<KPICardProps>(), {
  subtitle: "",
  icon: ICONS.DASHBOARD,
  link: undefined,
  active: false,
  clickable: false,
});

const emit = defineEmits<{ click: [] }>();

const router = useRouter();

type KPICardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  link?: { path?: string; name?: string; params?: Record<string, any> };
  active?: boolean;
  clickable?: boolean;
};

function handleClick(): void {
  emit("click");

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
    class="relative duration-200 rounded p-3 ml-4"
    :class="clickable ? 'cursor-pointer' : ''"
    @click="handleClick"
  >
    <div class="flex items-center gap-3">
      <!-- Icon badge -->
      <div
        class="flex items-center self-start justify-center rounded text-white h-10 w-10 shrink-0"
        :class="active ? 'bg-secondary' : 'bg-primary'"
      >
        <UIcon :name="icon" class="h-5 w-5" />
      </div>
      <div class="flex flex-col gap-2 min-w-0">
        <h3 class="text-xs font-medium tracking-wide text-muted-foreground">
          {{ title }}
        </h3>
        <p class="text-lg sm:text-xl font-semibold text-foreground leading-tight">
          {{ typeof value === 'number' ? value.toLocaleString() : value }}
        </p>
        <h2
          class="text-sm"
          :class="active ? 'text-secondary' : 'text-secondary-500'"
        >
          {{ subtitle }}
        </h2>
      </div>
    </div>
  </div>
</template>
