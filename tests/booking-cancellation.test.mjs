import { parse } from "@vue/compiler-sfc";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Follow the existing Node test runner.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { computed, ref, watch } from "vue";

test("quantity cancellation accepts only remaining whole tickets", () => {
  const source = readFileSync(new URL("../app/components/bookings/cancel-modal.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const script = stripTypeScriptTypes(descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?;\s*/gm, ""));
  const context = {
    computed,
    ref,
    watch,
    defineProps: () => ({ open: true, maxQuantity: 3 }),
    withDefaults: (props, defaults) => ({ ...defaults, ...props }),
    defineEmits: () => () => {},
  };
  runInNewContext(`${script}\nglobalThis.controls = { quantity, validQuantity };`, context);
  for (const quantity of [0, -1, 1.5, 4, Number.NaN]) {
    context.controls.quantity.value = quantity;
    assert.equal(context.controls.validQuantity.value, false);
  }
  for (const quantity of [1, 2, 3]) {
    context.controls.quantity.value = quantity;
    assert.equal(context.controls.validQuantity.value, true);
  }
});

test("admin cancellation calls only the booking-line endpoint", () => {
  const source = readFileSync(new URL("../app/components/bookings/detail-modal.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const script = descriptor.scriptSetup.content;
  const handler = script.match(/async function handleCancelBooking\(quantity: number\) \{[\s\S]*?\n\}/)?.[0];

  assert.ok(handler);
  assert.match(handler, /if \(!selectedItem\.value\?\.isLine\)/);
  assert.match(handler, /bookingStore\.cancelBookingLine\(/);
  assert.doesNotMatch(handler, /requestBookingCancellation|requestItemCancellation/);
  assert.match(source, /!item\.isLine \|\| item\.remainingQuantity < 1/);
});
