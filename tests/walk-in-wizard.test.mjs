import { Time } from "@internationalized/date";
import { compileTemplate, parse } from "@vue/compiler-sfc";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Use the existing Node runner without adding a dependency.
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { runInNewContext } from "node:vm";
import { computed, nextTick, reactive, ref, watch } from "vue";
import z from "zod";

function loadComponent(name, context, expression) {
  const source = readFileSync(new URL(`../app/components/newClient/${name}.vue`, import.meta.url), "utf8");
  const script = parse(source).descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?;\s*/gm, "");
  return runInNewContext(`${stripTypeScriptTypes(script)}\n${expression}`, {
    computed,
    nextTick,
    reactive,
    ref,
    watch,
    z,
    Time,
    ICONS: {},
    ...context,
  });
}

function loadWizard() {
  const payloads = [];
  const errors = [];
  const services = [{ id: 1, name: "Morning Class" }, { id: 2, name: "Evening Class" }];
  const wizard = loadComponent("manual-booking-new-client", {
    useBookingStore: () => ({ loading: false, createNewClientBooking: async (payload) => { payloads.push(payload); } }),
    useNotification: () => ({ success() {}, error: error => errors.push(error) }),
    findServiceItem: id => services.find(item => item.id === id),
    findServiceGroup: () => ({ type: "session" }),
    getApiErrorMessage: error => error.message,
    console,
  }, "({ form, formRef, currentStep, currentSchema, maxReachableStep, step2Ref, step3Ref, handleNext, handleBack, goToStep, handleCreateBooking });");
  let validations = 0;
  wizard.formRef.value = {
    validate: async () => {
      validations++;
      wizard.currentSchema.value.parse(wizard.form);
    },
  };
  Object.assign(wizard.form, {
    fullName: "Original Client",
    email: "original@example.test",
    serviceType: "session",
    serviceId: 1,
    date: "2026-11-12",
    time: "09:00",
  });
  return { ...wizard, payloads, errors, validationCount: () => validations };
}

test("Back twice and Next twice preserve details and validate both steps again", async () => {
  const wizard = loadWizard();
  await wizard.handleNext();
  assert.equal(wizard.currentStep.value, 1);
  await wizard.handleNext();
  assert.equal(wizard.currentStep.value, 2);
  wizard.handleBack();
  assert.equal(wizard.currentStep.value, 1);
  wizard.handleBack();
  assert.equal(wizard.currentStep.value, 0);
  assert.equal(wizard.form.email, "original@example.test");
  assert.equal(wizard.form.serviceId, 1);
  assert.equal(wizard.form.date, "2026-11-12");
  await wizard.handleNext();
  assert.equal(wizard.currentStep.value, 1);
  await wizard.handleNext();
  assert.equal(wizard.currentStep.value, 2);
  assert.equal(wizard.validationCount(), 4);
});

test("overlapping Next and Back actions cannot skip a step during validation", async () => {
  const wizard = loadWizard();
  let finish;
  wizard.formRef.value = {
    validate: () => new Promise((resolve) => { finish = resolve; }),
  };
  const first = wizard.handleNext();
  await wizard.handleNext();
  wizard.handleBack();
  wizard.goToStep(2);
  assert.equal(wizard.currentStep.value, 0);
  finish();
  await first;
  assert.equal(wizard.currentStep.value, 1);
});

test("completed steps can be clicked to return directly from Client Info to Pricing", async () => {
  const wizard = loadWizard();
  await wizard.handleNext();
  await wizard.handleNext();
  await wizard.goToStep(0);
  assert.equal(wizard.currentStep.value, 0);
  assert.equal(wizard.maxReachableStep.value, 2);
  wizard.form.fullName = "Edited Client";
  await wizard.goToStep(2);
  assert.equal(wizard.currentStep.value, 2);
  assert.equal(wizard.form.fullName, "Edited Client");
  assert.equal(wizard.form.serviceId, 1);
  await wizard.handleCreateBooking();
  assert.equal(wizard.payloads[0].fullName, "Edited Client");
});

