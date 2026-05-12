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
  }[];
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: string;
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  required: false,
  placeholder: "",
  loading: false,
  disabled: false,
});

const emit = defineEmits(["update:modelValue"]);

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: any) => emit("update:modelValue", value),
});

// USelectMenu expects items with at least label; we use value-key so v-model is the value
const menuItems = computed(() => props.options.map(opt => ({ label: opt.label, value: opt.value })));
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
    <USelectMenu
      v-model="inputValue"
      value-key="value"
      :items="menuItems"
      :placeholder="props.placeholder"
      :loading="props.loading"
      :disabled="props.disabled"
      class="w-full"
      size="lg"
      :ui="{
        base: 'bg-transparent w-full ring-stone-300 rounded-lg hover:border-primary/50 hover:bg-transparent focus:border-primary',
        item: 'hover:bg-muted hover:text-foreground rounded-lg overflow-hidden cursor-pointer',
        content: 'bg-card border border-border',
        trailingIcon: 'h-5 w-5 text-foreground',
        leadingIcon: 'h-5 w-5 text-foreground',
      }"
    >
      <template v-if="props.leadingIcon" #leading>
        <UIcon :name="props.leadingIcon" />
      </template>
    </USelectMenu>
  </UFormField>
</template>
