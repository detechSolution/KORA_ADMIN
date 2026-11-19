import { parse } from "@vue/compiler-sfc";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Follow the existing Node test runner.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { reactive, ref } from "vue";
import * as z from "zod";

function loadPage({ login, post, replace = () => assert.fail("Setup must not enter the dashboard"), error = value => assert.fail(value.message) }) {
  const source = readFileSync(new URL("../app/pages/login.vue", import.meta.url), "utf8");
  const script = parse(source).descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?;\s*/gm, "");
  return runInNewContext(`${stripTypeScriptTypes(script)}\n({ handleLogin, completePasswordSetup, state, passwordSetupToken, isCompletingSetup, setupState, setupFormRef, setupSchema, loading });`, {
    reactive,
    ref,
    z,
    definePageMeta() {},
    useAuthStore: () => ({ login }),
    useRouter: () => ({ replace }),
    useNotification: () => ({ success() {}, error }),
    getHttp: () => ({ post }),
    API_ENDPOINTS: { AUTH: { PASSWORD_SETUP: "/api/v1/auth/admin/password-setup" } },
    getApiErrorMessage: error => error.message,
  });
}

test("temporary-password login opens setup and clears the temporary password without entering the dashboard", async () => {
  const page = loadPage({ login: async () => ({ requiresPasswordChange: true, passwordSetupToken: "restricted" }) });
  page.state.email = "admin@example.com";
  page.state.password = "temporary";
  await page.handleLogin();
  assert.equal(page.passwordSetupToken.value, "restricted");
  assert.equal(page.state.password, "");
});

test("setup verifies a new session and opens the dashboard without asking for another login", async () => {
  let submitted;
  const steps = [];
  const page = loadPage({
    post: async (url, body) => {
      assert.equal(url, "/api/v1/auth/admin/password-setup");
      submitted = body;
      steps.push("password-changed");
    },
    login: async (credentials) => {
      assert.equal(credentials.email, "admin@example.com");
      assert.equal(credentials.password, "ChosenPassword@123");
      steps.push("session-verified");
    },
    replace: (route) => {
      assert.equal(route.name, "index");
      steps.push("dashboard");
    },
  });
  page.state.email = "admin@example.com";
  page.passwordSetupToken.value = "restricted";
  page.setupState.newPassword = "ChosenPassword@123";
  page.setupState.confirmPassword = "ChosenPassword@123";
  page.setupFormRef.value = { validate: async () => page.setupSchema.parse(page.setupState) };
  await page.completePasswordSetup();
  assert.equal(submitted.passwordSetupToken, "restricted");
  assert.equal(submitted.newPassword, "ChosenPassword@123");
  assert.equal(page.passwordSetupToken.value, null);
  assert.equal(page.setupState.newPassword, "");
  assert.equal(page.setupState.confirmPassword, "");
  assert.deepEqual(steps, ["password-changed", "session-verified", "dashboard"]);
});

test("failed automatic sign-in explains that the password changed and does not enter the dashboard", async () => {
  let message;
  const page = loadPage({
    post: async () => {},
    login: async () => { throw new Error("Sign in with your new password."); },
    error: (value) => { message = value.message; },
  });
  page.state.email = "admin@example.com";
  page.passwordSetupToken.value = "restricted";
  page.setupState.newPassword = "ChosenPassword@123";
  page.setupState.confirmPassword = "ChosenPassword@123";
  page.setupFormRef.value = { validate: async () => page.setupSchema.parse(page.setupState) };
  await page.completePasswordSetup();
  assert.match(message, /Your password was changed/);
  assert.equal(page.passwordSetupToken.value, null);
  assert.equal(page.setupState.newPassword, "");
  assert.equal(page.loading.value, false);
  assert.equal(page.isCompletingSetup.value, false);
});

test("the setup screen stays visible during automatic sign-in and dashboard navigation", async () => {
  let finishLogin;
  let finishNavigation;
  let loginStarted;
  let navigationStarted;
  const loginPending = new Promise((resolve) => {
    finishLogin = resolve;
  });
  const navigationPending = new Promise((resolve) => {
    finishNavigation = resolve;
  });
  const loginReady = new Promise((resolve) => {
    loginStarted = resolve;
  });
  const navigationReady = new Promise((resolve) => {
    navigationStarted = resolve;
  });
  const page = loadPage({
    post: async () => {},
    login: async () => {
      loginStarted();
      await loginPending;
    },
    replace: async () => {
      navigationStarted();
      await navigationPending;
    },
  });
  page.state.email = "admin@example.com";
  page.passwordSetupToken.value = "restricted";
  page.setupState.newPassword = "ChosenPassword@123";
  page.setupState.confirmPassword = "ChosenPassword@123";
  page.setupFormRef.value = { validate: async () => page.setupSchema.parse(page.setupState) };
  const completion = page.completePasswordSetup();
  await loginReady;
  assert.equal(page.passwordSetupToken.value, null);
  assert.equal(page.isCompletingSetup.value, true);
  assert.equal(page.loading.value, true);
  finishLogin();
  await navigationReady;
  assert.equal(page.isCompletingSetup.value, true);
  assert.equal(page.loading.value, true);
  finishNavigation();
  await completion;
  assert.equal(page.isCompletingSetup.value, true);
  assert.equal(page.loading.value, true);
});

test("weak or mismatched passwords are refused before submitting", async () => {
  const page = loadPage({ post: () => assert.fail("Invalid passwords must not be submitted") });
  page.passwordSetupToken.value = "restricted";
  page.setupFormRef.value = { validate: async () => page.setupSchema.parse(page.setupState) };
  page.setupState.newPassword = "short";
  page.setupState.confirmPassword = "short";
  await page.completePasswordSetup();
  page.setupState.newPassword = "ChosenPassword@123";
  page.setupState.confirmPassword = "OtherPassword@123";
  await page.completePasswordSetup();
  assert.equal(page.passwordSetupToken.value, "restricted");
  assert.equal(page.loading.value, false);
});
