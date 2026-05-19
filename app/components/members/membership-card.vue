<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { MembershipPlanOption } from "~/types/membership";

const props = defineProps<{
  name: string;
  currency?: string;
  options: MembershipPlanOption[];
  isSelected: boolean;
}>();

const emit = defineEmits<{
  select: [optionId: number];
}>();

const defaultOption = props.options.find(option => option.isVisible) ?? props.options[0] ?? null;
const selectedOptionId = ref<number | null>(defaultOption?.id ?? null);

const selectedOption = computed(() =>
  props.options.find(o => o.id === selectedOptionId.value) ?? null,
);

const priceLabel = computed(() => {
  const price = selectedOption.value?.price;
  const frequency = selectedOption.value?.frequency ?? "month";
  const currency = props.currency ?? "Rs.";
  if (price == null)
    return `${currency} 0/month`;
  return `${currency} ${Number(price).toLocaleString()}/${frequency}`;
});

const selectOptions = computed(() =>
  props.options.map(option => ({
    label: option.frequency.charAt(0).toUpperCase() + option.frequency.slice(1),
    value: option.id,
  })),
);

watch(selectedOptionId, (newId) => {
  if (newId != null) {
    emit("select", newId);
  }
});

function handleCardClick() {
  if (selectedOptionId.value != null) {
    emit("select", selectedOptionId.value);
  }
}
</script>

<template>
  <div
    class="w-full cursor-pointer rounded-md border px-4 py-5 text-left transition-colors sm:px-5"
    :class="isSelected
      ? 'border-primary-300 bg-primary-50'
      : 'border-stone-200 bg-white hover:bg-stone-50'"
    @click="handleCardClick"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 items-center gap-4">
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors"
          :class="isSelected ? 'border-primary bg-primary' : 'border-stone-300 bg-white'"
        >
          <span
            class="h-2 w-2 rounded-full"
            :class="isSelected ? 'bg-white' : 'bg-transparent'"
          />
        </span>

        <div class="min-w-0 flex flex-col gap-1">
          <h3 class="truncate text-sm font-medium text-secondary">
            {{ name }}
          </h3>

          <base-select
            v-model="selectedOptionId"
            :options="selectOptions"
            value-attribute="value"
            option-attribute="label"
            name=""
            class="w-30"
            is-borderless
          />
        </div>
      </div>

      <p class="shrink-0 text-sm font-semibold text-stone-500">
        {{ priceLabel }}
      </p>
    </div>
  </div>
</template>
