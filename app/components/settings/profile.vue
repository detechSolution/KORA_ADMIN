<script setup lang="ts">
import { computed } from "vue";

import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

const email = computed(() => authStore.user.email);
const name = computed(() => authStore.user.name);
const phone = computed(() => authStore.user.phone);

function getFirstLetter(name: string): string {
  return name?.charAt(0).toUpperCase() || "U";
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Profile Header -->
    <div class="flex items-center gap-3 pb-4 border-b border-border">
      <UAvatar
        :text="getFirstLetter(name || 'User')"
        :ui="{
          root: 'w-12 h-12 bg-primary rounded-lg text-base shrink-0',
          fallback: 'text-white font-semibold',
        }"
      />
      <div class="flex flex-col gap-0.5 min-w-0 flex-1">
        <h2 class="text-lg font-semibold text-foreground truncate">
          {{ name || "User" }}
        </h2>
        <p class="text-xs text-muted-foreground truncate">
          {{ email || "No email provided" }}
        </p>
      </div>
    </div>

    <!-- Profile Information -->
    <div class="flex flex-col gap-4">
      <div>
        <h3 class="text-base font-semibold text-foreground mb-3">
          Personal Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              Email Address
            </label>
            <div class="p-2.5 bg-muted rounded-md border border-border">
              <p class="text-sm text-foreground">
                {{ email || "Not set" }}
              </p>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              Name
            </label>
            <div class="p-2.5 bg-muted rounded-md border border-border">
              <p class="text-sm text-foreground">
                {{ name || "Not set" }}
              </p>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              Phone Number
            </label>
            <div class="p-2.5 bg-muted rounded-md border border-border">
              <p class="text-sm text-foreground">
                {{ phone || "Not set" }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Message -->
      <div class="bg-muted/50 border border-border rounded-md p-3">
        <div class="flex items-start gap-2.5">
          <div class="flex flex-col gap-0.5">
            <p class="text-xs font-medium text-foreground">
              Profile Updates
            </p>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Profile information is managed by your administrator. Contact support if you need to update your details.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
