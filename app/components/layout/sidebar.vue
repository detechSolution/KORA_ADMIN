<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { RouteLocationRaw } from "vue-router";

import { computed, ref, watch } from "vue";

import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import {
  PERMISSIONS,
  PERMISSIONS_ADMINS,
  PERMISSIONS_COMMUNITIES,
  PERMISSIONS_CONFIGURATION,
  PERMISSIONS_TRANSACTIONS,
} from "~/config/permissions";
import { useAuthStore } from "~/stores/auth";

type NavItemWithPermission = NavigationMenuItem & { permission?: string; children?: NavItemWithPermission[] };

const authStore = useAuthStore();
const { can } = usePermission();
const route = useRoute();
const router = useRouter();
const isOpen = ref(false);
const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);

// Close mobile sidebar when route changes so overlay dismisses after navigation
watch(() => route.fullPath, () => {
  sidebarOpen.value = false;
});

function getFirstLetter(name: string): string {
  return name.charAt(0).toUpperCase() || "A";
}

function handleLogout(): void {
  authStore.logout();
  isOpen.value = false;
  router.push({ name: "login" });
}

function navigateTo(path: RouteLocationRaw): void {
  router.push(path);
  isOpen.value = false;
}

function isPathActive(to: string | RouteLocationRaw | undefined): boolean {
  if (to == null || typeof to !== "string")
    return false;
  const path = route.path;
  return path === to || path.startsWith(`${to}/`);
}

function filterByPermission(items: NavItemWithPermission[]): NavigationMenuItem[] {
  return items
    .filter((item) => {
      if (item.permission && !can(item.permission))
        return false;
      const childItems = item.children;
      if (childItems?.length) {
        const filteredChildren = filterByPermission(childItems);
        return filteredChildren.length > 0;
      }
      return true;
    })
    .map((item) => {
      const { permission: _p, children, ...rest } = item;
      const out: NavigationMenuItem = { ...rest };
      if (children?.length) {
        const filteredChildren = filterByPermission(children);
        (out as NavigationMenuItem & { children?: NavigationMenuItem[] }).children = filteredChildren;
        (out as NavigationMenuItem & { onSelect?: (e: Event) => void }).onSelect = () => {
          if (sidebarCollapsed.value)
            sidebarCollapsed.value = false;
        };
        const childActive = filteredChildren.some(
          c => isPathActive((c as { to?: string }).to),
        );
        if (childActive && sidebarCollapsed.value)
          (out as NavigationMenuItem & { active?: boolean }).active = true;
      }
      return out;
    });
}

const rawItems: NavItemWithPermission[] = [{
  label: "Dashboard",
  icon: ICONS.DASHBOARD,
  to: "/",
  // No permission: always visible for authenticated users
}, {
  label: "Administrators",
  icon: ICONS.SHIELD_CHECK,
  defaultOpen: true,
  children: [
    { label: "Roles & Permissions", to: "/system-admin/roles-permissions", permission: PERMISSIONS_ADMINS.ROLES_PERMISSIONS },
    { label: "List", to: "/system-admin/admins", permission: PERMISSIONS_ADMINS.LIST },
  ],
}, {
  label: "Inquiries",
  icon: ICONS.INQUIRIES,
  to: "/inquiries",
  permission: PERMISSIONS.INQUIRIES,
}, {
  label: "Communities",
  icon: ICONS.COMMUNITIES,
  defaultOpen: true,
  children: [
    { label: "Create", to: "/communities/create", permission: PERMISSIONS_COMMUNITIES.CREATE },
    { label: "List", to: "/communities/list", permission: PERMISSIONS_COMMUNITIES.VIEW },
  ],
}, {
  label: "Transactions",
  icon: ICONS.BILLING,
  defaultOpen: true,
  children: [
    { label: "Create", to: "/transaction/create", permission: PERMISSIONS_TRANSACTIONS.CREATE },
    { label: "List", to: "/transaction/list", permission: PERMISSIONS_TRANSACTIONS.LIST },
    { label: "Payment", to: "/transaction/payment", permission: PERMISSIONS_TRANSACTIONS.PAYMENT },
  ],
}, {
  label: "Reports",
  icon: ICONS.REPORTS,
  to: "/reports",
  permission: PERMISSIONS.REPORTS,
}, {
  label: "Configurations",
  icon: ICONS.CONFIGURATION,
  defaultOpen: true,
  children: [
    { label: "Subscription Plans", to: "/configuration/subscription-plans", permission: PERMISSIONS_CONFIGURATION.PLANS },
    { label: "Billable Items", to: "/configuration/billable-items", permission: PERMISSIONS_CONFIGURATION.BILLABLE_ITEMS },
    { label: "Discount Coupons", to: "/configuration/coupons", permission: PERMISSIONS_CONFIGURATION.COUPONS },
    { label: "Payment Methods", to: "/configuration/payment-methods", permission: PERMISSIONS_CONFIGURATION.PAYMENT_METHODS },
  ],
}];

