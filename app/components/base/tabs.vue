<script setup lang="ts">
import { computed } from "vue";

export type BaseTabItem = {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
};

type Props = {
  modelValue: string;
  items: BaseTabItem[];
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "soft";
  contentClass?: string;
};

const props = withDefaults(defineProps<Props>(), {
  orientation: "horizontal",
  variant: "solid",
  contentClass: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", item: BaseTabItem): void;
}>();

const activeItem = computed(() => props.items.find(item => item.value === props.modelValue) ?? null);

const listClass = computed(() => {
  if (props.orientation === "vertical")
    return "flex-col gap-2";

  return "gap-1 overflow-x-auto scroll-smooth hide-scrollbar";
});

function getTabClass(item: BaseTabItem): string {
  const isActive = props.modelValue === item.value;

  if (item.disabled)
    return "cursor-not-allowed text-muted-foreground/60 opacity-60";

  if (props.variant === "soft") {
    return isActive
      ? "bg-primary-50 text-primary"
      : "text-foreground hover:bg-muted";
  }

  return isActive
    ? "bg-primary text-white shadow-sm"
    : "text-foreground hover:bg-muted";
}

function getIconClass(item: BaseTabItem): string {
  const isActive = props.modelValue === item.value;

  if (item.disabled)
    return "text-muted-foreground/60";

  if (props.variant === "soft") {
    return isActive
      ? "text-primary"
      : "text-muted-foreground group-hover:text-foreground";
  }

  return isActive
    ? "text-white"
    : "text-muted-foreground group-hover:text-foreground";
}

function selectTab(item: BaseTabItem): void {
  if (item.disabled || item.value === props.modelValue)
    return;

  emit("update:modelValue", item.value);
  emit("change", item);
}
</script>

<template>
  <div class="flex min-h-0 flex-col gap-4">
    <div
      class="shrink-0 overflow-hidden rounded-lg  p-1.5"
      :class="{ 'w-full': orientation === 'horizontal' }"
    >
      <nav
        class="flex"
        :class="listClass"
        role="tablist"
        :aria-orientation="orientation"
      >
        <button
          v-for="item in items"
          :key="item.value"
          type="button"
          role="tab"
          :aria-selected="modelValue === item.value"
          :aria-disabled="item.disabled || undefined"
          :tabindex="item.disabled ? -1 : 0"
          :disabled="item.disabled"
          class="group flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
          :class="getTabClass(item)"
          @click="selectTab(item)"
        >
          <UIcon
            v-if="item.icon"
            :name="item.icon"
            class="h-4 w-4 shrink-0 transition-all duration-200"
            :class="getIconClass(item)"
          />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </div>

    <div
      v-if="$slots.default"
      class="min-h-0 flex-1"
      :class="contentClass"
    >
      <Transition
        name="tab-fade"
        mode="out-in"
      >
        <slot
          :key="modelValue"
          :active-tab="modelValue"
          :active-item="activeItem"
        />
      </Transition>
    </div>
  </div>
</template>
