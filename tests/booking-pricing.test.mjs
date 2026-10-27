import { parse } from "@vue/compiler-sfc";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Use the existing Node runner without adding a dependency.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { computed, ref } from "vue";

import { isBookingDateWithinPlan } from "../app/utils/booking-benefits.ts";

function loadPricing(component, serviceType = "spa", options = {}) {
  const item = { id: 1, name: "Spa", amount: 450, duration: [{ id: 2, amount: 450 }], sessionType: "event" };
  const group = { type: serviceType, items: [item] };
  const form = ref({
    serviceId: 1,
    serviceType,
    durationId: 2,
    roomType: "shared",
    resolvedPrice: 450,
    selectedMemberId: 3,
    date: "2026-10-14",
  });
  const source = readFileSync(new URL(`../app/components/${component}`, import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const script = stripTypeScriptTypes(descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?;\s*/gm, ""));
  let pricing;
  runInNewContext(script, {
    computed,
    ref,
    defineModel: () => form,
    defineExpose: (value) => { pricing = value; },
    findServiceItem: () => item,
    findServiceGroup: () => group,
    useBookingStore: () => ({ bookingItemOptions: [group] }),
    useMembershipStore: () => ({
      membershipOptions: [{
        memberId: 3,
        membershipBenefits: { spa: 18 },
        startDate: "2026-09-18",
        endDate: "2026-10-17",
        ...options.member,
      }],
    }),
    useNotification: () => ({}),
    isBookingDateWithinPlan,
    ICONS: {},
    SESSION_TYPE: { EVENT: "event", WORKSHOP: "workshop" },
  });
  return { form, pricing, item };
}

for (const plan of ["membership", "pass", "invitation pass"]) {
  test(`${plan} pricing uses each session's configured discount`, () => {
    const benefits = { class: 45, event: 10, workshop: 25 };
    const member = plan === "membership"
      ? { membershipBenefits: benefits }
      : { passId: 7, passBenefits: benefits, membershipBenefits: { class: 90, event: 90, workshop: 90 }, isInvitation: plan === "invitation pass" };
    const { form, pricing, item } = loadPricing("bookings/existing-member-overview.vue", "session", { member });
    form.value.resolvedItemType = "session";
    form.value.resolvedPrice = 240;

    for (const [sessionType, percent] of Object.entries(benefits)) {
      item.sessionType = sessionType;
      // Match selecting a different offering so the computed rows recalculate.
      form.value.serviceId += 1;
      assert.equal(pricing.benefitDiscount.value, Math.round(240 * percent / 100));
      assert.equal(pricing.totalAmount.value, 240 - Math.round(240 * percent / 100));
    }

    item.sessionType = "event";
    benefits.event = 0;
    form.value.serviceId += 1;
    assert.equal(pricing.benefitDiscount.value, 0);
    delete benefits.event;
    form.value.serviceId += 1;
    assert.equal(pricing.benefitDiscount.value, 0);
  });
}

test("shared spa pricing doubles the member subtotal and benefit discount", () => {
  const { form, pricing } = loadPricing("bookings/existing-member-overview.vue");
  assert.equal(pricing.subTotal.value, 900);
  assert.equal(pricing.benefitDiscount.value, 162);
  assert.equal(pricing.totalAmount.value, 738);

  form.value.roomType = "private";
  assert.equal(pricing.subTotal.value, 450);
  assert.equal(pricing.benefitDiscount.value, 81);
  assert.equal(pricing.totalAmount.value, 369);
});

test("member pricing doubles duration prices when the resolved price is missing", () => {
  const { form, pricing } = loadPricing("bookings/existing-member-overview.vue");
  form.value.resolvedPrice = undefined;
  assert.equal(pricing.subTotal.value, 900);
});

test("shared spa outside the plan dates has full two-person pricing", () => {
  const { form, pricing } = loadPricing("bookings/existing-member-overview.vue");
  form.value.date = "2026-10-18";
  assert.equal(pricing.subTotal.value, 900);
  assert.equal(pricing.benefitDiscount.value, 0);
  assert.equal(pricing.totalAmount.value, 900);
});

test("member promo discounts use the shared price after membership benefits", () => {
  const { pricing } = loadPricing("bookings/existing-member-overview.vue");
  pricing.appliedPromo.value = { isValid: true, type: "percent", amount: 10 };
  assert.equal(pricing.promoDiscount.value, 74);
  assert.equal(pricing.totalAmount.value, 664);
});

test("event quantities remain independent of the spa room type", () => {
  const { form, pricing } = loadPricing("bookings/existing-member-overview.vue", "session");
  form.value.sessionQuantity = 3;
  assert.equal(pricing.subTotal.value, 1350);
});

test("new-client shared pricing and promo totals recalculate when changing rooms", () => {
  const { form, pricing } = loadPricing("newClient/steps/pricing-step.vue");
  assert.equal(pricing.totalPrice.value, 900);
  pricing.appliedPromo.value = { isValid: true, type: "percent", amount: 10 };
  assert.equal(pricing.getPromoDiscount(), 90);
  assert.equal(pricing.totalPrice.value, 810);

  form.value.roomType = "private";
  assert.equal(pricing.totalPrice.value, 405);
});

test("new-client non-spa prices are not doubled by a stale shared room selection", () => {
  const { pricing } = loadPricing("newClient/steps/pricing-step.vue", "session");
  assert.equal(pricing.totalPrice.value, 450);
});
