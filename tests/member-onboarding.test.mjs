import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Follow the existing Node test runner.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import z from "zod";

const source = readFileSync(new URL("../app/pages/members/create-member.vue", import.meta.url), "utf8");
const schemaScript = source.slice(source.indexOf("const stepOneSchema"), source.indexOf("const stepTwoSchema"));
const schema = runInNewContext(`${schemaScript}\nstepOneSchema;`, { z });

test("step one accepts an empty phone and rejects invalid entered numbers next to that field", () => {
  const details = { fullName: "Member", email: "member@example.com", identificationDocument: new File(["image"], "id.png", { type: "image/png" }) };
  for (const phoneNumber of [undefined, "", "   ", "9800000000", "+977-9800000000"]) {
    assert.equal(schema.safeParse({ ...details, phoneNumber }).success, true);
  }
  const result = schema.safeParse({ ...details, phoneNumber: "invalid" });
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "phoneNumber");
});

test("creating a member omits an empty phone and reports member creation", async () => {
  const functionSource = source.match(/async function handleCreatePlan\(\)[\s\S]*?\n\}/)[0];
  let submitted;
  let notification;
  const create = runInNewContext(`${stripTypeScriptTypes(functionSource)}\nhandleCreatePlan;`, {
    formRef: { value: { validate: async () => {} } },
    loading: { value: false },
    clearApiError() {},
    FormData,
    state: { fullName: "Member", phoneNumber: "", email: "member@example.com", membershipPlanOptionId: 1, subscriptionStartDate: "2026-11-19", identificationDocument: new File(["id"], "id.png"), paymentMethod: "cash" },
    appliedPromo: { value: null },
    membershipStore: { createMember: async (data) => { submitted = data; } },
    success: (value) => { notification = value.message; },
    router: { push() {} },
    showError: error => assert.fail(JSON.stringify(error)),
    getApiErrorMessage: error => error.message,
  });
  await create();
  assert.equal(submitted.has("phoneNumber"), false);
  assert.equal(notification, "Member created successfully");
});
