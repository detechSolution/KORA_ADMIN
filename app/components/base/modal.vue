<script setup lang="ts">
import { computed } from "vue";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  dismissible?: boolean;
  fullscreen?: boolean;
  overlay?: boolean;
  modalWidth?: number;
  /** When set (e.g. "90vh"), constrains modal height and makes body scrollable */
  modalMaxHeight?: string;
};

const props = withDefaults(defineProps<Props>(), {
  dismissible: false,
  fullscreen: false,
  overlay: true,
  modalWidth: 600,
  modalMaxHeight: undefined,
  title: "Modal",
  description: "Modal",
});

const emit = defineEmits<{
  (e: "close", value: boolean): void;
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => {
    emit("close", value);
  },
});

// Use fixed max-width classes so Tailwind includes them (safelist in app.config)
const widthClassMap: Record<number, string> = {
  600: "max-w-[600px]",
  700: "max-w-[700px]",
  800: "max-w-[800px]",
  900: "max-w-[900px]",
  1000: "max-w-[1000px]",
};

const contentWidthClass = computed(() => widthClassMap[props.modalWidth] ?? "max-w-[600px]");

const ui = computed(() => {
  const contentBase = `bg-card text-card-foreground border-0 rounded-lg shadow-xl mx-auto ${contentWidthClass.value}`;
  const contentHeight = props.modalMaxHeight
    ? " h-[90vh] max-h-[90vh] flex flex-col overflow-hidden"
    : "";
  return {
    content: contentBase + contentHeight,
    header: "flex items-center justify-between p-6 shrink-0",
    close: "hover:bg-muted hover:text-foreground text-muted-foreground cursor-pointer rounded-md p-2",
    title: "text-lg",
  };
});
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :dismissible="dismissible"
    :fullscreen="fullscreen"
    :ui="ui"
    transition
  >
    <template #title>
      {{ props.title }}
    </template>
    <template v-if="description" #description>
      {{ props.description }}
    </template>
    <template #body>
      <div
        v-if="modalMaxHeight"
        class="flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
      >
        <slot />
      </div>
      <slot v-else />
    </template>
  </UModal>
</template>
