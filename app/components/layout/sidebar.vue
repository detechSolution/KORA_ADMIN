<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { RouteLocationRaw } from "vue-router";

import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import {
  PERMISSIONS_ADMINISTRATION,
  PERMISSIONS_BOOKINGS,
  PERMISSIONS_INSTRUCTORS,
  PERMISSIONS_KORA_PASSES,
  PERMISSIONS_MAILS,
  PERMISSIONS_MEMBERS,
  PERMISSIONS_MEMBERSHIP_PLANS,
  PERMISSIONS_PAYMENTS,
  PERMISSIONS_PROMO_CODES,
  PERMISSIONS_REFUNDS,
  PERMISSIONS_SESSIONS,
  PERMISSIONS_SPA,
} from "~/config/permissions";
import { useAnalyticsStore } from "~/stores/analytics";
import { useAuthStore } from "~/stores/auth";

type NavItemWithPermission = NavigationMenuItem & { permission?: string; children?: NavItemWithPermission[] };

const authStore = useAuthStore();
const analyticsStore = useAnalyticsStore();
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

function getNavBadge(to: RouteLocationRaw | undefined, label?: string): NavigationMenuItem["badge"] {
  const stats = analyticsStore.analyticsStats;

  if (label === "Financial") {
    const count = (stats.unreadPayments || 0) + (stats.unreadCancellations || 0);
    if (!count)
      return undefined;

    return {
      color: "error",
      variant: "solid",
      square: true,
      class: "size-2 min-w-2 rounded-full p-0 group-data-[state=open]:hidden",
    };
  }

  if (typeof to !== "string")
    return undefined;

  const countByPath: Record<string, number> = {
    "/bookings/bookings-list": stats.unreadBookings,
    "/financial/payments": stats.unreadPayments,
    "/financial/cancellations": stats.unreadCancellations,
  };
  const count = countByPath[to];

  if (!count)
    return undefined;

  return {
    label: count > 99 ? "99+" : count,
    color: "neutral",
    variant: "outline",
    size: "sm",
    class: "min-w-5 font-medium justify-center px-2 py-1",
  };
}

function filterByPermission(items: NavItemWithPermission[], collapsed = false): NavigationMenuItem[] {
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

      const badge = getNavBadge(item.to, item.label);
      if (badge !== undefined)
        out.badge = badge;

      if (children?.length) {
        const filteredChildren = filterByPermission(children, collapsed);
        (out as NavigationMenuItem & { children?: NavigationMenuItem[] }).children = filteredChildren;
        (out as NavigationMenuItem & { onSelect?: (e: Event) => void }).onSelect = () => {
          if (sidebarCollapsed.value)
            sidebarCollapsed.value = false;
        };
        const childActive = filteredChildren.some(
          c => isPathActive((c as { to?: string }).to),
        );
        if (childActive) {
          (out as NavigationMenuItem & { active?: boolean }).active = true;
          // Keep the section expanded when a nested page is opened directly
          // or the browser is refreshed on that route.
          (out as NavigationMenuItem & { defaultOpen?: boolean }).defaultOpen = true;
        }
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
  label: "Offerings",
  icon: ICONS.BRIEFCASE,
  defaultOpen: false,
  children: [
    { label: "Sessions", to: "/offerings/session", icon: ICONS.CALENDAR, permission: PERMISSIONS_SESSIONS.VIEW },
    { label: "Spa", to: "/offerings/spa", icon: ICONS.FLOWER, permission: PERMISSIONS_SPA.VIEW },
    { label: "Kora Passes", to: "/offerings/kora-passes", icon: ICONS.ID_CARD, permission: PERMISSIONS_KORA_PASSES.VIEW },
  ],
}, {
  label: "Bookings",
  icon: ICONS.INQUIRIES,
  to: "/bookings/bookings-list",
  permission: PERMISSIONS_BOOKINGS.VIEW,
}, {
  label: "Members",
  icon: ICONS.AWARD,
  defaultOpen: false,
  children: [
    { label: "Members & Guests", to: "/members/members-list", icon: ICONS.USERS, permission: PERMISSIONS_MEMBERS.VIEW },
    { label: "Membership Plans", to: "/members/plans", icon: ICONS.BADGE_CHECK, permission: PERMISSIONS_MEMBERSHIP_PLANS.VIEW },
  ],
}, {
  label: "Financial",
  icon: ICONS.BILLING,
  defaultOpen: false,
  children: [
    { label: "Payments", to: "/financial/payments", icon: ICONS.CREDIT_CARD, permission: PERMISSIONS_PAYMENTS.VIEW },
    { label: "Cancellations", to: "/financial/cancellations", icon: ICONS.REFRESH_CW, permission: PERMISSIONS_REFUNDS.MANAGE },
  ],
},
//  {
//   label: "Access Logs",
//   icon: ICONS.DOOR_LOCK,
//   to: "/access-log",
//   defaultOpen: true,
// },
{
  label: "Access Control",
  icon: ICONS.DOOR_LOCK,
  defaultOpen: false,
  children: [
    { label: "Access Cards", to: "/access-control/access-cards", icon: ICONS.CARD },
    { label: "Access Logs", to: "/access-control/access-logs", icon: ICONS.FILE_KEY },
  ],
}, {
  label: "Instructors",
  icon: ICONS.USER_STAR,
  to: "/instructors/instructors-list",
  permission: PERMISSIONS_INSTRUCTORS.VIEW,
  defaultOpen: true,
}, {
  label: "Promo Code",
  icon: ICONS.BADGE_PERCENT,
  to: "/promo-code/list",
  permission: PERMISSIONS_PROMO_CODES.VIEW,
  defaultOpen: true,
}, {
  label: "Send Email",
  icon: ICONS.MAILS,
  to: "/send-email/email-list",
  permission: PERMISSIONS_MAILS.VIEW,
  defaultOpen: true,
}, {
  label: "Administration",
  icon: ICONS.SHIELD_CHECK,
  defaultOpen: false,
  children: [
    { label: "Roles & Permissions", to: "/administration/roles", icon: ICONS.SETTINGS, permission: PERMISSIONS_ADMINISTRATION.ROLES_VIEW },
    { label: "Admins", to: "/administration/admins", icon: ICONS.USER_COG, permission: PERMISSIONS_ADMINISTRATION.ADMINS_VIEW },
  ],
}];

