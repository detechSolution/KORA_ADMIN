<script lang="ts" setup>
import { computed } from "vue";

import { useChartColors } from "~/composables/use-chart-colors";

defineOptions({
  tags: ["barcharts", "stacked"],
});

const props = defineProps<{
  data: any;
}>();

type RevenueDataItem = {
  label: string;
  classes: number;
  workshops: number;
  events: number;
  total: number;
};

const RevenueData = computed<RevenueDataItem[]>(() => props.data?.series ?? []);

const { revenueCategories: RevenueCategoriesMultple } = useChartColors();

const xFormatter = (i: number): string => `${RevenueData.value[i]?.label ?? ""}`;

function yFormatter(tick: number, _i?: number, _ticks?: number[]) {
  return Math.round(tick).toString();
}
</script>

<template>
  <div class="w-full py-6 px-3">
    <BarChart
      v-if="RevenueData.length"
      :data="RevenueData"
      :stacked="true"
      :height="300"
      :categories="RevenueCategoriesMultple"
      :y-axis="['classes', 'workshops', 'events']"
      :group-padding="0"
      :bar-padding="0.2"
      :x-num-ticks="7"
      :radius="4"
      :x-formatter="xFormatter"
      :y-formatter="yFormatter"
      :hide-legend="true"
      :y-grid-line="true"
    />
    <div v-else class="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
      No data available
    </div>

    <!-- Custom footer with legend and total -->
  </div>
</template>
