<script setup lang="ts">
import { computed } from "vue";

type Props = {
  columns: Array<Record<string, unknown>>;
  data?: Array<Record<string, unknown>>;
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
  emptyDescription: "It looks like you haven't added any data. Create one to get started.",
});

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
          <tr class="bg-muted">
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
    >
      <template #empty>
        <slot name="empty-state">
          <div class="py-8 text-center text-sm text-muted-foreground">
            <UEmpty
              icon="i-lucide-file"
              :title="emptyTitle"
              :description="emptyDescription"
              class="ring-0 bg-transparent"
            />
          </div>
        </slot>
      </template>
      <slot />
    </UTable>
  </div>
</template>
