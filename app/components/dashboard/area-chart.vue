<script lang="ts" setup>
import { computed } from "vue";

defineOptions({
  tags: ["areacharts", "basic"],
});

const props = defineProps<{
  data: any;
}>();

type AreaChartItem = {
  label: string;
  amount: number;
  date: string;
};

const categories = {
  amount: { name: "Revenue", color: "#966F33" },
};

const AreaChartData = computed<AreaChartItem[]>(() => props.data?.series ?? []);

function xFormatter(tick: number, _i?: number, _ticks?: number[]): string {
  if (typeof tick === "number" && AreaChartData.value[tick]?.label) {
    return AreaChartData.value[tick].label;
  }
  return String(tick);
}
</script>

<template>
  <div
    class="w-full py-6 px-3 space-y-6 rounded-lg"
  >
    <AreaChart
      :data="AreaChartData"
      :categories="categories"
      :y-num-ticks="3"
      :x-num-ticks="7"
      :y-grid-line="true"
      :hide-legend="true"
      :marker-config="{
        amount: {
          type: 'circle',
          size: 6,
          strokeWidth: 2,
          color: '#966F33',
        },
      }"
      :x-formatter="xFormatter"
    />
  </div>
</template>

<style scoped>
.markers:deep(*[stroke="#966F33"]) {
  marker: url("#circle-marker-amount");
}
</style>
