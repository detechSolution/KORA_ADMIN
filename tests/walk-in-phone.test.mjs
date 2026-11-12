import { parse } from "@vue/compiler-sfc";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Use the existing Node runner without adding a dependency.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { computed, reactive, ref } from "vue";
import z from "zod";

function loadBooking() {
  const source = readFileSync(new URL("../app/components/newClient/manual-booking-new-client.vue", import.meta.url), "utf8");
  const script = stripTypeScriptTypes(parse(source).descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?;\s*/gm, ""));
  const payloads = [];
  const state = runInNewContext(`${script}\n({ step1Schema, form, handleCreateBooking });`, {
    computed,
    reactive,
    ref,
    z,
    useBookingStore: () => ({ createNewClientBooking: async (payload) => { payloads.push(payload); } }),
    useNotification: () => ({ success() {}, error: (error) => { assert.fail(JSON.stringify(error)); } }),
    findServiceItem: () => ({ id: 1, name: "Class" }),
    findServiceGroup: () => ({ type: "session" }),
    getApiErrorMessage: error => error.message,
    console,
  });
  return { ...state, payloads };
}

const client = { fullName: "Walk-in Client", email: "client@example.test" };

test("phone is optional and accepts Nepali and international numbers", () => {
  const { step1Schema } = loadBooking();
  for (const [phone, expected] of [
    [undefined, undefined],
    [null, undefined],
    ["", undefined],
    ["   ", undefined],
    ["9841234567", "9841234567"],
    ["+977 9841234567", "+9779841234567"],
    ["+44 7700 900123", "+447700900123"],
    ["+1 (202) 555-0123", "+12025550123"],
  ]) {
    assert.equal(step1Schema.parse({ ...client, phone }).phone, expected);
  }
});

test("invalid phone numbers and missing or invalid email stay blocked", () => {
  const { step1Schema } = loadBooking();
  for (const phone of ["123", "abcdefghij", "+0123456789", "+1234567890123456", "447700900123", "++447700900123"]) {
    assert.equal(step1Schema.safeParse({ ...client, phone }).success, false, phone);
  }
  for (const email of [undefined, "", "invalid"]) {
    assert.equal(step1Schema.safeParse({ ...client, email, phone: "" }).success, false);
  }
});

test("booking payload omits blank phones and normalizes supplied numbers", async () => {
  for (const [phone, expected] of [["", undefined], ["   ", undefined], ["9841234567", "9841234567"], ["+44 7700 900123", "+447700900123"]]) {
    const { form, handleCreateBooking, payloads } = loadBooking();
    Object.assign(form, client, { phone, serviceId: 1, date: "2026-11-12" });
    await handleCreateBooking();
    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].phoneNumber, expected);
    assert.equal(Object.hasOwn(payloads[0], "phoneNumber"), expected !== undefined);
    assert.equal(payloads[0].email, client.email);
  }
});
