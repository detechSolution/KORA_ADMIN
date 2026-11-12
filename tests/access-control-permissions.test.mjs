import { parse } from "@vue/compiler-sfc";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Use the existing Node runner without adding a dependency.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { computed, ref, watch } from "vue";

import * as permissions from "../app/config/permissions.ts";

function loadComponent(path, context, expression) {
  const source = readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");
  const script = parse(source).descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?;\s*/gm, "");
  return runInNewContext(`${stripTypeScriptTypes(script)}\n${expression}`, {
    ...permissions,
    ref,
    computed,
    watch,
    onMounted() {},
    ICONS: {},
    ...context,
  });
}

function loadPins(granted) {
  const calls = [];
  let meta;
  const state = loadComponent("pages/access-control/door-pins.vue", {
    definePageMeta: (value) => { meta = value; },
    usePermission: () => ({ can: key => granted.includes(key) }),
    API_ENDPOINTS: { ACCESS_CONTROL: { GET_DOOR_PINS: "/pins", SET_DOOR_PIN: door => `/doors/${door}/pin` } },
    getHttp: () => ({
      get: async (url) => {
        calls.push({ method: "GET", url });
        return { data: [] };
      },
      post: async (url) => { calls.push({ method: "POST", url }); },
    }),
  }, "({ refresh, openEditor, save, selected, pin, confirmation });");
  return { ...state, calls, meta };
}

test("unrelated permissions cannot read or change door PINs", async () => {
  for (const granted of [[], [permissions.ACCESS_CARDS.VIEW], [permissions.PERMISSIONS_MEMBERS.UPDATE], [permissions.ACCESS_CONTROL.READER_RESET], [permissions.ACCESS_CONTROL.CONTROLLER_WIPE]]) {
    const page = loadPins(granted);
    assert.equal(page.meta.permission, permissions.ACCESS_CONTROL.PINS_MANAGE);
    await page.refresh();
    page.openEditor({ doorNumber: 1, name: "Main Gate" });
    assert.equal(page.selected.value, null);
    page.selected.value = { doorNumber: 1, name: "Main Gate" };
    page.pin.value = "1234";
    page.confirmation.value = "1234";
    await page.save();
    assert.equal(page.calls.length, 0);
  }
});

test("PIN managers can read and save; revoking permission blocks subsequent changes", async () => {
  const granted = [permissions.ACCESS_CONTROL.PINS_MANAGE];
  const page = loadPins(granted);
  await page.refresh();
  page.openEditor({ doorNumber: 1, name: "Main Gate" });
  page.pin.value = "1234";
  page.confirmation.value = "1234";
  await page.save();
  assert.equal(page.calls.filter(call => call.method === "POST").length, 1);
  page.openEditor({ doorNumber: 1, name: "Main Gate" });
  page.pin.value = "5678";
  page.confirmation.value = "5678";
  granted.length = 0;
  await page.save();
  assert.equal(page.calls.filter(call => call.method === "POST").length, 1);
});

test("sidebar separates PIN management from card and log viewing", () => {
  for (const [granted, visible] of [
    [permissions.ACCESS_CONTROL.PINS_MANAGE, "Door PINs"],
    [permissions.ACCESS_CARDS.VIEW, "Access Cards"],
    [permissions.ACCESS_LOGS.VIEW, "Access Logs"],
  ]) {
    const items = loadComponent("components/layout/sidebar.vue", {
      usePermission: () => ({ can: key => key === granted }),
      useAuthStore: () => ({}),
      useAnalyticsStore: () => ({ analyticsStats: {} }),
      useRoute: () => ({ path: "/", fullPath: "/" }),
      useRouter: () => ({}),
    }, "items.value;");
    const access = items[0].find(item => item.label === "Access Control");
    assert.equal(access.children.length, 1);
    assert.equal(access.children[0].label, visible);
  }
});

test("role permission tree includes every access-control permission returned by the backend", () => {
  const source = readFileSync(new URL("../app/pages/administration/roles.vue", import.meta.url), "utf8");
  const helpers = ["formatPermissionLabel", "buildPermissionTree"].map(name =>
    source.match(new RegExp(`function ${name}[\\s\\S]*?\\n\\}`))[0],
  ).join("\n");
  const buildTree = runInNewContext(`${stripTypeScriptTypes(helpers)}\nbuildPermissionTree;`);
  const keys = [permissions.ACCESS_LOGS.VIEW, ...Object.values(permissions.ACCESS_CONTROL)];
  const tree = buildTree({ accessControl: keys });
  assert.equal(tree[0].label, "Access Control");
  assert.equal(tree[0].children.length, 4);
  for (const key of keys) {
    assert.ok(tree[0].children.some(item => item.permissionKey === key));
  }
});
