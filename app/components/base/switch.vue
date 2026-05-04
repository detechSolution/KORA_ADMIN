<script setup lang="ts">
import { computed } from "vue";

type Props = {
  name: string;
  label?: string;
  modelValue?: boolean;
  onLabel?: string;
  offLabel?: string;
  disabled?: boolean;
  showLabel?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  label: "Status",
  onLabel: "Active",
  offLabel: "Inactive",
  disabled: false,
  showLabel: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const switchLabel = computed(() =>
  props.modelValue ? props.onLabel : props.offLabel,
);

const checked = computed(() => props.modelValue ?? false);
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :ui="{ error: 'mt-1 text-red-500 text-xs' }"
  >
    <div
      class="flex h-10 items-center gap-3 w-full bg-transparent"
    >
      <USwitch
        :model-value="checked"
        size="lg"
        :disabled="props.disabled"
        class="shrink-0"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <span v-if="showLabel" class="text-sm font-medium text-foreground">{{ switchLabel }}</span>
    </div>
  </UFormField>
</template>
