/** Badge color type aligned with base-badge */
type PaymentStatusColor = "muted" | "emerald" | "red" | "amber" | "orange";

export type PaymentStatusConfig = {
  label: string;
  color: PaymentStatusColor;
};

/**
 * Maps payment status to label and badge color for base-badge.
 */
export function getPaymentStatusConfig(status: string): PaymentStatusConfig {
  const raw = String(status ?? "").toUpperCase();
  switch (raw) {
    case "PAID":
      return { label: "Paid", color: "emerald" };
    case "FAILED":
      return { label: "Failed", color: "red" };
    case "PENDING":
      return { label: "Pending", color: "amber" };
    case "PARTIAL":
      return { label: "Partial", color: "orange" };
    default:
      return { label: raw || "N/A", color: "muted" };
  }
}
