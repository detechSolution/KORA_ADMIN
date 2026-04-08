/** Badge color type aligned with base-badge */
export type SubscriptionStatusColor = "muted" | "emerald" | "red" | "amber" | "orange";

export type SubscriptionStatusConfig = {
  label: string;
  color: SubscriptionStatusColor;
};

/**
 * Maps subscription status to label and badge color for base-badge.
 */
export function getSubscriptionStatusConfig(status: string): SubscriptionStatusConfig {
  const raw = String(status ?? "").toUpperCase();
  switch (raw) {
    case "ACTIVE":
      return { label: "Active", color: "emerald" };
    case "INACTIVE":
      return { label: "Inactive", color: "red" };
    case "CANCELED":
      return { label: "Canceled", color: "red" };
    case "EXPIRED":
      return { label: "Expired", color: "amber" };
    case "PAST_DUE":
      return { label: "Past Due", color: "orange" };
    default:
      return { label: raw || "N/A", color: "muted" };
  }
}
