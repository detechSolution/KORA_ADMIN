<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";

import type { Notification } from "~/stores/notification";

import { ICONS } from "~/config/icons";
import { useNotificationStore } from "~/stores/notification";

const notificationStore = useNotificationStore();
const { notifications, unreadCount, loading } = storeToRefs(notificationStore);

const pageSize = 10;
const activeTab = ref<"read" | "unread">("unread");
const loadingMore = ref(false);

const tabItems = [
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
] as const;

const hasUnread = computed(() => unreadCount.value > 0);
const currentPage = computed(() => notifications.value.meta?.page ?? 1);
const totalNotifications = computed(() => notifications.value.meta?.total ?? 0);
const loadedNotifications = computed(() => notifications.value.data?.length ?? 0);
const initialLoading = computed(() => loading.value && !loadingMore.value && loadedNotifications.value === 0);

const queryParams = computed(() => ({
  page: currentPage.value,
  limit: pageSize,
  ...(activeTab.value === "unread" ? { unreadOnly: "unread" as const } : {}),
}));

const visibleNotifications = computed(() => {
  const data = notifications.value.data ?? [];

  if (activeTab.value === "unread")
    return data.filter(item => !isNotificationRead(item));

  return data;
});

const groupedNotifications = computed(() => {
  const groups = [
    { label: "Today", items: [] as Notification[] },
    { label: "Yesterday", items: [] as Notification[] },
    { label: "Last week", items: [] as Notification[] },
    { label: "Older", items: [] as Notification[] },
  ];

  visibleNotifications.value.forEach((item) => {
    const group = groups.find(group => group.label === getDateGroup(item.createdAt));
    group?.items.push(item);
  });

  return groups.filter(group => group.items.length > 0);
});

const hasMoreNotifications = computed(() => loadedNotifications.value < totalNotifications.value);

onMounted(async () => {
  await Promise.all([
    fetchFirstPage(),
    notificationStore.fetchUnreadCount(),
  ]);
});

watch(activeTab, async () => {
  await fetchFirstPage();
});

async function fetchFirstPage() {
  await notificationStore.fetchNotifications({
    ...queryParams.value,
    page: 1,
  });
}

function isNotificationRead(item: Notification): boolean {
  return Boolean(item.read ?? item.isRead);
}

function getNotificationBody(item: Notification): string {
  return String(item.body ?? item.message ?? "");
}

