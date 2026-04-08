<script setup lang="ts">
import { computed } from "vue";

import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

const isVisible = computed(() => authStore.isCheckingAuth);
</script>

<template>
  <div
    v-show="isVisible"
    class="fixed inset-0 z-9999 flex items-center justify-center bg-background"
  >
    <div class="loader">
      <div class="dot" />
      <div class="dot" />
      <div class="dot" />
    </div>
  </div>
</template>

<style scoped>
.loader {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: bounce 1.4s ease-in-out infinite;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0.4);
  }
  40% {
    transform: scale(1);
  }
}
</style>