test("editing an earlier step to be invalid disables access to later steps", async () => {
  const wizard = loadWizard();
  wizard.form.email = "invalid";
  assert.equal(wizard.maxReachableStep.value, 0);
  await wizard.goToStep(2);
  assert.equal(wizard.currentStep.value, 0);
  wizard.form.email = "valid@example.test";
  wizard.form.date = "";
  assert.equal(wizard.maxReachableStep.value, 1);
  await wizard.goToStep(2);
  assert.equal(wizard.currentStep.value, 0);
  await wizard.goToStep(1);
  assert.equal(wizard.currentStep.value, 1);
  wizard.form.date = "2026-11-13";
  assert.equal(wizard.maxReachableStep.value, 2);
  await wizard.goToStep(2);
  assert.equal(wizard.currentStep.value, 2);
});

test("shared stepper supports completed forward steps while retaining its default behavior", () => {
  const source = readFileSync(new URL("../app/components/form/stepper.vue", import.meta.url), "utf8");
  const descriptor = parse(source).descriptor;
  const script = stripTypeScriptTypes(descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?;\s*/gm, ""));
  const props = reactive({ currentStep: 0, maxStep: undefined, disabled: false });
  const canSelectStep = runInNewContext(`${script}\ncanSelectStep;`, {
    defineProps: () => props,
    withDefaults: value => value,
    defineEmits: () => () => {},
  });
  assert.equal(canSelectStep(0), true);
  assert.equal(canSelectStep(1), false);
  props.maxStep = 2;
  assert.equal(canSelectStep(1), true);
  assert.equal(canSelectStep(2), true);
  props.disabled = true;
  assert.equal(canSelectStep(0), false);
  assert.equal(canSelectStep(2), false);
  assert.equal(compileTemplate({ source: descriptor.template.content, filename: "stepper.vue", id: "stepper" }).errors.length, 0);
});

test("invalid edits block Next and final submission returns to the invalid step", async () => {
  const wizard = loadWizard();
  wizard.form.email = "invalid";
  await wizard.handleNext();
  assert.equal(wizard.currentStep.value, 0);
  wizard.currentStep.value = 2;
  await wizard.handleCreateBooking();
  assert.equal(wizard.currentStep.value, 0);
  assert.equal(wizard.payloads.length, 0);
  wizard.form.email = "valid@example.test";
  wizard.form.date = "";
  wizard.currentStep.value = 2;
  await wizard.handleCreateBooking();
  assert.equal(wizard.currentStep.value, 1);
  assert.equal(wizard.payloads.length, 0);
});

test("final booking uses edited client, service, schedule, payment and applied promo", async () => {
  const wizard = loadWizard();
  await wizard.handleNext();
  await wizard.handleNext();
  wizard.handleBack();
  wizard.handleBack();
  Object.assign(wizard.form, { fullName: "Updated Client", email: "updated@example.test", phone: "+44 7700 900123" });
  await wizard.handleNext();
  Object.assign(wizard.form, { serviceId: 2, date: "2026-11-13", time: "18:00", paymentMethod: "online" });
  await wizard.handleNext();
  wizard.form.promoCode = "SAVE";
  wizard.step3Ref.value = { appliedPromo: { isValid: true, code: "SAVE" } };
  await Promise.all([wizard.handleCreateBooking(), wizard.handleCreateBooking()]);
  assert.equal(wizard.payloads.length, 1);
  const payload = wizard.payloads[0];
  assert.equal(payload.fullName, "Updated Client");
  assert.equal(payload.email, "updated@example.test");
  assert.equal(payload.phoneNumber, "+447700900123");
  assert.equal(payload.itemType.id, 2);
  assert.equal(payload.itemType.name, "Evening Class");
  assert.equal(payload.bookingDate, "2026-11-13");
  assert.equal(payload.bookingTime, undefined);
  assert.equal(payload.paymentMethod, "online");
  assert.equal(payload.promoCode, "SAVE");
  assert.equal(wizard.errors.length, 0);
});

test("SPA duration is required and a pending availability request blocks Next", async () => {
  const wizard = loadWizard();
  wizard.currentStep.value = 1;
  Object.assign(wizard.form, { serviceType: "spa", durationId: null, time: "09:00" });
  await wizard.handleNext();
  assert.equal(wizard.currentStep.value, 1);
  wizard.form.durationId = 3;
  wizard.step2Ref.value = { loadingTimes: true };
  await wizard.handleNext();
  assert.equal(wizard.currentStep.value, 1);
});

