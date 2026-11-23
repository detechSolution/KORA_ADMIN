import assert from "node:assert/strict";
// eslint-disable-next-line test/no-import-node-test -- Follow the existing Node test runner.
import { test } from "node:test";

import { availableBookingTickets, bookingDetailItems, bookingScheduleLabels, bookingServiceLabels } from "../app/utils/booking-lines.ts";

test("legacy responses preserve their service labels", () => {
  assert.deepEqual(bookingServiceLabels({ itemNames: ["Workshop", "Spa"] }), ["Workshop", "Spa"]);
  assert.deepEqual(bookingServiceLabels({ itemNames: [], lines: [] }), []);
});

test("availability uses the backend number including holds", () => {
  assert.equal(availableBookingTickets({ availability: 2 }), 2);
  assert.equal(availableBookingTickets({ availability: 0 }), 0);
  assert.equal(availableBookingTickets(undefined), 0);
});

test("each service schedule is formatted in Nepal time, including date rollover", () => {
  assert.deepEqual(bookingScheduleLabels({ bookedFor: "2026-12-01T20:15:00Z" }), ["Dec 2, 2026, 2:00 AM"]);
  assert.deepEqual(bookingScheduleLabels({ bookedFor: "invalid" }), ["N/A"]);
  assert.deepEqual(bookingDetailItems(null), []);
});

test("line responses display original and cancelled quantities without extra detail requests", () => {
  assert.deepEqual(bookingServiceLabels({
    itemNames: ["Old truncated title"],
    lines: [{
      id: 1,
      lineType: "session",
      referenceId: 173,
      title: "Workshop",
      startsAt: null,
      endsAt: null,
      roomType: null,
      quantity: 3,
      quantityCancelled: 2,
      remainingQuantity: 1,
      status: "partly_cancelled",
      unitRate: 500,
      discountAmount: 0,
      lineTotal: 1500,
    }],
  }), ["Workshop × 3 (2 cancelled)"]);
});
