import { parse } from "@vue/compiler-sfc";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Follow the existing Node test runner.
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const update = "offerings.sessions.update";

function source(path) {
  return readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");
}

function handler(path, name, context) {
  const script = parse(source(path)).descriptor.scriptSetup.content;
  const declaration = script.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}`))[0];
  return runInNewContext(`${stripTypeScriptTypes(declaration)}\n${name};`, {
    PERMISSIONS_SESSIONS: { UPDATE: update },
    ...context,
  });
}

test("session card edit clicks require update permission, including after revocation", () => {
  const granted = ["offerings.sessions.view"];
  const emitted = [];
  const click = handler("components/session/session-card.vue", "handleEditClick", {
    can: key => granted.includes(key),
    props: { id: 7 },
    emit: (...args) => emitted.push(args),
  });
  click();
  assert.equal(emitted.length, 0);
  granted.push(update);
  click();
  assert.deepEqual(emitted, [["openEditSessionDrawer", 7]]);
  granted.pop();
  click();
  assert.equal(emitted.length, 1);
});

test("view-only users cannot open the edit drawer directly", () => {
  for (const allowed of [false, true]) {
    const open = { value: false };
    const selected = { value: null };
    const session = { id: 7 };
    const click = handler("pages/offerings/session.vue", "handleOpenEditSessionDrawer", {
      can: () => allowed,
      isSessionEditDrawerOpen: open,
      selectedSession: selected,
      sessions: { value: { data: [session] } },
    });
    click(7);
    assert.equal(open.value, allowed);
    assert.equal(selected.value, allowed ? session : null);
  }
});

test("overview edit attempts preserve the overview for view-only users", () => {
  const overview = { value: true };
  let opens = 0;
  const click = handler("pages/offerings/session.vue", "handleEditFromOverview", {
    can: () => false,
    isSessionOverviewModalOpen: overview,
    handleOpenEditSessionDrawer: () => opens++,
  });
  click(7);
  assert.equal(overview.value, true);
  assert.equal(opens, 0);
});

test("the edit form refuses submission before validation without update permission", async () => {
  const submit = handler("components/offerings/sessions/edit.vue", "handleUpdateSession", {
    can: () => false,
    formRef: { value: { validate: () => assert.fail("Unauthorized validation") } },
    sessionsStore: { updateSession: () => assert.fail("Unauthorized save") },
  });
  await submit();
});

test("the pencil and drawer are permission-gated while the eye remains available", () => {
  const card = source("components/session/session-card.vue");
  const pencil = card.match(/<UTooltip\s[\s\S]*?text="Edit Session"[\s\S]*?<\/UTooltip>/)[0];
  // Start at the nearest tooltip, rather than preceding attendance actions.
  const editTooltip = pencil.slice(pencil.lastIndexOf("<UTooltip"));
  assert.match(editTooltip, /v-if="can\(PERMISSIONS_SESSIONS.UPDATE\)"/);
  const eye = card.match(/<UTooltip text="Open Overview">[\s\S]*?<\/UTooltip>/)[0];
  assert.doesNotMatch(eye, /v-if=/);
  assert.match(source("pages/offerings/session.vue"), /<OfferingsSessionsEdit\s+v-if="isSessionEditDrawerOpen && can\(PERMISSIONS_SESSIONS.UPDATE\)"/);
  assert.match(source("components/offerings/sessions/edit.vue"), /<base-drawer\s+v-if="can\(PERMISSIONS_SESSIONS.UPDATE\)"/);
});
