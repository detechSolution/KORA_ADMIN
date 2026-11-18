import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Follow the existing Node test runner.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as z from "zod";

import { appendSessionMedia, sessionBannerImageSchema, sessionBannerVideoSchema } from "../app/utils/session-media.ts";

for (const path of ["pages/offerings/create-sessions.vue", "components/offerings/sessions/edit.vue"]) {
  const source = readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");
  const script = source.slice(source.indexOf("const step1Schema"), source.indexOf("const step2Schema"));
  const schema = runInNewContext(`${stripTypeScriptTypes(script)}\nstep1Schema;`, {
    z,
    sessionTypeSchema: z.string(),
    sessionBannerImageSchema,
    sessionBannerVideoSchema,
    stripHtml: value => value || "",
  });
  test(`${path} accepts missing, null or removed media`, () => {
    for (const value of [undefined, null, ""]) {
      assert.equal(schema.safeParse({
        sessionName: "Class",
        sessionType: "class",
        sessionDescription: "Details",
        bannerImage: value,
        bannerVideo: value,
      }).success, true);
    }
  });
}

test("create omits empty uploads instead of sending undefined as text", () => {
  const data = new FormData();
  appendSessionMedia(data, "file", undefined);
  appendSessionMedia(data, "video", null);
  assert.deepEqual([...data.entries()], []);
});

test("edit distinguishes omitted media from explicitly removed media", () => {
  const omitted = new FormData();
  appendSessionMedia(omitted, "file", undefined, true);
  assert.equal(omitted.has("fileUrl"), false);
  const cleared = new FormData();
  appendSessionMedia(cleared, "file", null, true);
  appendSessionMedia(cleared, "video", "", true);
  assert.deepEqual([...cleared.entries()], [["fileUrl", ""], ["videoUrl", ""]]);
});

test("accepts an image alone, a video alone and existing URLs", () => {
  const image = new File(["image"], "banner.png", { type: "image/png" });
  const video = new File(["video"], "banner.mp4", { type: "video/mp4" });
  assert.equal(sessionBannerImageSchema.safeParse(image).success, true);
  assert.equal(sessionBannerVideoSchema.safeParse(video).success, true);
  const data = new FormData();
  appendSessionMedia(data, "file", image);
  appendSessionMedia(data, "video", "https://example.com/video.mp4");
  assert.equal(data.get("file").name, "banner.png");
  assert.equal(data.get("videoUrl"), "https://example.com/video.mp4");
});

test("rejects unsupported image and video file types with clear messages", () => {
  for (const [schema, kind] of [[sessionBannerImageSchema, "image"], [sessionBannerVideoSchema, "video"]]) {
    const result = schema.safeParse(new File(["pdf"], "bad.pdf", { type: "application/pdf" }));
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, new RegExp(`Banner ${kind} must be`));
  }
});

test("rejects oversized media with the applicable size limit", () => {
  for (const [schema, kind, limit] of [[sessionBannerImageSchema, "image", 2], [sessionBannerVideoSchema, "video", 100]]) {
    const file = new File(["x"], "large", { type: kind === "image" ? "image/png" : "video/mp4" });
    Object.defineProperty(file, "size", { value: limit * 1024 * 1024 + 1 });
    const result = schema.safeParse(file);
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, new RegExp(`${limit}MB size limit`));
  }
});
