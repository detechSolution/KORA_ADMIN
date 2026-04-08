<script setup lang="ts">
import { computed, watch } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "~/stores/auth";

useSeoMeta({
  title: "Baha | System",
  description: "System",
});

const authStore = useAuthStore();
const toasterOptions = { position: "top-right" as const };

const { error: showError } = useNotification();

const router = useRouter();

const unAuthorizedError = computed(() => authStore.unAuthorizedError);

watch(unAuthorizedError, (unAuthorizedError) => {
  if (unAuthorizedError) {
    authStore.logout();
    showError({ message: "Your session has expired. Please login again." });
    router.push({ name: "login" });
  }
});
</script>

<template>
  <UApp class="bg-background" :toaster="toasterOptions">
    <NuxtLoadingIndicator color="bg-primary" />
    <SplashScreen />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
