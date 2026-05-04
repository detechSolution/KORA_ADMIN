import { ICONS } from "~/config/icons";

export type BadgeColor
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
    ;

type StatusConfig = {
  label: string;
  badgeColor: BadgeColor;
  className: string;
  icon?: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  paid: {
    label: "Paid",
    badgeColor: "emerald",
    className: "bg-green-100 text-green-800",
  },
  refunded: {
    label: "Refunded",
    badgeColor: "amber",
    className: "bg-yellow-100 text-yellow-800",
  },
  failed: {
    label: "Failed",
    badgeColor: "red",
    className: "bg-red-100 text-red-800",
  },
  pending: {
    label: "Pending",
    badgeColor: "amber",
    className: "bg-amber-100 text-amber-800",
  },
  partial: {
    label: "Partial",
    badgeColor: "orange",
    className: "bg-orange-100 text-orange-800",
  },
  processing: {
    label: "Processing",
    badgeColor: "blue",
    className: "bg-blue-100 text-blue-800",
  },
  completed: {
    label: "Completed",
    badgeColor: "success",
    className: "bg-emerald-100 text-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    badgeColor: "muted",
    className: "bg-gray-100 text-gray-800",
  },
  canceled: {
    label: "Canceled",
    badgeColor: "muted",
    className: "bg-gray-100 text-gray-800",
  },
  active: {
    label: "Active",
    badgeColor: "emerald",
    className: "bg-emerald-100 text-emerald-800",
  },
  inactive: {
    label: "Inactive",
    badgeColor: "muted",
    className: "bg-gray-100 text-gray-800",
  },
  cash: {
    label: "Cash",
    icon: ICONS.BANKNOTE,
    badgeColor: "purple",
    className: "bg-purple-100 text-purple-800",
  },
  online: {
    label: "Online",
    icon: ICONS.WIFI,
    badgeColor: "blue",
    className: "bg-blue-100 text-blue-800",
  },
};

function normalizeStatus(status: string | null | undefined): string {
  return String(status ?? "").trim().toLowerCase();
}

function getStatusConfig(status: string | null | undefined): StatusConfig {
  const normalizedStatus = normalizeStatus(status);

  return STATUS_CONFIG[normalizedStatus] ?? {
    label: normalizedStatus ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1) : "Unknown",
    badgeColor: "muted",
    className: "bg-gray-100 text-gray-800",
  };
}

export function getStatusMeta(status: string | null | undefined) {
  return getStatusConfig(status);
}

export function getColorsForStatus(status: string): string {
  return getStatusConfig(status).className;
}

export function getStatusColor(status: string | null | undefined): BadgeColor {
  return getStatusConfig(status).badgeColor;
}

export function getStatusLabel(status: string | null | undefined): string {
  return getStatusConfig(status).label;
}
