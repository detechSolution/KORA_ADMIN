/**
 * Formats a given number (or numeric string) into a locale-specific string
 * with thousands separators and a fixed number of decimal places.
 *
 * @param value - The number or numeric string to format.
 * @param locale - (Optional) The locale to use for formatting (default: 'en-US').
 * @param minFractionDigits - (Optional) Minimum fraction digits (default: 2).
 * @param maxFractionDigits - (Optional) Maximum fraction digits (default: 2).
 * @returns A formatted string. Returns an empty string if the input is not a valid number.
 */
import { Time } from "@internationalized/date";

export function formatNumber(
  value: number | string,
  locale: string = "en-US",
  minFractionDigits: number = 2,
  maxFractionDigits: number = 2,
): string {
  // Convert string input to a number if needed.
  const numericValue: number = typeof value === "string" ? Number.parseFloat(value) : value;

  // Return an empty string if conversion fails.
  if (Number.isNaN(numericValue)) {
    return "";
  }

  // Create a formatter instance with the specified options.
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });

  // Format and return the number.
  return `Rs. ${formatter.format(numericValue)}`;
}

/**
 * Builds a query string from an object of parameters
 * @param params - Object with query parameters (values can be string, number, boolean, null, or undefined)
 * @returns URL-encoded query string (e.g., "page=1&limit=10&search=test")
 */
export function buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    // Include the value if it's not undefined, null, or empty string
    // Note: boolean false and 0 are valid values and should be included
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

/**
 * Parses various date inputs to a Date object in local timezone.
 * Handles: ISO strings (with/without Z), date-only YYYY-MM-DD, Unix timestamps (seconds or ms).
 * @param date - Date as string (ISO/YYYY-MM-DD) or number (Unix timestamp)
 * @returns Date object or null if invalid
 */
function parseToLocalDate(date: string | number | null | undefined): Date | null {
  if (date === null || date === undefined || date === "")
    return null;

  if (typeof date === "number") {
    // Treat as seconds only when value has ≤10 digits (e.g. 1e9–1e10); otherwise assume ms.
    // This avoids misinterpreting ms timestamps before Sep 2001 (e.g. 946684800000) as seconds.
    const digits = String(Math.floor(Math.abs(date))).length;
    const ms = digits <= 10 ? date * 1000 : date;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const s = String(date).trim();
  if (!s)
    return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const parts = s.split("-").map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (y === undefined || m === undefined || d === undefined)
      return null;
    if (m < 1 || m > 12 || d < 1 || d > 31)
      return null;
    const parsed = new Date(y, m - 1, d);
    if (Number.isNaN(parsed.getTime()))
      return null;
    // Reject invalid calendar dates (e.g. 2024-02-30) that Date() would roll over
    if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d)
      return null;
    return parsed;
  }

  const normalized = s.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)$/, "$1T$2");
  if (normalized !== s && !/Z|[+-]\d{2}:?\d{2}$/i.test(normalized)) {
    const parsed = new Date(`${normalized}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const isoWithoutTz = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/i.exec(s);
  if (isoWithoutTz && !/Z|[+-]\d{2}:?\d{2}$/i.test(s)) {
    const parsed = new Date(`${s}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTimeValue(value: Time | undefined): string {
  if (!value)
    return "";
  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}

export function parseTimeValue(value: string): Time | undefined {
  const normalizedValue = value.trim();
  if (!normalizedValue)
    return undefined;

  const twelveHourMatch = normalizedValue.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (twelveHourMatch) {
    const [, rawHours = "0", rawMinutes = "0", meridiem = "AM"] = twelveHourMatch;
    const parsedHours = Number(rawHours);
    const minute = Number(rawMinutes);
    if (Number.isNaN(parsedHours) || Number.isNaN(minute))
      return undefined;
    return new Time((parsedHours % 12) + (meridiem.toUpperCase() === "PM" ? 12 : 0), minute);
  }

  const [hours = "0", minutes = "0"] = normalizedValue.split(":");
  const hour = Number(hours);
  const minute = Number(minutes);
  if (Number.isNaN(hour) || Number.isNaN(minute))
    return undefined;
  return new Time(hour, minute);
}

export function formatDate(date: string | number | null | undefined): string {
  const d = parseToLocalDate(date);
  if (!d)
    return "";
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return formatter.format(d);
}

export function formatDateTime(date: string | number | null | undefined): string {
  const d = parseToLocalDate(date);
  if (!d)
    return "";
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(d);
}

// helper
export function formatDateTimeWithDot(date: string) {
  if (!date)
    return "";
  const d = new Date(date);
  return `${d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} • ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
}

export function normalizeText(text: string): string {
  if (!text) return "";
  
  const result = text
    // Insert a space between lowercase and uppercase letters (camelCase)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Replace underscores and hyphens with spaces
    .replace(/[-_]+/g, " ")
    // Replace multiple consecutive spaces with a single space minimize
    .replace(/\s+/g, " ")
    .trim();

  // Convert to Title Case
  return result
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
