<script setup lang="ts">
import { ICONS } from "~/config/icons";

// Nuxt automatically passes error prop, but we're using static 404 content
const handleError = () => clearError({ redirect: "/" });

// Set page title
useHead({
  title: "404 - Page Not Found",
});
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-4 py-12">
    <div class="max-w-4xl w-full">
      <!-- Main Error Content -->
      <div class="text-center flex flex-col gap-4">
        <h1 class="text-8xl font-bold text-foreground">
          404
        </h1>
        <h2 class="text-3xl font-semibold text-foreground">
          PAGE NOT FOUND
        </h2>
        <p class="text-xl text-foreground">
          This page doesn't exist (yet).
        </p>
        <p class="text-muted-foreground max-w-2xl mx-auto">
          The link you followed may be broken or the page may have been moved. You can go back to the dashboard.
        </p>

        <!-- Action Buttons -->
        <div class="flex justify-center items-center mt-4">
          <base-button
            variant="outline"
            color="primary"
            :leading-icon="ICONS.ARROW_LEFT"
            to="/"
            @click="handleError"
          >
            Back to Dashboard
          </base-button>
        </div>
      </div>
    </div>
  </div>
</template>
