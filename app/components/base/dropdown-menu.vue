<script setup lang="ts">
import { computed } from "vue";

import { ICONS } from "~/config/icons";

type DropdownItem = {
  label?: string;
  icon?: string;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
  [key: string]: any;
};

type Props = {
  items: DropdownItem[];
  icon?: string;
  disabled?: boolean;
  content?: Record<string, any>;
  menuUi?: Record<string, any>;
  buttonClass?: string;
};

const props = withDefaults(defineProps<Props>(), {
  icon: ICONS.ELLIPSIS_VERTICAL,
  disabled: false,
  content: () => ({ align: "end" }),
  menuUi: () => ({
    content: "min-w-[180px]",
    itemLeadingIcon: "hidden",
  }),
  buttonClass: "ml-auto",
});

const menuItems = computed(() => props.items);
</script>

<template>
  <UDropdownMenu
    :items="menuItems"
    :content="props.content"
    :ui="props.menuUi"
    :disabled="props.disabled"
  >
    <slot>
      <UButton
        :icon="props.icon"
        color="neutral"
        variant="ghost"
        :disabled="props.disabled"
        :class="props.buttonClass"
      />
    </slot>
  </UDropdownMenu>
</template>
