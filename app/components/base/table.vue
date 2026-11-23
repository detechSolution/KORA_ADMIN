<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TableColumn, TableRow } from "@nuxt/ui";

import { computed } from "vue";

type Props = {
  columns: TableColumn<T>[];
  data?: T[];
  loading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
};

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  skeletonRows: 10,
  emptyTitle: "No data found",
  emptyDescription: "There's currently nothing available to display.",
});

const slots = defineSlots<{
  [name: `${string}-cell`]: (props: { row: TableRow<T> }) => unknown;
  "empty"?: () => unknown;
  "empty-state"?: () => unknown;
}>();

const cellSlots = computed(() => Object.keys(slots).filter((name): name is `${string}-cell` => name.endsWith("-cell")));

const skeletonColumnCount = computed(() => {
  const columnCount = props.columns?.length ?? 0;
  return Math.max(columnCount, 3);
});

const skeletonRowCount = computed(() => props.loading ? props.skeletonRows : 0);
const showSkeleton = computed(() => props.loading);
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="showSkeleton"
      class="overflow-auto rounded-lg border border-border bg-card shadow-sm"
    >
      <table class="min-w-full w-full border-separate border-spacing-0 table-auto">
        <thead>
          <tr class="bg-stone-50">
            <th
              v-for="colIndex in skeletonColumnCount"
              :key="`table-skeleton-header-${colIndex}`"
              class="h-[48px]"
            />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="rowIndex in skeletonRowCount"
            :key="`table-skeleton-row-${rowIndex}`"
          >
            <td
              v-for="colIndex in skeletonColumnCount"
              :key="`table-skeleton-cell-${rowIndex}-${colIndex}`"
              class="border-b border-border p-4 align-middle h-[65px]"
            >
              <USkeleton class="h-5 w-[80%] min-w-[100px]" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UTable
      v-else
      v-bind="$attrs"
      :columns="props.columns"
      :data="props.data"
      :loading="props.loading"
      :ui="{
        th: 'bg-stone-50',
      }"
    >
      <template v-for="name in cellSlots" #[name]="slotData">
        <slot :name="name" :row="slotData.row" />
      </template>
      <template v-if="!$slots.empty" #empty>
        <slot name="empty-state">
          <base-empty
            :title="emptyTitle"
            :description="emptyDescription"
          />
        </slot>
      </template>
    </UTable>
  </div>
</template>
