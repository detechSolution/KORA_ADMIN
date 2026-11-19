import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// eslint-disable-next-line test/no-import-node-test -- Follow the existing Node test runner.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import z from "zod";

for (const path of ["pages/administration/create-admin.vue", "components/admin/edit-admin.vue"]) {
  const source = readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");
  const script = source.match(/const schema = z\.object\(\{[\s\S]*?\n\}\);/)[0];
  const schema = runInNewContext(`${script}\nschema;`, { z });

  test(`${path} allows a blank phone while validating entered numbers`, () => {
    const details = { fullName: "Admin", email: "admin@example.com", adminRoleId: "1", isActive: true };
    for (const phoneNumber of ["", "   ", "9800000000", "+977-9800000000"]) {
      assert.equal(schema.safeParse({ ...details, phoneNumber }).success, true);
    }
    for (const phoneNumber of ["invalid", "123", "9800000000!"]) {
      const result = schema.safeParse({ ...details, phoneNumber });
      assert.equal(result.success, false);
      assert.equal(result.error.issues[0].path[0], "phoneNumber");
    }
    assert.match(source, /label="Phone Number \(Optional\)"/);
  });
}
