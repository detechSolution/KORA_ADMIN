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

type TooltipValues = {
  datum: RevenueDataItem;
  stackIndex: number;
  index: number;
};

const RevenueData = computed<RevenueDataItem[]>(() => props.data?.series ?? []);

const { revenueCategories: RevenueCategoriesMultple } = useChartColors();

const tooltipKeys = ["classes", "workshops", "events"] as const;

function tooltipDatum(raw: unknown): RevenueDataItem {
  return (raw as TooltipValues).datum;
}

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
    >
      <template #tooltip="{ values: rawValues }">
        <div
          v-if="rawValues"
        >
          <p class="mb-2 pb-1.5 text-xs font-semibold text-foreground">
            {{ tooltipDatum(rawValues).label }}
          </p>
          <div class="space-y-1.5">
            <div
              v-for="key in tooltipKeys"
              :key="key"
              class="flex items-center justify-between gap-6"
            >
              <div class="flex items-center gap-2">
                <span
                  class="inline-block size-2.5 shrink-0 rounded-sm"
                  :style="{ backgroundColor: RevenueCategoriesMultple[key].color }"
                />
                <span class="text-xs text-muted-foreground">{{ RevenueCategoriesMultple[key].name }}</span>
              </div>
              <span class="text-xs font-semibold tabular-nums">{{ tooltipDatum(rawValues)[key] ?? 0 }}</span>
            </div>
          </div>
          <div class="mt-2 flex items-center justify-between border-t border-border pt-1.5">
            <span class="text-xs font-medium text-muted-foreground">Total</span>
            <span class="text-xs font-bold tabular-nums">{{ tooltipDatum(rawValues).total ?? 0 }}</span>
          </div>
        </div>
      </template>
    </BarChart>
    <div v-else class="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
      No data available
    </div>
  </div>
</template>
