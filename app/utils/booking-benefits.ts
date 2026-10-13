function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isBookingDateWithinPlan(bookingDate: unknown, startDate: unknown, endDate: unknown): boolean {
  if (!isCalendarDate(bookingDate) || !isCalendarDate(startDate) || !isCalendarDate(endDate))
    return false;

  // Compare calendar dates directly so timezone offsets cannot shift plan boundaries.
  return startDate <= bookingDate && bookingDate <= endDate;
}