function getDateGroup(dateStr: string): string {
  if (!dateStr)
    return "Older";

  const now = new Date();
  const date = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notificationDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDay = Math.floor((today.getTime() - notificationDay.getTime()) / 86400000);

  if (diffDay <= 0)
    return "Today";
  if (diffDay === 1)
    return "Yesterday";
  if (diffDay < 7)
    return "Last week";
  return "Older";
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr)
    return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1)
    return "Just now";
  if (diffMin < 60)
    return `${diffMin} min ago`;
  if (diffHr < 24)
    return `${diffHr} hr ago`;
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function formatNotificationTime(dateStr: string): string {
  if (getDateGroup(dateStr) === "Today")
    return formatTimeAgo(dateStr);

  return new Date(dateStr).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

async function handleMarkAsRead(id: number) {
  await notificationStore.markAsRead(id);
}

async function handleNotificationClick(item: Notification) {
  if (!isNotificationRead(item)) {
    handleMarkAsRead(item.id);
  }

  if (item.type === "booking_created" && item.payload) {
    const query: Record<string, string> = {};
    if (item.payload.memberName)
      query.search = item.payload.memberName;
    if (item.payload.bookedFor)
      query.bookedDate = item.payload.bookedFor.split("T")[0];
    await navigateTo({ path: "/bookings/bookings-list", query });
    return;
  }
  else if (item.type === "cancellation_request_created" && item.payload) {
    const query: Record<string, string> = {};
    if (item.payload.bookingCode)
      query.search = item.payload.bookingCode;
    await navigateTo({ path: "/financial/cancellations", query });
    return;
  }

  if (item.targetUrl) {
    await navigateTo(item.targetUrl);
  }
}

async function handleMarkAllAsRead() {
  await notificationStore.markAllAsRead();
}

async function handleLoadMore() {
  if (loadingMore.value || !hasMoreNotifications.value)
    return;

  loadingMore.value = true;
  try {
    await notificationStore.fetchNotifications(
      {
        ...queryParams.value,
        page: currentPage.value + 1,
      },
      { append: true },
    );
  }
  finally {
    loadingMore.value = false;
  }
}
</script>

<template>
  <div class="flex w-[400px] max-w-[100vw] flex-col overflow-hidden rounded-lg border border-stone-200 bg-white text-stone-950 shadow-lg">
    <div class="flex items-center justify-between border-b border-stone-200 px-2 py-2">
      <h3 class="text-sm font-semibold leading-6 text-stone-950">
        All notifications
      </h3>

      <button
        type="button"
        class="flex size-8 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-950"
        aria-label="Notification settings"
      >
        <UIcon :name="ICONS.SETTINGS" class="size-4" />
      </button>
    </div>

    <div class="flex items-center justify-between px-2 py-3">
      <div class="flex items-center gap-4">
        <button
          v-for="tab in tabItems"
          :key="tab.value"
          type="button"
          class="text-sm font-medium leading-5 transition-colors cursor-pointer"
          :class="activeTab === tab.value ? 'text-stone-950' : 'text-stone-400 hover:text-stone-700'"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <button
        v-if="hasUnread"
        type="button"
        class="text-sm font-medium leading-5 text-stone-600 transition-colors hover:text-stone-950"
        @click="handleMarkAllAsRead"
      >
        Mark all as read
      </button>
    </div>

    <div v-if="initialLoading" class="flex flex-col items-center justify-center gap-2 py-10">
      <UIcon :name="ICONS.LOADING" class="size-6 animate-spin text-stone-400" />
      <span class="text-xs font-medium text-stone-500">Loading notifications...</span>
    </div>

    <div v-else-if="!visibleNotifications.length" class="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div class="mb-3 flex size-12 items-center justify-center rounded-full bg-stone-100">
        <UIcon :name="ICONS.NOTIFICATION" class="size-6 text-stone-400" />
      </div>
      <p class="text-sm font-medium text-stone-950">
        No notifications yet
      </p>
      <p class="mt-1 text-xs text-stone-500">
        We'll let you know when something arrives.
      </p>
    </div>

    <div v-else class="max-h-[560px] overflow-y-auto px-2 pb-4">
      <section
        v-for="group in groupedNotifications"
        :key="group.label"
        class="pt-4 first:pt-3"
      >
        <h4 class="mb-2 text-sm font-medium leading-5 text-stone-950">
          {{ group.label }}
        </h4>

        <div class="flex flex-col divide-y divide-stone-200">
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="group flex w-full items-start gap-4 py-4 text-left transition-colors hover:bg-stone-50"
            :class="{ 'cursor-default': isNotificationRead(item) && !item.targetUrl }"
            @click="handleNotificationClick(item)"
          >
            <div class="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-700">
              <UIcon :name="ICONS.NOTIFICATION" class="size-5" />
            </div>

            <div class="min-w-0 flex-1 pt-1">
              <p class="truncate text-sm font-semibold leading-5 text-stone-950">
                {{ item.title }}
              </p>
              <p class="line-clamp-4 text-xs leading-5 text-stone-800">
                {{ getNotificationBody(item) }}
              </p>
            </div>

            <time class="shrink-0 pt-1 text-sm font-medium leading-5 text-stone-800">
              {{ formatNotificationTime(item.createdAt) }}
            </time>
          </button>
        </div>
      </section>

      <div
        v-if="hasMoreNotifications"
        class="flex justify-center pt-5"
      >
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-medium leading-5 text-stone-800 transition-colors hover:bg-stone-200 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loadingMore"
          @click="handleLoadMore"
        >
          <UIcon
            v-if="loadingMore"
            :name="ICONS.LOADING"
            class="size-4 animate-spin"
          />
          {{ loadingMore ? "Loading..." : "Load more" }}
        </button>
      </div>
    </div>
  </div>
</template>
