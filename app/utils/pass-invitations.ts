import { today } from "@internationalized/date";
import * as z from "zod";

export function invitationToday() {
  return today("Asia/Kathmandu").toString();
}

export const invitationSchema = z
  .object({
    fromDate: z.iso.date("Select a valid start date"),
    guests: z
      .array(
        z.object({
          fullName: z.string().trim().min(1, "Enter the guest's name").max(120),
          email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Enter a valid email address")
            .max(160),
        }),
      )
      .min(1, "Add at least one guest"),
  })
  .refine(value => value.fromDate >= invitationToday(), {
    path: ["fromDate"],
    message: "Start date cannot be in the past",
  })
  .refine(
    value =>
      new Set(value.guests.map(guest => guest.email)).size
        === value.guests.length,
    {
      path: ["guests"],
      message: "Each guest must have a different email address",
    },
  );

export const invitationResultSchema = z.object({
  granted: z.array(
    z.object({
      email: z.string(),
      userId: z.number(),
      userPassId: z.number(),
      sentEmail: z.boolean(),
    }),
  ),
  skipped: z.array(z.object({ email: z.string(), reason: z.string() })),
});

export function inviteeStatus(
  status: string,
  startsOn: string,
  endsOn: string,
) {
  if (status !== "active")
    return status === "cancelled" ? "Cancelled" : "Expired";
  const date = invitationToday();
  if (endsOn < date)
    return "Expired";
  return startsOn > date ? "Upcoming" : "Active";
}
