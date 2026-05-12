<script setup lang="ts">
import { ICONS } from "~/config/icons";

defineProps<{
  id: number;
  name: string;
  status: string;
  description: string;
  discount: string;
  price: number;
  isActive: boolean;
}>();

const emit = defineEmits(["edit"]);
</script>

<template>
  <div class="bg-card rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col transition-all hover:shadow-md">
    <!-- Header -->
    <div class="p-5 flex items-start justify-between border-b border-stone-50">
      <h3 class="text-lg font-bold text-secondary-900">
        {{ name }}
      </h3>
      <base-badge
        v-if="isActive"
        color="success"
        class="bg-emerald-50/50 border-emerald-200 text-emerald-600 px-2.5 py-0.5 rounded-lg text-xs font-semibold shadow-none"
      >
        Active
      </base-badge>
      <base-badge
        v-else
        color="muted"
        class="px-2.5 py-0.5 rounded-lg text-xs font-semibold shadow-none"
      >
        Expired
      </base-badge>
    </div>

    <!-- Content -->
    <div class="p-5 flex-1 space-y-3">
      <p class="text-sm text-secondary-500 leading-relaxed">
        {{ description }}
      </p>
      <div class="flex items-center gap-1.5">
        <span class="text-sm font-semibold text-secondary-700">Discounts:</span>
        <span class="text-sm text-secondary-500 font-medium">{{ discount }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-5 py-4 bg-stone-50/30 border-t border-stone-100 flex items-center justify-between mt-auto">
      <div class="text-base font-bold text-secondary-900">
        Rs. {{ price.toLocaleString() }}
      </div>
      <button
        type="button"
        class="p-2 rounded-lg text-secondary-400 hover:text-primary hover:bg-primary/5 transition-all"
        @click="emit('edit', id)"
      >
        <UIcon :name="ICONS.EDIT" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
