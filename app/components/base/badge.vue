<script setup lang="ts">
import { computed, useSlots } from "vue";

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
  class?: string;
  uppercase?: boolean;
  showIcon?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  color: undefined,
  status: undefined,
  class: "",
  uppercase: false,
  showIcon: false,
});

const slots = useSlots();

const STATUS_MAP: Record<string, { color: BadgeColor; label: string; icon?: string }> = {
  "paid": { color: "emerald", label: "Paid" },
  "refunded": { color: "amber", label: "Refunded" },
  "failed": { color: "red", label: "Failed" },
  "pending": { color: "amber", label: "Pending" },
  "processing": { color: "blue", label: "Processing" },
  "completed": { color: "success", label: "Completed" },
  "cancelled": { color: "red", label: "Cancelled" },
  "canceled": { color: "red", label: "Canceled" },
  "cancellation processing": { color: "amber", label: "Cancellation Processing" },
  "active": { color: "emerald", label: "Active" },
  "valid": { color: "emerald", label: "Valid" },
  "invalid": { color: "red", label: "Invalid" },
  "inactive": { color: "muted", label: "Inactive" },
  "cash": { color: "purple", label: "Cash", icon: ICONS.BANKNOTE },
  "online": { color: "blue", label: "Online", icon: ICONS.WIFI },
  "class": { color: "blue", label: "Class" },
  "event": { color: "emerald", label: "Event" },
  "workshop": { color: "purple", label: "Workshop" },
  "confirmed": { color: "emerald", label: "Confirmed", icon: ICONS.CHECK_CIRCLE },
  "requested": { color: "yellow", label: "Pending" },
  "approved": { color: "emerald", label: "Approved" },
  "rejected": { color: "red", label: "Rejected" },
  "session": { color: "purple", label: "Session" },
  "spa": { color: "blue", label: "Spa" },
  "passes": { color: "emerald", label: "Pass" },
  "member": { color: "blue", label: "Member" },
  "non_member": { color: "purple", label: "Non-Member" },
  "guest": { color: "purple", label: "Guest" },
  "monthly": { color: "blue", label: "Monthly" },
  "yearly": { color: "emerald", label: "Yearly" },
  "quarterly": { color: "orange", label: "Quarterly" },
  "expired": { color: "red", label: "Expired" },
  "frozen": { color: "blue", label: "Frozen" },
};

function formatText(text: string): string {
  return text
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getSlotText(): string | null {
  if (!slots.default)
    return null;
  const slotContent = slots.default();
  if (!slotContent || slotContent.length === 0)
    return null;

  const firstChild = slotContent[0];
  if (typeof firstChild.children === "string") {
    return firstChild.children.trim();
  }
  return null;
}

const statusConfig = computed(() => {
  if (!props.status)
    return null;
  const key = props.status.toLowerCase().replace(/_/g, " ");
  return STATUS_MAP[key] || null;
});

const badgeColor = computed(() => {
  if (props.color)
    return props.color;
  if (statusConfig.value)
    return statusConfig.value.color;
  return "primary";
});

const badgeLabel = computed(() => {
  const slotText = getSlotText();

  // If slot has content, format it
  if (slotText) {
    // Check if it's in the map
    const key = slotText.toLowerCase().replace(/_/g, " ");
    if (STATUS_MAP[key]) {
      return STATUS_MAP[key].label;
    }
    // Otherwise format it
    return formatText(slotText);
  }

  // No slot, use status prop
  if (statusConfig.value)
    return statusConfig.value.label;
  if (props.status)
    return formatText(props.status);
  return "";
});

const badgeIcon = computed(() => {
  if (!props.showIcon)
    return undefined;
  return statusConfig.value?.icon;
});

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
  <span
    class="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium shadow-sm"
    :class="[colorClasses, props.class, { uppercase }]"
  >
    <UIcon
      v-if="badgeIcon"
      :name="badgeIcon"
      class="h-3 w-3"
    />
    {{ badgeLabel }}
  </span>
</template>