test("changing a session refreshes its date and time and clears an old SPA duration", async () => {
  const form = ref({ serviceType: "session", serviceId: 1, date: "2026-11-12", time: "09:00", durationId: null });
  const items = [
    { id: 1, name: "Morning", sessionDate: "2026-11-12", startTime: "09:00" },
    { id: 2, name: "Evening", sessionDate: "2026-11-13", startTime: "18:00" },
  ];
  loadComponent("steps/schedule-step", {
    defineModel: () => form,
    defineExpose() {},
    useBookingStore: () => ({ bookingItemOptions: [{ type: "session", items }], fetchBookingItemOptions: async () => {} }),
  }, "undefined;");
  await nextTick();
  assert.equal(form.value.serviceId, 1);
  assert.equal(form.value.date, "2026-11-12");
  form.value.durationId = 99;
  form.value.serviceId = 2;
  await nextTick();
  assert.equal(form.value.date, "2026-11-13");
  assert.equal(form.value.time, "18:00");
  assert.equal(form.value.durationId, null);
});

test("promo state survives unchanged navigation and clears when its code changes", async () => {
  const form = ref({ serviceId: 1, serviceType: "session", promoCode: "SAVE" });
  const pricing = loadComponent("steps/pricing-step", {
    defineModel: () => form,
    defineExpose() {},
    useNotification: () => ({ success() {}, error() {} }),
    useBookingStore: () => ({
      bookingItemOptions: [{ type: "session", items: [{ id: 1, amount: 500 }] }],
      validatePromoCode: async () => ({ code: "SAVE", isValid: true, type: "percent", amount: 10 }),
    }),
  }, "({ applyPromoCode, appliedPromo, totalPrice });");
  await pricing.applyPromoCode();
  assert.equal(pricing.totalPrice.value, 450);
  form.value.fullName = "Updated Client";
  await nextTick();
  assert.equal(pricing.totalPrice.value, 450);
  form.value.promoCode = "";
  await nextTick();
  await setImmediate();
  assert.equal(pricing.appliedPromo.value, null);
  assert.equal(pricing.totalPrice.value, 500);
});

test("SPA keeps a duration-specific date and ignores availability responses for an older date", async () => {
  const form = ref({ serviceType: "spa", serviceId: 1, durationId: 3, date: "2026-11-13", time: "10:00", roomType: "private" });
  const pending = [];
  const schedule = loadComponent("steps/schedule-step", {
    defineModel: () => form,
    defineExpose() {},
    useBookingStore: () => ({
      bookingItemOptions: [{
        type: "spa",
        availableDays: ["mon"],
        items: [{ id: 1, duration: [{ id: 3, duration: 60, timeUnit: "minutes", availableDays: ["fri"] }] }],
      }],
      fetchBookingItemOptions: async () => {},
      fetchSpaTimeAvailability: () => new Promise((resolve) => { pending.push(resolve); }),
    }),
  }, "({ spaTimes, loadingTimes });");
  assert.equal(form.value.date, "2026-11-13");
  assert.equal(form.value.durationId, 3);
  form.value.date = "2026-11-20";
  await nextTick();
  assert.equal(pending.length, 2);
  pending[1]([{ label: "10 AM", time: "10:00" }]);
  await setImmediate();
  assert.equal(schedule.spaTimes.value[0].value, "10:00");
  pending[0]([{ label: "9 AM", time: "09:00" }]);
  await setImmediate();
  assert.equal(schedule.spaTimes.value[0].value, "10:00");
  assert.equal(form.value.time, "10:00");
  assert.equal(schedule.loadingTimes.value, false);
});

test("unapplied promo text is not sent as an unseen discount", async () => {
  const wizard = loadWizard();
  wizard.currentStep.value = 2;
  wizard.form.promoCode = "NOT_APPLIED";
  await wizard.handleCreateBooking();
  assert.equal(wizard.payloads.length, 1);
  assert.equal(wizard.payloads[0].promoCode, undefined);
});

test("wizard templates compile and all steps stay mounted under the shared step value", () => {
  for (const name of ["manual-booking-new-client", "steps/schedule-step", "steps/pricing-step"]) {
    const filename = `app/components/newClient/${name}.vue`;
    const source = readFileSync(filename, "utf8");
    const template = parse(source).descriptor.template.content;
    const result = compileTemplate({ source: template, filename, id: name });
    assert.equal(result.errors.length, 0);
    if (name === "manual-booking-new-client") {
      assert.match(template, /:current-step="currentStep"/);
      for (const step of [0, 1, 2]) {
        assert.ok(template.includes(`v-show="currentStep === ${step}"`));
      }
      assert.doesNotMatch(template, /<Transition/);
    }
  }
});
