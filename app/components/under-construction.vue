<script setup lang="ts">
import { ICONS } from "~/config/icons";

type Props = {
  title?: string;
  description?: string;
  hint?: string;
  icon?: string;
  actionLabel?: string;
  actionTo?: string;
  showAction?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  title: "Page under construction",
  description: "We're putting the finishing touches on this page. Check back soon.",
  hint: "Need something sooner? Let us know and we'll prioritize it.",
  icon: ICONS.ALERT_CIRCLE,
  actionLabel: "Back to dashboard",
  actionTo: "/",
  showAction: true,
});
</script>

<template>
  <section class="w-full">
    <div class="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] gap-8">
      <!-- Main Content -->
      <div class="flex flex-col items-center gap-6 text-center max-w-2xl">
        <!-- Icon with gradient background -->
        <div class="relative">
          <div class="absolute inset-0 bg-linear-to-r from-primary/20 via-primary/10 to-transparent rounded-full blur-xl opacity-50" />
          <div class="relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-lg">
            <UIcon
              :name="props.icon"
              class="h-8 w-8 text-primary"
              dynamic
            />
          </div>
        </div>

        <!-- Heading -->
        <div class="space-y-3">
          <h2 class="text-2xl sm:text-3xl font-bold text-foreground">
            {{ props.title }}
          </h2>
          <p class="text-base text-muted-foreground max-w-xl">
            {{ props.description }}
          </p>
        </div>

        <!-- Hint -->
        <p class="text-sm text-muted-foreground/80 max-w-md">
          {{ props.hint }}
        </p>

        <!-- Action Button -->
        <div v-if="props.showAction" class="mt-2">
          <base-button
            :to="props.actionTo"
            variant="outline"
            size="lg"
            :leading-icon="ICONS.ARROW_LEFT"
            class="w-full sm:w-auto"
          >
            {{ props.actionLabel }}
          </base-button>
        </div>
      </div>
    </div>
  </section>
</template>
