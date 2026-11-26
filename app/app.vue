<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "~/stores/auth";

useSeoMeta({
  title: "Kora | Administration",
  description: "Kora",
});

const authStore = useAuthStore();
const toasterOptions = { position: "top-right" as const };

const { error: showError } = useNotification();

const router = useRouter();

const unAuthorizedError = computed(() => authStore.unAuthorizedError);
const idleWarningOpen = ref(false);
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const IDLE_WARNING_MS = IDLE_TIMEOUT_MS - 2 * 60 * 1000;
let idleWarningTimer: ReturnType<typeof setTimeout> | undefined;
let idleLogoutTimer: ReturnType<typeof setTimeout> | undefined;
const activityEvents: Array<keyof WindowEventMap> = [
  "pointerdown",
  "pointermove",
  "keydown",
  "scroll",
  "touchstart",
];

function clearIdleTimers() {
  if (idleWarningTimer)
    clearTimeout(idleWarningTimer);
  if (idleLogoutTimer)
    clearTimeout(idleLogoutTimer);
  idleWarningTimer = undefined;
  idleLogoutTimer = undefined;
}

function scheduleIdleTimeout() {
  clearIdleTimers();
  if (!authStore.isAuthenticated)
    return;

  idleWarningTimer = setTimeout(() => {
    idleWarningOpen.value = true;
  }, IDLE_WARNING_MS);
  idleLogoutTimer = setTimeout(() => {
    idleWarningOpen.value = false;
    void authStore.logout().finally(() => {
      showError({ message: "You were signed out after 60 minutes without activity." });
      void router.push({ name: "login" });
    });
  }, IDLE_TIMEOUT_MS);
}

function recordActivity() {
  if (!authStore.isAuthenticated)
    return;
  idleWarningOpen.value = false;
  scheduleIdleTimeout();
}

async function staySignedIn() {
  try {
    await authStore.checkAuth(true);
    recordActivity();
  }
  catch {
    // Auth check handles expired/revoked sessions and the existing route guard.
  }
}

watch(unAuthorizedError, (unAuthorizedError) => {
  if (unAuthorizedError) {
    void authStore.logout(false);
    showError({ message: "Your session has expired. Please login again." });
    router.push({ name: "login" });
  }
});

watch(() => authStore.isAuthenticated, scheduleIdleTimeout);

onMounted(() => {
  activityEvents.forEach(event => window.addEventListener(event, recordActivity, { passive: true }));
  scheduleIdleTimeout();
});

onBeforeUnmount(() => {
  clearIdleTimers();
  activityEvents.forEach(event => window.removeEventListener(event, recordActivity));
});
</script>

<template>
  <UApp class="bg-background" :toaster="toasterOptions">
    <NuxtLoadingIndicator color="bg-primary" />
    <SplashScreen />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UModal v-model:open="idleWarningOpen" :dismissible="false">
      <template #title>
        Still working?
      </template>
      <template #description>
        You’ll be signed out in 2 minutes after inactivity. Stay signed in to keep working.
      </template>
      <template #footer>
        <div class="flex justify-end">
          <UButton
            color="primary"
            @pointerdown.stop
            @keydown.stop
            @click="staySignedIn"
          >
            Stay signed in
          </UButton>
        </div>
      </template>
    </UModal>
  </UApp>
</template>