const items = computed(() => [filterByPermission([...rawItems])]);
</script>

<template>
  <UDashboardSidebar
    v-model:open="sidebarOpen"
    v-model:collapsed="sidebarCollapsed"
    collapsible
    toggle-side="right"
    :ui="{ header: 'pr-2 sm:px-4 h-(--size-navbar)', content: 'overflow-hidden max-w-(--size-sidebar-mobile)', body: 'p-2 sm:p-2', root: 'border-0 min-w-(--size-sidebar-mini) min-h-(calc(100vh-1rem))', footer: 'p-2 sm:p-2' }"
  >
    <template #toggle>
      <UDashboardSidebarToggle variant="subtle" />
    </template>
    <template #header="{ collapsed }">
      <div class="flex items-center gap-3 w-full">
        <img
          src="/logo.png"
          alt="Baha Connect"
          class="w-5 h-5"
        >
        <h1 v-if="!collapsed" class="text-md font-medium">
          Baha Connect
        </h1>
      </div>
    </template>
    <template #default="{ collapsed }">
      <UNavigationMenu
        class="sidebar-nav"
        :collapsed="collapsed"
        :items="items[0]"
        orientation="vertical"
        tooltip
        :ui="{
          list: 'flex flex-col gap-1',
          link: 'px-2 gap-3 text-foreground rounded-md hover:bg-primary/10 transition-colors',
          linkLeadingIcon: 'text-foreground',
          linkTrailingIcon: 'text-foreground',
        }"
      />
    </template>
    <template #footer="{ collapsed }">
      <UPopover
        v-model:open="isOpen"
        dismissible
        :popper="{ placement: collapsed ? 'right-start' : 'top-end' }"
      >
        <div class="flex items-center w-full gap-3 cursor-pointer">
          <UAvatar
            :text="getFirstLetter(authStore.user.name)"
            :ui="{
              root: 'bg-primary rounded-lg text-lg',
              fallback: 'text-white!',
            }"
          />
          <div v-if="!collapsed" class="flex justify-between w-full items-center gap-3">
            <div class="flex flex-col gap-0">
              <span class="text-sm font-medium">
                {{ authStore.user.name || 'N/A' }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ authStore.user.email || 'N/A' }}
              </span>
            </div>
            <UIcon :name="ICONS.ELLIPSIS_VERTICAL" />
          </div>
        </div>
        <template #content>
          <div class="min-w-[200px] bg-card rounded-lg shadow-lg">
            <div class="flex items-center gap-3 p-3 border-b border-border">
              <UAvatar
                :text="getFirstLetter(authStore.user.name)"
                :ui="{
                  root: 'bg-primary rounded-lg text-md',
                  fallback: 'text-white!',
                }"
              />
              <div class="flex flex-col gap-0">
                <span class="text-sm font-medium">
                  {{ authStore.user.name || 'N/A' }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ authStore.user.email || 'N/A' }}
                </span>
              </div>
            </div>
            <div
              class="flex items-center gap-2 p-1 cursor-pointer"
              @click="navigateTo({ name: 'settings' })"
            >
              <div class="flex items-center gap-2 p-1 hover:bg-muted w-full rounded-md">
                <UIcon :name="ICONS.SETTINGS" class="w-4 h-4" />
                <span class="text-sm">Settings</span>
              </div>
            </div>
            <div
              class="flex items-center gap-2 p-1 cursor-pointer border-t border-border"
              @click="handleLogout"
            >
              <div class="flex items-center gap-2 p-1 hover:bg-red-600/10 w-full rounded-md">
                <UIcon :name="ICONS.LOGOUT" class="w-4 h-4 text-red-500" />
                <span class="text-sm text-red-500">Sign out</span>
              </div>
            </div>
          </div>
        </template>
      </UPopover>
    </template>
  </UDashboardSidebar>
</template>
