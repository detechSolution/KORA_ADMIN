<script setup lang="ts">
import { onMounted, ref } from "vue";

import { ICONS } from "~/config/icons";
import { useNotificationStore } from "~/stores/notification";

const router = useRouter();
const notificationStore = useNotificationStore();
const notificationOpen = ref(false);

function handleSettingsClick() {
  router.push({ name: "settings" });
}

onMounted(() => {
  notificationStore.fetchUnreadCount();
});
</script>

<template>
  <main class="min-h-dvh">
    <UDashboardGroup unit="rem" class="">
      <LayoutSidebar />
      <div class="w-full bg-background dark:bg-background rounded-lg min-w-0">
        <UDashboardPanel
          id="default"
          :ui="{
            root: 'h-full min-h-(calc(100vh-1rem))',
            body: 'overflow-y-auto p-4',
          }"
        >
          <template #header>
            <UDashboardNavbar :ui="{ root: 'bg-white h-(--size-navbar) border-b border-border' }">
              <template #leading>
                <div class="flex items-center gap-3">
                  <UDashboardSidebarCollapse :icon="ICONS.PANEL_RIGHT" />
                </div>
              </template>
              <template #toggle>
                <UDashboardSidebarToggle :icon="ICONS.PANEL_RIGHT" />
              </template>

              <template #right>
                <div class="flex gap-3">
                  <UPopover v-model:open="notificationOpen">
                    <div class="relative">
                      <base-button
                        :aria-label="`Notifications${notificationStore.unreadCount > 0 ? `, ${notificationStore.unreadCount} unread` : ''}`"
                        title="Notifications"
                        class="p-2 border border-stone-200 text-stone-600 bg-stone-50"
                        variant="outline"
                      >
                        <UIcon :name="ICONS.NOTIFICATION" class="size-5" />
                      </base-button>
                      <span
                        v-if="notificationStore.unreadCount > 0"
                        class="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
                        aria-hidden="true"
                      >
                        {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
                      </span>
                    </div>
                    <template #content>
                      <notifications-notification-list @close="notificationOpen = false" />
                    </template>
                  </UPopover>

                  <base-button
                    class="p-2 border border-stone-200 text-stone-600 bg-stone-50"
                    variant="outline"
                    @click="handleSettingsClick"
                  >
                    <UIcon :name="ICONS.SETTINGS" class="size-5" />
                  </base-button>
                </div>
              </template>
            </UDashboardNavbar>
          </template>

          <template #body>
            <div class="min-w-0 max-w-full">
              <slot />
            </div>
          </template>
        </UDashboardPanel>
      </div>
    </UDashboardGroup>
  </main>
</template>
