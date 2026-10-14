import { parse } from "@vue/compiler-sfc";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Use the existing Node runner without adding a dependency.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { createPinia, defineStore, setActivePinia } from "pinia";
import { computed, reactive, ref } from "vue";

const API_ENDPOINTS = { AUTH: { LOGIN: "/login", ME: "/me", REFRESH: "/refresh" } };
const credentials = { email: "admin@example.test", password: "password", rememberMe: false };

function loadScript(path, context, expression) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8")
    .replace(/^import\s[\s\S]*?;\s*/gm, "")
    .replace(/^export type .*;\s*/gm, "")
    .replace(/^export /gm, "");
  return runInNewContext(`${stripTypeScriptTypes(source)}\n${expression}`, {
    API_ENDPOINTS,
    console: { error() {} },
    ...context,
  });
}

function loadAuth(http, hasTokens = false) {
  setActivePinia(createPinia());
  const storage = {
    hasTokens: () => hasTokens,
    setTokens: () => {
      hasTokens = true;
      return true;
    },
    removeTokens: () => { hasTokens = false; },
  };
  const useAuthStore = loadScript("../app/stores/auth.ts", {
    defineStore,
    ref,
    getHttp: () => http,
    useStorage: () => storage,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  }, "useAuthStore;");
  return useAuthStore();
}

test("login waits for profile verification before becoming authenticated", async () => {
  let resolveProfile;
  const profile = new Promise((resolve) => {
    resolveProfile = resolve;
  });
  const auth = loadAuth({
    post: async () => ({ accessToken: "access", refreshToken: "refresh" }),
    get: () => profile,
  });
  const login = auth.login(credentials);
  await Promise.resolve();
  assert.equal(auth.isAuthenticated, false);
  resolveProfile({ id: 1, fullName: "Admin", permissions: [] });
  await login;
  assert.equal(auth.isAuthenticated, true);
  assert.equal(auth.user.name, "Admin");
});

test("failed profile verification rejects login instead of allowing dashboard navigation", async () => {
  const auth = loadAuth({
    post: async () => ({ accessToken: "access", refreshToken: "refresh" }),
    get: async () => { throw new Error("Profile unavailable"); },
  });
  await assert.rejects(auth.login(credentials), /Profile unavailable/);
  assert.equal(auth.isAuthenticated, false);
  assert.equal(auth.isCheckingAuth, false);
});

test("missing login tokens reject login", async () => {
  const auth = loadAuth({ post: async () => ({}) });
  await assert.rejects(auth.login(credentials), /Invalid login response/);
  assert.equal(auth.isAuthenticated, false);
});

test("an empty profile response does not complete login", async () => {
  const auth = loadAuth({
    post: async () => ({ accessToken: "access", refreshToken: "refresh" }),
    get: async () => null,
  });
  await assert.rejects(auth.login(credentials), /Unable to verify your session/);
  assert.equal(auth.isAuthenticated, false);
});

test("login verification keeps the form visible instead of flashing the splash screen", () => {
  const source = readFileSync(new URL("../app/components/splash-screen.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const script = stripTypeScriptTypes(descriptor.scriptSetup.content.replace(/^import\s[\s\S]*?;\s*/gm, ""));
  const auth = reactive({ isCheckingAuth: true });
  const route = reactive({ name: "login" });
  const visible = runInNewContext(`${script}\nisVisible;`, {
    computed,
    useAuthStore: () => auth,
    useRoute: () => route,
  });
  assert.equal(visible.value, false);
  route.name = "index";
  assert.equal(visible.value, true);
  auth.isCheckingAuth = false;
  assert.equal(visible.value, false);
});

test("concurrent middleware auth checks share one profile request", async () => {
  let resolveProfile;
  let requests = 0;
  const profile = new Promise((resolve) => {
    resolveProfile = resolve;
  });
  const auth = loadAuth({
    get: () => {
      requests++;
      return profile;
    },
  }, true);
  const first = auth.checkAuthIfNeeded();
  const second = auth.checkAuthIfNeeded();
  assert.equal(requests, 1);
  resolveProfile({ id: 1, permissions: [] });
  await Promise.all([first, second]);
  assert.equal(auth.isAuthenticated, true);
  assert.equal(auth.isCheckingAuth, false);
});

test("logout invalidates the cached profile check", async () => {
  let requests = 0;
  const auth = loadAuth({
    post: async () => ({ accessToken: "access", refreshToken: "refresh" }),
    get: async () => {
      requests++;
      return { id: 1, permissions: [] };
    },
  });
  await auth.login(credentials);
  auth.logout();
  await auth.checkAuthIfNeeded();
  assert.equal(auth.isAuthenticated, false);
  await auth.login(credentials);
  assert.equal(requests, 2);
  assert.equal(auth.isAuthenticated, true);
});

function loadHttp(endpointResponses) {
  const calls = [];
  let unauthorized = false;
  let loggedOut = false;
  const auth = {
    setUnAuthorizedError: (value) => { unauthorized = value; },
    logout: () => { loggedOut = true; },
  };
  const http = loadScript("../app/composables/use-api.ts", {
    Error,
    AbortController,
    FormData,
    setTimeout,
    clearTimeout,
    isApiError: error => error instanceof Error && typeof error.status === "number",
    useAuthStore: () => auth,
    fetch: async (url) => {
      calls.push(url);
      return endpointResponses[url];
    },
  }, "createHttpClient({ baseURL: '', storage: { getAccessToken: () => null, getRefreshToken: () => null } });");
  return { http, calls, isUnauthorized: () => unauthorized, isLoggedOut: () => loggedOut };
}

test("invalid login credentials do not trigger session-expiry redirects or token refresh", async () => {
  const client = loadHttp({ "/login": { ok: false, status: 401, statusText: "Unauthorized", json: async () => ({ message: "Invalid credentials" }) } });
  await assert.rejects(client.http.post(API_ENDPOINTS.AUTH.LOGIN, credentials), /Invalid credentials/);
  assert.deepEqual(client.calls, ["/login"]);
  assert.equal(client.isUnauthorized(), false);
  assert.equal(client.isLoggedOut(), false);
});

test("protected API 401 still triggers session expiry", async () => {
  const client = loadHttp({ "/me": { ok: false, status: 401, statusText: "Unauthorized", json: async () => ({ message: "Session expired" }) } });
  await assert.rejects(client.http.get(API_ENDPOINTS.AUTH.ME), /Session expired/);
  assert.equal(client.isUnauthorized(), true);
  assert.equal(client.isLoggedOut(), true);
});
