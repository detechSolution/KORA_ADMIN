<script setup lang="ts">
import { computed } from "vue";

type Props = {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  modelValue?: number | null;
  disabled?: boolean;
  readonly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
  increment?: boolean;
  decrement?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  placeholder: "",
  required: false,
  disabled: false,
  readonly: false,
  increment: true,
  decrement: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: number | null];
}>();

const inputValue = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value ?? null),
});
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :required="props.required"
    :ui="{
      error: 'mt-1 text-red-500 text-xs',
      label: 'text-sm font-medium text-stone-900',
    }"
  >
    <UInputNumber
      v-model="inputValue"
      :placeholder="props.placeholder"
      :required="props.required"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :format-options="props.formatOptions"
      :increment="props.increment"
      :decrement="props.decrement"
      variant="outline"
      size="lg"
      :ui="{
        base: 'ring-stone-300 placeholder:text-stone-400',
      }"
    >
      <template v-if="$slots.increment" #increment>
        <slot name="increment" />
      </template>
      <template v-if="$slots.decrement" #decrement>
        <slot name="decrement" />
      </template>
    </UInputNumber>
  </UFormField>
</template>
