import { parse } from "@vue/compiler-sfc";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Use the existing Node runner without adding a dependency.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { computed, ref } from "vue";

function loadAttendance(session) {
  const source = readFileSync(new URL("../app/components/session/attendance-modal.vue", import.meta.url), "utf8");
  const script = parse(source).descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?;\s*/gm, "");
  let now = Date.parse("2026-11-12T23:00:00+05:45");
  let tick;
  let cleanup;
  const state = runInNewContext(`${stripTypeScriptTypes(script)}\n({ isReadOnly, startAttendance, attendanceStarted, toggleStatus, handleSaveAttendance });`, {
    computed,
    ref,
    defineProps: () => ({ open: true, session }),
    defineEmits: () => () => {},
    useNotification: () => ({ success() {}, error() {} }),
    useSessionsStore: () => ({ sessionAttendance: [], getAttendance: async () => {} }),
    getNepalTimestamp: (date, time) => Date.parse(`${date}T${time}+05:45`),
    Date: { now: () => now },
    setInterval: (callback) => {
      tick = callback;
      return 1;
    },
    clearInterval: id => assert.equal(id, 1),
    watch: (_source, callback) => callback(true, undefined, (fn) => { cleanup = fn; }),
  });
  return {
    state,
    setTime: (time) => { now = Date.parse(time); },
    tick: () => tick(),
    cleanup: () => cleanup(),
  };
}

test("attendance stays editable after session end and closes 150 minutes later across midnight", () => {
  const modal = loadAttendance({ sessionDate: "2026-11-12", endTime: "23:00:00" });
  assert.equal(modal.state.isReadOnly.value, false);
  modal.setTime("2026-11-13T01:29:59+05:45");
  modal.tick();
  assert.equal(modal.state.isReadOnly.value, false);
  modal.state.startAttendance();
  assert.equal(modal.state.attendanceStarted.value, true);
  modal.setTime("2026-11-13T01:30:00+05:45");
  modal.tick();
  assert.equal(modal.state.isReadOnly.value, true);
  modal.cleanup();
});

test("starting attendance checks the deadline even before the next timer tick", () => {
  const modal = loadAttendance({ sessionDate: "2026-11-12", endTime: "23:00:00" });
  modal.setTime("2026-11-13T01:30:00+05:45");
  modal.state.startAttendance();
  assert.equal(modal.state.attendanceStarted.value, false);
  assert.equal(modal.state.isReadOnly.value, true);
  modal.cleanup();
});
