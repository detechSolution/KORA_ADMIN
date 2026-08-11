<script setup lang="ts">
import { computed } from "vue";

type Props = {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  modelValue: any;
  options: {
    label: string;
    value: any;
    description?: string;
  }[];
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: string;
  error?: string;
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  required: false,
  placeholder: "",
  loading: false,
  disabled: false,
  error: undefined,
});

const emit = defineEmits(["update:modelValue"]);

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: any) => emit("update:modelValue", value),
});

// USelectMenu expects items with at least label; we use value-key so v-model is the value
const menuItems = computed(() => props.options.map(opt => ({
  label: opt.label,
  value: opt.value,
  description: opt.description,
})));
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :required="props.required"
    :error="props.error"
    :ui="{
      error: 'mt-1 text-red-500 text-xs',
    }"
  >
    <USelectMenu
      v-model="inputValue"
      value-key="value"
      :items="menuItems"
      :placeholder="props.placeholder"
      :loading="props.loading"
      :disabled="props.disabled"
      class="w-full text-stone-700"
      size="lg"
      :ui="{
        placeholder: 'text-stone-400',
        base: 'w-full bg-white text-stone-700 ring-stone-300 rounded-lg hover:border-stone-400 hover:bg-white focus:border-stone-400',
        content: 'bg-white border border-stone-300 rounded-lg shadow-lg',
        item: 'min-h-16 px-3 py-2.5 hover:bg-stone-50 hover:text-stone-800 rounded-md overflow-hidden cursor-pointer',
        itemLabel: 'text-sm text-stone-700',
        itemDescription: 'mt-0.5 text-xs text-stone-400',
        trailingIcon: 'h-5 w-5 text-foreground',
        leadingIcon: 'h-5 w-5 text-stone-400',
      }"
    >
      <template v-if="props.leadingIcon" #leading>
        <UIcon :name="props.leadingIcon" />
      </template>
    </USelectMenu>
  </UFormField>
</template>
