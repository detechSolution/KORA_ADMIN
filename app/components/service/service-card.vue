<script setup lang="ts">
import { computed } from "vue";

import { ICONS } from "~/config/icons";
import { PERMISSIONS_SPA } from "~/config/permissions";

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

const { can } = usePermission();
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
    <div class="p-4 flex flex-col gap-2">
      <div
        class="flex justify-between text-base font-medium text-secondary"
      >
        <p>{{ name }}</p>
        <div class="flex items-center gap-3">
          <button
            v-if="can(PERMISSIONS_SPA.UPDATE)"
            type="button"
            class="w-fit h-fit cursor-pointer"
            @click="handleEdit"
          >
            <UIcon :name="ICONS.PEN_LINE" class="text-secondary-500 h-4 w-4" />
          </button>
          <button
            v-if="can(PERMISSIONS_SPA.DELETE)"
            type="button"
            class="w-fit h-fit cursor-pointer"
            @click="handleDelete"
          >
            <UIcon :name="ICONS.TRASH_2" class="text-red-500 h-4 w-4" />
          </button>
        </div>
      </div>

      <p class="text-secondary-500 text-sm leading-5 line-clamp-2">
        {{ description }}
      </p>
    </div>
    <div class="border-b border-stone-200" />

    <div class="flex flex-col gap-4 p-4">
      <div
        class="pr-1"
        :class="hasScrollablePrices ? 'max-h-43 overflow-y-auto' : ''"
      >
        <div
          v-for="item in prices"
          :key="item.id ?? `${item.duration}-${item.price}`"
          class="py-1 rounded-sm text-xs"
        >
          <div class="flex justify-between border border-stone-200 bg-[#F9F6F2] px-3 py-2 rounded-md">
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
