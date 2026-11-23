import type { Booking, BookingDetails, BookingDisplayItem } from "../types/booking";

export function availableBookingTickets(item: { availability?: unknown } | null | undefined): number {
  const available = Number(item?.availability ?? 0);
  return Number.isFinite(available) ? Math.max(0, Math.floor(available)) : 0;
}

export function bookingDetailItems(booking: BookingDetails | null): BookingDisplayItem[] {
  if (!booking)
    return [];
  if (booking.lines?.length) {
    return booking.lines.map(line => ({
      id: line.id,
      title: line.title,
      itemType: line.lineType,
      quantity: line.quantity,
      quantityCancelled: line.quantityCancelled,
      remainingQuantity: line.remainingQuantity,
      scheduledAt: line.startsAt,
      status: line.status,
      unitAmount: line.unitRate,
      totalAmount: line.lineTotal,
      currency: booking.currency ?? "NPR",
    }));
  }
  return [];
}

export function bookingScheduleLabels(booking: Pick<Booking, "lines">): string[] {
  const dates = booking.lines.map(line => line.startsAt);
  return dates.map((value) => {
    const date = value == null ? null : new Date(value);
    if (!date || Number.isNaN(date.getTime()))
      return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  });
}

export function bookingServiceLabels(booking: Pick<Booking, "lines">): string[] {
  return booking.lines.map((line) => {
    const cancelled = line.quantityCancelled > 0
      ? ` (${line.quantityCancelled} cancelled)`
      : "";
    return `${line.title} × ${line.quantity}${cancelled}`;
  });
}

export function bookingTypeLabels(booking: Pick<Booking, "lines">): string[] {
  const labels = new Set(booking.lines.map((line) => {
    if (line.lineType === "pass")
      return "Pass";
    if (line.lineType === "spa")
      return "Spa";

    switch (line.sessionType?.toLowerCase()) {
      case "class": return "Class";
      case "event": return "Event";
      case "workshop": return "Workshop";
      case "spa": return "Spa";
      default: return "Session";
    }
  }));
  return [...labels];
}

export function bookingCreatedDateLabel(booking: Pick<Booking, "bookedDate">): string {
  const date = new Date(booking.bookedDate);
  if (Number.isNaN(date.getTime()))
    return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
