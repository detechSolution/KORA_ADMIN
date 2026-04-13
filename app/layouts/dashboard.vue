<script setup lang="ts">
import { ICONS } from "~/config/icons";
</script>

<template>
  <main class="min-h-dvh">
    <UDashboardGroup unit="rem" class="p-2 gap-2">
      <LayoutSidebar />
      <div class="w-full bg-white dark:bg-background rounded-lg min-w-0">
        <UDashboardPanel
          id="default"
          :ui="{
            root: 'h-full min-h-(calc(100vh-1rem))',
            body: 'overflow-y-auto p-4',
          }"
        >
          <template #header>
            <UDashboardNavbar :ui="{ root: 'h-(--size-navbar) border-b border-border' }">
              <template #leading>
                <div class="flex items-center gap-3">
                  <UDashboardSidebarCollapse :icon="ICONS.SIDEBAR_TOGGLE" />
                </div>
              </template>

              <template #right>
                <UColorModeSwitch :ui="{ thumb: 'bg-background', icon: 'bg-foreground' }" />
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
