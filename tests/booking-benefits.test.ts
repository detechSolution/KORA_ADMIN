import assert from "node:assert/strict";
// eslint-disable-next-line test/no-import-node-test -- Use Node's runner without adding a test dependency.
import { test } from "node:test";

import { isBookingDateWithinPlan } from "../app/utils/booking-benefits.ts";

const startDate = "2026-09-18";
const endDate = "2026-10-17";

test("membership benefits include the plan start and end dates", () => {
  for (const bookingDate of [startDate, "2026-10-14", endDate])
    assert.equal(isBookingDateWithinPlan(bookingDate, startDate, endDate), true);
});

test("membership benefits exclude bookings before or after the plan", () => {
  for (const bookingDate of ["2026-09-17", "2026-10-18"])
    assert.equal(isBookingDateWithinPlan(bookingDate, startDate, endDate), false);
});

test("missing or invalid booking and plan dates do not qualify for benefits", () => {
  for (const invalidDate of [undefined, null, "", 20261014, "2026-02-30", "2026-13-01", "2026-10-14T00:00:00Z"]) {
    assert.equal(isBookingDateWithinPlan(invalidDate, startDate, endDate), false);
    assert.equal(isBookingDateWithinPlan("2026-10-14", invalidDate, endDate), false);
    assert.equal(isBookingDateWithinPlan("2026-10-14", startDate, invalidDate), false);
  }
});

test("a plan with its end before its start does not qualify for benefits", () => {
  assert.equal(isBookingDateWithinPlan("2026-10-14", endDate, startDate), false);
});

test("calendar date validation accepts leap days only in leap years", () => {
  assert.equal(isBookingDateWithinPlan("2028-02-29", "2028-02-01", "2028-03-01"), true);
  assert.equal(isBookingDateWithinPlan("2026-02-29", "2026-02-01", "2026-03-01"), false);
});
