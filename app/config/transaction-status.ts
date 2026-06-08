/** Badge color type aligned with base-badge */
type TransactionStatusColor = "muted" | "amber" | "emerald" | "red";

export type TransactionStatusConfig = {
  label: string;
  color: TransactionStatusColor;
};

/**
 * Maps transaction status to label and badge color for base-badge.
 * Issued = amber, Paid (closed won) = green, Cancelled (closed lost) = red.
 */
export function getTransactionStatusConfig(status: string): TransactionStatusConfig {
  const raw = String(status ?? "").toUpperCase();
  switch (raw) {
    case "ISSUED":
      return { label: "Issued", color: "amber" };
    case "PAID":
      return { label: "Paid", color: "emerald" };
    case "CANCELLED":
      return { label: "Cancelled", color: "red" };
    default:
      return { label: raw || "N/A", color: "muted" };
  }
}
