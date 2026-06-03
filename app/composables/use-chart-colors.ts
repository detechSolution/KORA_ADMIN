import { computed } from "vue";

function getCssColor(varName: string): string {
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return ctx.fillStyle;
  }
  return "#6b7280";
}

export function useChartColors() {
  const revenueCategories = computed(() => ({
    classes: { name: "Classes", color: getCssColor("--color-primary") },
    workshops: { name: "Workshops", color: getCssColor("--color-primary-600") },
    events: { name: "Events", color: getCssColor("--color-primary-300") },
  }));

  return { revenueCategories };
}
