<script setup lang="ts">
type Props = {
  icon?: string;
};

withDefaults(defineProps<Props>(), {
  icon: "",
});
</script>

<template>
  <header>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Title with Icon -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <div v-if="icon" class="p-2 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
            <UIcon
              :name="icon"
              class="w-6 h-6 text-primary"
            />
          </div>
          <h1 class="text-2xl font-bold text-foreground">
            <slot name="title" />
          </h1>
        </div>
        <p v-if="$slots.description" class="text-xs text-secondary-500 font-light">
          <slot name="description" />
        </p>
      </div>

      <!-- Right: Actions or Additional Content -->
      <div v-if="$slots.actions" class="flex flex-col gap-3 lg:items-end">
        <div class="w-full lg:w-auto">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </header>
</template>
