<script setup lang="ts">
import { computed } from "vue";

type Props = {
  name: string; // Required for UFormField
  label?: string;
  placeholder?: string;
  required?: boolean;
  modelValue: any;
  options: {
    label: string;
    value: any;
  }[];
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: string;
  inputBgPrimary?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  required: false,
  placeholder: "",
  loading: false,
  disabled: false,
  inputBgPrimary: true,
});

const emit = defineEmits(["update:modelValue"]);

const inputValue = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
});
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :required="props.required"
    :ui="{
      error: 'mt-1 text-red-500 text-xs',
    }"
  >
    <USelect
      v-model="inputValue"
      :items="props.options"
      :placeholder="props.placeholder"
      :loading="props.loading"
      :disabled="props.disabled"
      variant="outline"
      class="w-full"
      size="lg"
      :ui="{
        base: 'bg-white ring-stone-300 placeholder:text-stone-400',
        item: 'hover:bg-muted hover:text-foreground rounded-lg overflow-hidden cursor-pointer',
        content: 'bg-card border border-border',
        trailingIcon: 'h-5 w-5 text-foreground',
        leadingIcon: 'h-5 w-5 text-foreground',
      }"
    >
      <template v-if="props.leadingIcon" #leading>
        <UIcon :name="props.leadingIcon" />
      </template>
    </USelect>
  </UFormField>
</template>
