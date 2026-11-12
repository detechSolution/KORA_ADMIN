import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Use the existing Node runner without adding a dependency.
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { runInNewContext } from "node:vm";
import { nextTick, reactive, ref, watch } from "vue";
import * as z from "zod";

const source = readFileSync(new URL("../app/pages/offerings/create-sessions.vue", import.meta.url), "utf8");
const stripHtml = runInNewContext(stripTypeScriptTypes(`${source.match(/function stripHtml[\s\S]*?\n\}/)[0]}\nstripHtml;`));
const schema = z.object({
  sessionDescription: runInNewContext(source.match(/ {2}sessionDescription: (.+),/)[1], { z, stripHtml }),
});

test("typing clears the description error and deleting the text restores it", async () => {
  const form = reactive({ sessionDescription: "" });
  const currentStep = ref(0);
  let errors = schema.safeParse(form).error.issues;
  const calls = [];
  const formRef = ref({
    validate: async (options) => {
      calls.push(options);
      const result = schema.safeParse(form);
      errors = result.success ? [] : result.error.issues;
    },
  });
  const stop = runInNewContext(source.match(/watch\(\(\) => form\.sessionDescription,[\s\S]*?\n\}\);/)[0], {
    watch,
    form,
    currentStep,
    formRef,
    nextTick,
  });
  try {
    assert.equal(errors[0].message, "Description is required");
    form.sessionDescription = "<p>Session details</p>";
    await nextTick();
    await setImmediate();
    assert.equal(errors.length, 0);
    assert.equal(calls[0].name, "sessionDescription");
    assert.equal(calls[0].silent, true);
    form.sessionDescription = "<p>&nbsp;</p>";
    await nextTick();
    await setImmediate();
    assert.equal(errors[0].message, "Description is required");
    currentStep.value = 1;
    form.sessionDescription = "<p>Changed on another step</p>";
    await nextTick();
    await setImmediate();
    assert.equal(calls.length, 2);
  }
  finally {
    stop();
  }
});
