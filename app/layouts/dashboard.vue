<script setup lang="ts">
import { ICONS } from "~/config/icons";

const router = useRouter();

function handleSettingsClick() {
  router.push({ name: "settings" });
}
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
                  <UPopover>
                    <base-button
                      class="p-2 border border-stone-200 text-stone-600 bg-stone-50"
                      variant="outline"
                    >
                      <UIcon :name="ICONS.NOTIFICATION" class="size-5" />
                    </base-button>
                    <template #content>
                      <Placeholder class="size-48 m-4 inline-flex" />
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
