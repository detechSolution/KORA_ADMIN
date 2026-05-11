<script setup lang="ts">
import { computed } from "vue";

import { ICONS } from "~/config/icons";

type SelectOption = {
  label: string;
  value: any;
  description?: string;
  disabled?: boolean;
  icon?: string;
  avatar?: {
    src?: string;
    alt?: string;
    text?: string;
  };
};

type Props = {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  modelValue: any;
  options: SelectOption[];
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: string;
  multiple?: boolean;
  clearable?: boolean;
  searchInput?: boolean | Record<string, any>;
  searchPlaceholder?: string;
  showCheckbox?: boolean;
  hiddenSelectedValues?: any[];
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  required: false,
  placeholder: "",
  loading: false,
  disabled: false,
  multiple: false,
  clearable: false,
  searchInput: true,
  searchPlaceholder: "Search...",
  showCheckbox: false,
  hiddenSelectedValues: () => [],
});

const emit = defineEmits(["update:modelValue"]);

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: any) => emit("update:modelValue", value),
});

const menuItems = computed(() =>
  props.options.map(option => ({
    label: option.label,
    value: option.value,
    description: option.description,
    disabled: option.disabled,
    icon: option.icon,
    avatar: option.avatar,
  })),
);

const resolvedSearchInput = computed(() => {
  if (props.searchInput === false) {
    return {};
  }

  const baseConfig = {
    placeholder: props.searchPlaceholder,
    leadingIcon: ICONS.SEARCH,
    variant: "none",
  };

  if (props.searchInput === true) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...props.searchInput,
  };
});

function isSelected(value: any) {
  if (props.multiple && Array.isArray(inputValue.value)) {
    return inputValue.value.includes(value);
  }

  return inputValue.value === value;
}
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
      :multiple="props.multiple"
      :clear="props.clearable"
      :search-input="resolvedSearchInput"
      class="w-full"
      size="lg"
      variant="outline"
      :selected-icon="props.showCheckbox ? undefined : ICONS.CHECK"
      :ui="{
        base: 'bg-white hover:bg-transparent ring-stone-300 placeholder:text-stone-400',
        item: 'rounded-none border-b border-stone-200 last:border-b-0 hover:bg-stone-50 text-foreground cursor-pointer px-3 py-3',
        itemLabel: 'text-sm text-secondary',
        itemDescription: 'text-xs text-secondary-500',
        content: 'bg-card border border-border overflow-hidden',
        input: 'border-b border-stone-200 rounded-none px-3',
        itemLeadingAvatar: 'bg-stone-100 text-stone-500',
        itemTrailingIcon: props.showCheckbox ? 'hidden' : 'h-4 w-4 text-primary',
        trailingIcon: 'h-5 w-5 text-foreground',
        leadingIcon: 'h-5 w-5 text-foreground',
      }"
    >
      <template v-if="props.leadingIcon" #leading>
        <UIcon :name="props.leadingIcon" />
      </template>
      <template
        v-if="props.showCheckbox"
        #item-leading="{ item }"
      >
        <span class="flex items-center gap-3">
          <span
            class="flex h-4 w-4 items-center justify-center rounded-[3px] border transition-colors"
            :class="isSelected(item.value) ? 'border-primary bg-primary text-white' : 'border-stone-300 bg-white text-transparent'"
          >
            <UIcon :name="ICONS.CHECK" class="h-3 w-3" />
          </span>
          <UAvatar
            v-if="item.avatar"
            v-bind="item.avatar"
            size="xs"
            class="bg-stone-100 text-stone-500"
          />
          <UIcon
            v-else-if="item.icon"
            :name="item.icon"
            class="h-4 w-4 text-stone-500"
          />
        </span>
      </template>
    </USelectMenu>
  </UFormField>
</template>
