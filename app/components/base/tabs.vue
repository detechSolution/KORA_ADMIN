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
  color?: "primary" | "secondary";
  contentClass?: string;
};

const props = withDefaults(defineProps<Props>(), {
  orientation: "horizontal",
  variant: "solid",
  contentClass: "",
  color: "primary",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", item: BaseTabItem): void;
}>();

const activeItem = computed(() => props.items.find(item => item.value === props.modelValue) ?? null);

const listClass = computed(() => {
  if (props.orientation === "vertical")
    return "flex-col gap-2";

  return "gap-1 overflow-x-auto bg-stone-100 w-fit p-1 rounded-md scroll-smooth hide-scrollbar";
});

const colorMap = {
  primary: {
    solid: { active: "bg-primary text-white shadow-sm", inactive: "text-foreground hover:bg-muted" },
    soft: { active: "bg-primary-50 text-primary", inactive: "text-foreground hover:bg-muted" },
  },
  secondary: {
    solid: { active: "bg-secondary text-white shadow-sm", inactive: "text-foreground hover:bg-muted" },
    soft: { active: "bg-secondary-50 text-secondary", inactive: "text-foreground hover:bg-muted" },
  },
};

const sizeClasses = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };

function getTabClass(item: BaseTabItem): string {
  if (item.disabled)
    return "cursor-not-allowed opacity-50";
  const isActive = props.modelValue === item.value;
  const colorVariant = colorMap[props.color][props.variant];
  const baseClass = isActive ? colorVariant.active : colorVariant.inactive;
  return `${baseClass} ${sizeClasses[props.size]}`;
}

function getIconClass(item: BaseTabItem): string {
  if (item.disabled)
    return "text-muted-foreground/60";
  const isActive = props.modelValue === item.value;
  return isActive ? (props.variant === "solid" ? "text-white" : `text-${props.color}`) : "text-muted-foreground";
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
      class="shrink-0 overflow-hidden rounded-lg"
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
