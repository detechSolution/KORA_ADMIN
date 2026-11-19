import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Follow the existing Node test runner.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { computed, ref } from "vue";

const source = readFileSync(new URL("../app/components/members/manage-freezes.vue", import.meta.url), "utf8");

function setup(allowed, post) {
  const notices = [];
  const script = source.split("<script setup lang=\"ts\">")[1].split("</script>")[0].replace(/^import .*;\r?\n/gm, "");
  return runInNewContext(`${stripTypeScriptTypes(script)}\n({ processFreeze, busy, notices });`, {
    computed,
    ref,
    notices,
    defineProps: () => ({ member: null }),
    defineEmits: () => event => notices.push(event),
    usePermission: () => ({ can: () => allowed }),
    useNotification: () => ({ success: () => notices.push("success"), error: () => notices.push("error") }),
    getHttp: () => ({ post }),
    getApiErrorMessage: error => error.message,
  });
}

test("staff without update permission cannot submit a freeze change", async () => {
  const state = setup(false, () => assert.fail("Request must not be sent"));
  await state.processFreeze(2, "end");
  assert.equal(state.notices.length, 0);
  assert.match(source, /v-if="can\('members.update'\) && freezes.length"/);
});

test("staff action refreshes member details after a successful request", async () => {
  const state = setup(true, async (url, body) => {
    assert.equal(url, "/api/v1/members/membership-freezes/2/process");
    assert.equal(body.action, "cancel");
  });
  await state.processFreeze(2, "cancel");
  assert.equal(state.notices.join(","), "success,updated");
  assert.equal(state.busy.value, false);
});

test("a failed update keeps the member details open and shows an error", async () => {
  const state = setup(true, async () => {
    throw new Error("Unable to update");
  });
  await state.processFreeze(2, "end");
  assert.equal(state.notices.join(","), "error");
  assert.equal(state.busy.value, false);
});
