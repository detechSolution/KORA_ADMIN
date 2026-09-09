<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { ICONS } from "~/config/icons";

/* ── Types ──────────────────────────────────────────────── */

type BadgeColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";
type MetaColor = "success" | "error";

type SimpleOption = {
  label: string;
  value: any;
  description?: string;
  disabled?: boolean;
  icon?: string;
  avatar?: { src?: string; alt?: string; text?: string };
};

type LabelOption = { type: "label"; label: string };
type SeparatorOption = { type: "separator" };

type RichOption = SimpleOption & {
  meta?: string;
  metaColor?: MetaColor;
  badge?: { label: string; color?: BadgeColor };
};

type SelectOption = SimpleOption | LabelOption | SeparatorOption | RichOption;

/* ── Props ──────────────────────────────────────────────── */

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
  searchTerm?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyIcon?: string;
  showCheckbox?: boolean;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  hiddenSelectedValues?: any[];
  showAddAction?: boolean;
  addActionLabel?: string;
};

const props = withDefaults(defineProps<Props>(), {
  label: "",
  placeholder: "",
  required: false,
  loading: false,
  disabled: false,
  multiple: false,
  clearable: false,
  searchInput: true,
  searchPlaceholder: "Search...",
  emptyMessage: "No options available.",
  emptyIcon: undefined,
  showCheckbox: false,
  showSelectAll: false,
  selectAllLabel: "Select all",
  hiddenSelectedValues: () => [],
  showAddAction: false,
  addActionLabel: "Add item",
});

const emit = defineEmits<{
  "update:modelValue": [value: any];
  "update:searchTerm": [value: string];
  "add": [];
}>();

const isOpen = ref(false);
const searchValue = ref(props.searchTerm);

watch(() => props.searchTerm, (value) => {
  searchValue.value = value;
});

watch(searchValue, value => emit("update:searchTerm", value));

const inputValue = computed({
  get: () => props.modelValue,
  set: v => emit("update:modelValue", v),
});

function handleAddAction(): void {
  isOpen.value = false;
  emit("add");
}

/* ── Search config ──────────────────────────────────────── */

const resolvedSearchInput = computed(() => {
  if (props.searchInput === false)
    return {};

  const base = {
    placeholder: props.searchPlaceholder,
    leadingIcon: ICONS.SEARCH,
    variant: "none",
  };

  return props.searchInput === true ? base : { ...base, ...props.searchInput };
});

/* ── Helpers ────────────────────────────────────────────── */

function isSelected(value: any): boolean {
  return props.multiple && Array.isArray(inputValue.value)
    ? inputValue.value.includes(value)
    : inputValue.value === value;
}

const isLabelItem = (item: SelectOption): item is LabelOption => (item as any).type === "label";
const isRichOption = (item: SelectOption): item is RichOption => !("type" in item) && ("meta" in item || "badge" in item);
const hasValue = (item: SelectOption): item is RichOption | SimpleOption => "value" in item;
</script>

<template>
  <UFormField
    :label="props.label"
    :name="props.name"
    :required="props.required"
    :ui="{ error: 'mt-1 text-red-500 text-xs' }"
  >
    <USelectMenu
      v-model="inputValue"
      v-model:open="isOpen"
      v-model:search-term="searchValue"
      value-key="value"
      :items="props.options"
      :placeholder="props.placeholder"
      :loading="props.loading"
      :disabled="props.disabled"
      :multiple="props.multiple"
      :clear="props.clearable"
      :search-input="resolvedSearchInput"
      size="lg"
      variant="outline"
      class="w-full"
      :selected-icon="props.showCheckbox ? undefined : ICONS.CHECK"
      :ui="{
        base: 'bg-white hover:bg-transparent ring-stone-300 placeholder:text-stone-400',
        item: 'rounded-none hover:bg-stone-50 text-foreground cursor-pointer px-3 py-3',
        itemLabel: 'text-sm text-secondary',
        itemDescription: 'text-xs text-secondary-500',
        content: 'bg-card border border-border overflow-hidden',
        input: 'border-b border-stone-200 rounded-none px-3',
        itemLeadingAvatar: 'bg-stone-100 text-stone-500',
        itemTrailingIcon: props.showCheckbox ? 'hidden' : 'h-4 w-4 text-primary',
        trailingIcon: 'h-5 w-5 text-foreground',
        leadingIcon: 'h-5 w-5 text-foreground',
      }"
      @update:search-term="emit('update:searchTerm', $event)"
    >
      <template v-if="props.leadingIcon" #leading>
        <UIcon :name="props.leadingIcon" />
      </template>

      <template #empty>
        <slot name="empty">
          <div class="flex flex-col items-center justify-center gap-2 px-3 py-6 text-center text-sm text-stone-500">
            <div
              v-if="props.emptyIcon"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200"
            >
              <UIcon :name="props.emptyIcon" class="h-4 w-4 text-stone-500" />
            </div>
            <span>{{ props.emptyMessage }}</span>
          </div>
        </slot>
      </template>

      <template #item="{ item }">
        <!-- Section label -->
        <div
          v-if="isLabelItem(item)"
          class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400"
        >
          {{ item.label }}
        </div>

        <!-- Selectable item -->
        <div
          v-else
          class="flex w-full items-center justify-between gap-3"
        >
          <div class="flex min-w-0 items-center gap-2">
            <!-- Checkbox -->
            <span
              v-if="props.showCheckbox"
              class="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors"
              :class="
                isSelected(hasValue(item) ? item.value : null)
                  ? 'border-primary bg-primary text-white'
                  : 'border-stone-300 bg-white text-transparent'
              "
            >
              <UIcon :name="ICONS.CHECK" class="h-3 w-3" />
            </span>

            <!-- Avatar -->
            <UAvatar
              v-if="item.avatar"
              v-bind="item.avatar"
              size="xs"
              class="bg-stone-100 text-stone-500"
            />

            <!-- Icon (no avatar, no checkbox) -->
            <UIcon
              v-else-if="item.icon && !props.showCheckbox"
              :name="item.icon"
              class="h-4 w-4 shrink-0 text-stone-500"
            />

            <!-- Label + optional badge + description -->
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm text-secondary">{{ item.label }}</span>

                <base-badge
                  v-if="item.badge?.label"
                  :label="item.badge.label"
                  size="xs"
                  variant="soft"
                  :color="item.badge.color"
                >
                  {{ item.badge.label }}
                </base-badge>
              </div>

              <p v-if="item.description" class="text-xs text-stone-400">
                {{ item.description }}
              </p>
            </div>
          </div>

          <!-- Meta value -->
          <span
            v-if="isRichOption(item) && item.meta"
            class="shrink-0 text-xs font-medium"
            :class="item.metaColor === 'error' ? 'text-red-500' : 'text-emerald-500'"
          >
            {{ item.meta }}
          </span>

          <!-- Selected state -->
          <UIcon
            v-if="!props.showCheckbox && isSelected(hasValue(item) ? item.value : null)"
            :name="ICONS.CHECK"
            class="h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        </div>
      </template>

      <template v-if="props.showAddAction" #content-bottom>
        <div class="border-t border-stone-200 bg-white px-3 py-2">
          <base-button
            variant="ghost"
            class="text-primary"
            @click.stop="handleAddAction"
          >
            <UIcon :name="ICONS.PLUS" class="h-4 w-4" />
            {{ props.addActionLabel }}
          </base-button>
        </div>
      </template>
    </USelectMenu>
  </UFormField>
</template>
