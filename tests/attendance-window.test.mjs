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
  let lastError;
  const state = runInNewContext(`${stripTypeScriptTypes(script)}\n({ isReadOnly, isFuture, isLocked, tooltipMessage, startAttendance, attendanceStarted, toggleStatus, handleSaveAttendance });`, {
    computed,
    ref,
    defineProps: () => ({ open: true, session }),
    defineEmits: () => () => {},
    useNotification: () => ({
      success() {},
      error(err) { lastError = err?.message; },
    }),
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
    getLastError: () => lastError,
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
  assert.equal(modal.state.tooltipMessage.value, "Attendance is view-only.");
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

test("future session is read-only and refuses attendance until 30 minutes before start", () => {
  const modal = loadAttendance({
    sessionDate: "2026-11-13",
    startTime: "21:00:00",
    endTime: "23:45:00",
  });

  // 12:00 PM: More than 30 minutes before start (9:00 PM) -> read-only
  modal.setTime("2026-11-13T12:00:00+05:45");
  modal.tick();
  assert.equal(modal.state.isFuture.value, true);
  assert.equal(modal.state.isReadOnly.value, true);
  assert.equal(modal.state.tooltipMessage.value, "Attendance can be marked from 30 minutes before the session starts.");

  // Trying to start attendance is refused with clear error message
  modal.state.startAttendance();
  assert.equal(modal.state.attendanceStarted.value, false);
  assert.equal(modal.getLastError(), "Attendance can be marked from 30 minutes before the session starts.");

  // 20:29:59 (30m 1s before start) -> still read-only
  modal.setTime("2026-11-13T20:29:59+05:45");
  modal.tick();
  assert.equal(modal.state.isFuture.value, true);
  assert.equal(modal.state.isReadOnly.value, true);

  // 20:30:00 (exactly 30 minutes before start) -> allowed
  modal.setTime("2026-11-13T20:30:00+05:45");
  modal.tick();
  assert.equal(modal.state.isFuture.value, false);
  assert.equal(modal.state.isReadOnly.value, false);
  assert.equal(modal.state.tooltipMessage.value, "");

  modal.state.startAttendance();
  assert.equal(modal.state.attendanceStarted.value, true);

  // During session (e.g. 22:00:00) -> allowed
  modal.setTime("2026-11-13T22:00:00+05:45");
  modal.tick();
  assert.equal(modal.state.isReadOnly.value, false);

  // 2.5 hours after session end (23:45 + 150m = 02:15:00 next day) -> locked (D-15)
  modal.setTime("2026-11-14T02:15:00+05:45");
  modal.tick();
  assert.equal(modal.state.isLocked.value, true);
  assert.equal(modal.state.isReadOnly.value, true);
  assert.equal(modal.state.tooltipMessage.value, "Attendance is view-only.");

  modal.cleanup();
});