const items = computed(() => [filterByPermission([...rawItems], sidebarCollapsed.value)]);

onMounted(() => {
  analyticsStore.getAnalyticsStats();
});
</script>

<template>
  <UDashboardSidebar
    v-model:collapsed="sidebarCollapsed"
    :open="sidebarOpen"
    collapsible
    toggle-side="right"
    :ui="{
      header: 'pr-2 sm:px-4 h-(--size-navbar)',
      content: 'overflow-hidden max-w-(--size-sidebar-mobile)',
      body: 'p-2',
      root: 'border-stone-200 border-r min-w-(--size-sidebar-mini) min-h-(calc(100vh-1rem)) bg-white',
      footer: 'p-2 sm:p-2',

    }"
  >
    <template #toggle>
      <UDashboardSidebarToggle variant="subtle" />
    </template>
    <template #header="{ collapsed }">
      <div class="flex items-center gap-3 w-full">
        <img
          v-if="collapsed"
          src="/logo/black_icon_logo.svg"
          alt="Baha Connect"
          class="w-28 h-28 transition-all duration-100 ease"
        >
        <img
          v-else
          src="/logo/kora_black_logo.svg"
          alt="Baha Connect"
          class="w-28 h-28 transition-all duration-100 ease"
        >
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
          list: 'flex flex-col gap-2',
          link: 'px-2 gap-3 text-foreground rounded-md transition-colors hover:bg-stone-50',
          linkLeadingIcon: 'text-foreground ',
          linkTrailingIcon: 'text-foreground ',
          item: 'flex flex-col gap-2',
        }"
      />
    </template>
    <template #footer="{ collapsed }">
      <UPopover
        v-model:open="isOpen"
        dismissible
        :popper="{ placement: collapsed ? 'right-start' : 'top-end' }"
      >
        <div
          class="flex items-center w-full gap-3 mb-2 cursor-pointer"
          :class="[
            collapsed
              ? 'p-0 border-0'
              : 'p-2 border rounded border-stone-200',
          ]"
        >
          <UAvatar
            :text="getFirstLetter(authStore.user.name)"
            :ui="{
              root: 'bg-primary rounded-lg text-lg',
              fallback: 'text-white!',
            }"
          />
          <div v-if="!collapsed" class="flex justify-between w-full items-start gap-3">
            <div class="flex flex-col gap-0 ">
              <span class="text-sm font-medium">
                {{ authStore.user.name || 'N/A' }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ authStore.user.email || 'N/A' }}
              </span>
            </div>
            <!-- <UIcon :name="ICONS.ELLIPSIS_VERTICAL" /> -->
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
