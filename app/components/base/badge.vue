<script setup lang="ts">
import { computed } from "vue";

import { ICONS } from "~/config/icons";

type BadgeColor
  = | "primary"
    | "emerald"
    | "red"
    | "amber"
    | "orange"
    | "blue"
    | "indigo"
    | "sky"
    | "muted"
    | "success"
    | "purple"
    | "yellow";

type Props = {
  color?: BadgeColor;
  status?: string;
  label?: string;
  class?: string;
};

const props = withDefaults(defineProps<Props>(), {
  color: undefined,
  status: undefined,
  label: undefined,
  class: "",
});

// All status configs in one place
const STATUS_MAP: Record<string, { color: BadgeColor; label: string; icon?: string }> = {
  paid: { color: "emerald", label: "Paid" },
  refunded: { color: "amber", label: "Refunded" },
  failed: { color: "red", label: "Failed" },
  pending: { color: "amber", label: "Pending" },
  processing: { color: "blue", label: "Processing" },
  completed: { color: "success", label: "Completed" },
  cancelled: { color: "red", label: "Cancelled" },
  canceled: { color: "red", label: "Canceled" },
  active: { color: "emerald", label: "Active" },
  inactive: { color: "muted", label: "Inactive" },
  cash: { color: "purple", label: "Cash", icon: ICONS.BANKNOTE },
  online: { color: "blue", label: "Online", icon: ICONS.WIFI },
  class: { color: "blue", label: "Class" },
  event: { color: "emerald", label: "Event" },
  workshop: { color: "purple", label: "Workshop" },
  confirmed: { color: "emerald", label: "Confirmed" },
  requested: { color: "yellow", label: "Requested" },
  approved: { color: "emerald", label: "Approved" },
  rejected: { color: "red", label: "Rejected" },
  session: { color: "purple", label: "Session" },
  spa: { color: "blue", label: "Spa" },
  pass: { color: "emerald", label: "Pass" },
  member: { color: "blue", label: "Member" },
  guest: { color: "purple", label: "Guest" },
  monthly: { color: "blue", label: "Monthly" },
  yearly: { color: "emerald", label: "Yearly" },
  quarterly: { color: "orange", label: "Quarterly" },
  approved: { color: "emerald", label: "Approved" },
  rejected: { color: "red", label: "Rejected" },
  requested: { color: "yellow", label: "Requested" },
};

const statusConfig = computed(() => {
  if (!props.status)
    return null;
  const normalized = props.status.toLowerCase().replace(/_/g, " ");
  return STATUS_MAP[normalized];
});

const badgeColor = computed(() => props.color ?? statusConfig.value?.color ?? "primary");
const badgeLabel = computed(() => props.label ?? statusConfig.value?.label ?? "");
const badgeIcon = computed(() => statusConfig.value?.icon);

const colorClasses = computed(() => {
  const colors: Record<BadgeColor, string> = {
    primary: "bg-primary/10 text-primary border-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500",
    red: "bg-red-500/10 text-red-500 border-red-500",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500",
    indigo: "bg-indigo-500/10 text-indigo-600 border-indigo-500",
    sky: "bg-sky-500/10 text-sky-600 border-sky-500",
    muted: "bg-muted text-muted-foreground border-border",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500",
    yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-500",
  };
  return colors[badgeColor.value];
});
</script>

<template>
  <span class="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium shadow-sm capitalize" :class="[colorClasses, props.class]">
    <UIcon
      v-if="badgeIcon"
      :name="badgeIcon"
      class="h-3 w-3"
    />
    <slot>{{ badgeLabel }}</slot>
  </span>
</template>
