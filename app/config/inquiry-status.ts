/** Badge color type aligned with base-badge */
export type InquiryStatusColor
  = | "muted"
    | "amber"
    | "orange"
    | "blue"
    | "indigo"
    | "sky"
    | "emerald"
    | "red";

/**
 * Maps inquiry status ID to badge color for base-badge.
 * Status IDs align with API: 1=New, 2=Contacting, 3=Demo Scheduled, 4=Follow-up,
 * 5=Negotiation, 6=Closed (Won), 7=Closed (Lost).
 */
export function getInquiryStatusColor(statusId: number): InquiryStatusColor {
  switch (statusId) {
    case 1:
      return "amber"; // New
    case 2:
      return "orange"; // Contacting
    case 3:
      return "blue"; // Demo Scheduled
    case 4:
      return "indigo"; // Follow-up
    case 5:
      return "sky"; // Negotiation
    case 6:
      return "emerald"; // Closed (Won)
    case 7:
      return "red"; // Closed (Lost)
    default:
      return "muted";
  }
}
