<script setup lang="ts">
import { computed, ref } from "vue";

import SettingsChangePassword from "~/components/settings/change-password.vue";
import SettingsProfile from "~/components/settings/profile.vue";
import { useBreakpoint } from "~/composables/use-breakpoint";
import { ICONS } from "~/config/icons";

definePageMeta({
  layout: "dashboard",
  auth: true,
});

const tabs = [
  {
    label: "Profile",
    value: "account",
    icon: ICONS.SETTINGS,
  },
  {
    label: "Change Password",
    value: "change-password",
    icon: ICONS.LOCK,
  },
];

const activeTab = ref("account");
const isMdOrAbove = useBreakpoint(768);

const tabComponents = {
  "account": SettingsProfile,
  "change-password": SettingsChangePassword,
} as const;

const activeComponent = computed(() => {
  return tabComponents[activeTab.value as keyof typeof tabComponents];
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Settings
      </template>
      <template #description>
        Manage your account settings and preferences
      </template>
    </base-page-header>

    <div class="page-content-height bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6">
      <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <!-- Sidebar Navigation (Desktop) -->
        <div v-if="isMdOrAbove" class="hidden lg:block">
          <div class="bg-muted/30 border border-border rounded-lg p-1.5 sticky top-4">
            <nav class="flex flex-col gap-1">
              <button
                v-for="tab in tabs"
                :key="tab.value"
                class="flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors"
                :class="[
                  activeTab === tab.value
                    ? 'bg-primary text-white'
                    : 'text-foreground hover:bg-muted',
                ]"
                @click="activeTab = tab.value"
              >
                <UIcon :name="tab.icon" class="w-4 h-4 shrink-0" />
                <span class="font-medium text-sm">{{ tab.label }}</span>
              </button>
            </nav>
          </div>
        </div>

        <!-- Mobile Tabs -->
        <div v-else class="lg:hidden">
          <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              class="flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap transition-colors"
              :class="[
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-foreground hover:bg-muted',
              ]"
              @click="activeTab = tab.value"
            >
              <UIcon :name="tab.icon" class="w-4 h-4" />
              <span class="font-medium text-sm">{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- Content Area -->
        <div class="flex-1">
          <div class="bg-muted/30 border border-border rounded-lg p-5 lg:p-6">
            <component :is="activeComponent" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
