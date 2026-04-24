<script setup lang="ts">
import { computed } from "vue";

import { ICONS } from "~/config/icons";

type ServicePrice = {
  id?: number;
  duration: string | number;
  price: string | number;
  timeUnit: string;
};

type ServiceCardProps = {
  id: string | number;
  name: string;
  prices: ServicePrice[];
  description: string;
};

const props = defineProps<ServiceCardProps>();

const emit = defineEmits<{
  (e: "edit", id: number): void;
  (e: "delete", id: number): void;
}>();

const hasScrollablePrices = computed(() => props.prices.length > 3);

function handleEdit(): void {
  emit("edit", Number(props.id));
}

function handleDelete(): void {
  emit("delete", Number(props.id));
}
</script>

<template>
  <div class="flex bg-white w-full rounded-xl flex-col">
    <div
      class="flex justify-between p-4 text-base font-medium text-secondary"
    >
      <p>{{ name }}</p>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="w-fit h-fit cursor-pointer"
          @click="handleEdit"
        >
          <UIcon :name="ICONS.PEN_LINE" class="text-secondary-500 h-4 w-4" />
        </button>
        <button
          type="button"
          class="w-fit h-fit cursor-pointer"
          @click="handleDelete"
        >
          <UIcon :name="ICONS.TRASH_2" class="text-red-500 h-4 w-4" />
        </button>
      </div>
    </div>
    <p class="text-secondary-500 text-xs p-4">
      {{ description }}
    </p>

    <div class="flex flex-col gap-4 p-4 ">
      <div
        class="pr-1"
        :class="hasScrollablePrices ? 'max-h-[172px] overflow-y-auto' : ''"
      >
        <div
          v-for="item in prices"
          :key="item.id ?? `${item.duration}-${item.price}`"
          class="px-2 py-1 rounded-sm text-xs"
        >
          <div class="flex justify-between bg-background border border-stone-200 p-2 rounded">
            <div class="flex items-center gap-2">
              <UIcon class="text-secondary-500 h-4 w-4" :name="ICONS.CLOCK" />
              <p class="text-secondary-500 text-sm font-normal">
                {{ item.duration }} {{ item.timeUnit }}
              </p>
            </div>
            <p class="text-secondary-main text-sm font-medium">
              RS {{ item.price }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
