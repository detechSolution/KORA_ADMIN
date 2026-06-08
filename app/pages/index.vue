<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { Booking } from "~/types/booking";

import { useChartColors } from "~/composables/use-chart-colors";
import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { useAnalyticsStore } from "~/stores/analytics";
import { useBookingStore } from "~/stores/booking";
import { useSessionsStore } from "~/stores/sessions";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
});

const bookingsStore = useBookingStore();
const analyticsStore = useAnalyticsStore();
const sessionStore = useSessionsStore();

const { error: showError } = useNotification();
const bookingsLoading = ref(false);
const analyticsLoading = ref(false);
const sessionsLoading = ref(false);
const bookingsBySessionsLoading = ref(false);
const revenueTrendLoading = ref(false);
const consistentMembersLoading = ref(false);

const analyticsData = computed(() => analyticsStore.analyticsStats);
const recentBookings = computed(() => bookingsStore.bookings.data as any[]);
const todaySessions = computed(() => sessionStore.sessions.data);
const bookingsBySessions = ref<any>(null);
const revenueTrend = ref<any>(null);
const consistentMembers = ref<any>(null);

async function getRecentBookings() {
  try {
    bookingsLoading.value = true;
    const params = {
      page: 1,
      limit: 5,
    };
    await bookingsStore.getBookings(params);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load inquiries") });
  }
  finally {
    bookingsLoading.value = false;
  }
}

async function getAnalyticsData() {
  try {
    analyticsLoading.value = true;
    await analyticsStore.getAnalyticsStats();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load analytics") });
  }
  finally {
    analyticsLoading.value = false;
  }
}

async function getTodaySessions() {
  try {
    sessionsLoading.value = true;
    const params = {
      page: 1,
      limit: 5,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    };
    await sessionStore.getSessions(params);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load sessions") });
  }
  finally {
    sessionsLoading.value = false;
  }
}

async function getBookingsBySessions() {
  try {
    bookingsBySessionsLoading.value = true;
    const res = await analyticsStore.getBookingsBySessions();
    bookingsBySessions.value = res;
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load analytics") });
  }
  finally {
    bookingsBySessionsLoading.value = false;
  }
}

async function getRevenueTrend() {
  try {
    revenueTrendLoading.value = true;
    const res = await analyticsStore.getRevenueTrend();
    revenueTrend.value = res;
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load analytics") });
  }
  finally {
    revenueTrendLoading.value = false;
  }
}

async function getConsistentMembers() {
  try {
    consistentMembersLoading.value = true;
    const res = await analyticsStore.getConsistentMembers();
    consistentMembers.value = res.data;
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load analytics") });
  }
  finally {
    consistentMembersLoading.value = false;
  }
}

const { revenueCategories: RevenueCategoriesMultple } = useChartColors();

onMounted(() => {
  Promise.all([
    getAnalyticsData(),
    getRecentBookings(),
    getTodaySessions(),
    getBookingsBySessions(),
    getRevenueTrend(),
    getConsistentMembers(),
  ]);
});

const recentBookingsColumns = [
  { accessorKey: "bookingCode", header: "Booking ID" },
  { accessorKey: "client", header: "Client" },
  { accessorKey: "itemName", header: "Session/Service" },
  { accessorKey: "itemType", header: "Type" },
  {
    accessorKey: "bookedFor",
    header: "Booked Date",
    accessorFn: (row: Booking) => formatDate(row.bookedFor),
  },
  { accessorKey: "status", header: "Status" },
];

const consistentMembersColumns = [
  { accessorKey: "member", header: "Member" },
  { accessorKey: "phoneNumber", header: "Phone" },
  { accessorKey: "bookingCount", header: "Bookings Count" },
  { accessorKey: "attendedBookings", header: "Attended Bookings" },
];

// Computed KPI data from store
const kpiData = computed(() => [
  {
    title: "Today's Bookings",
    icon: ICONS.INQUIRIES,
    value: analyticsData.value.todayBookings,
    link: { path: "/bookings/bookings-list" },
  },
  {
    title: "Today's Sessions",
    icon: ICONS.CALENDAR,
    value: analyticsData.value.todaySessions,
    link: { path: "/offerings/session" },
  },
  {
    title: "Total Members",
    icon: ICONS.USERS,
    value: analyticsData.value.totalMembers,
    link: { path: "/members/members-list" },
  },
  {
    title: "Today's Revenue",
    icon: ICONS.CHART_LINE,
    value: analyticsData.value.todayRevenue,
    link: { path: "/financial/payments" },
  },
]);
</script>

<template>
  <div class="w-full gap-6 flex flex-col">
    <base-page-header>
      <template #title>
        Dashboard
      </template>
      <template #description>
        Overview of today's activity and recent bookings
      </template>
    </base-page-header>

    <div class="page-content-height bg-card  rounded-xl shadow-sm p-6 space-y-6">
      <div class="grid bg-stone-50 rounded border border-border py-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-y-6 md:gap-y-8 gap-x-0">
        <dashboard-kpi-card
          v-for="(kpi, index) in kpiData"
          :key="index"
          class="px-6 border-border"
          :class="[
            index % 2 === 0 ? 'md:border-r' : 'md:border-r-0',
            index !== 3 ? 'xl:border-r' : 'xl:border-r-0',
          ]"
          :title="kpi.title"
          :value="kpi.value"
          :icon="kpi.icon"
          :link="kpi.link"
        />
      </div>

      <!-- Recent Bookings -->
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 class="text-base font-semibold text-secondary flex items-center gap-2">
              <UIcon :name="ICONS.INQUIRIES" class="h-4 w-4 text-primary-700" />
              Recent Bookings
            </h3>
            <p class="text-xs font-normal text-secondary-300 mt-0.5">
              Latest bookings from today.
            </p>
          </div>
          <NuxtLink to="/bookings/bookings-list" class="shrink-0">
            <base-button
              variant="outline"
              size="sm"
              :leading-icon="ICONS.ARROW_LEFT"
            >
              View all
            </base-button>
          </NuxtLink>
        </div>
        <base-table
          :data="recentBookings"
          :columns="recentBookingsColumns"
          :loading="bookingsLoading"
          :skeleton-rows="5"
          empty-title="No bookings yet"
        >
          <template #bookingCode-cell="{ row }">
            <base-badge uppercase>
              {{ row.original.bookingCode }}
            </base-badge>
          </template>

          <template #client-cell="{ row }">
            <div class="flex items-center gap-2">
              <base-avatar
                :src="row.original.clientName"
                :alt="row.original.clientName || 'Unknown'"
                size="sm"
              />
              <div class="flex flex-col gap-1">
                <div class="flex flex-row gap-2 items-center">
                  <span class="text-sm font-medium text-secondary">
                    {{ row.original.clientName || "-" }}
                  </span>

                  <UTooltip
                    v-if="row.original.visitorCount"
                    arrow
                    :text="`${row.original.visitorCount} Visitors`"
                  >
                    <span
                      class="text-xs bg-red-50 border border-red-300 px-1 rounded-full text-red-500"
                    >
                      +  {{ row.original.visitorCount }}
                    </span>
                  </UTooltip>
                </div>
                <span class="text-xs text-secondary-400">
                  {{ row.original.clientEmail || "-" }}
                </span>
              </div>
            </div>
          </template>

          <template #itemType-cell="{ row }">
            <base-badge :status="row.original.itemType">
              {{ row.original.itemType }}
            </base-badge>
          </template>

          <template #status-cell="{ row }">
            <base-badge :status="row.original.status">
              {{ row.original.status }}
            </base-badge>
          </template>
        </base-table>
      </div>

      <!-- Consistent Members -->
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 class="text-base font-semibold text-secondary flex items-center gap-2">
              <UIcon :name="ICONS.USERS" class="h-4 w-4 text-primary-700" />
              Consistent Members
            </h3>
            <p class="text-xs font-normal text-secondary-300 mt-0.5">
              Top consistent members
            </p>
          </div>
        </div>

        <base-table
          :data="consistentMembers"
          :columns="consistentMembersColumns"
          :loading="consistentMembersLoading"
          :skeleton-rows="5"
          empty-title="No consistent members yet"
        >
          <template #member-cell="{ row }">
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium text-secondary">
                {{ row.original.fullName || "-" }}
              </span>
              <span class="text-xs text-secondary-400">
                {{ row.original.email || "-" }}
              </span>
            </div>
          </template>

          <template #totalBookings-cell="{ row }">
            <base-badge uppercase>
              {{ row.original.bookingCount }}
            </base-badge>
          </template>

          <template #attendedBookings-cell="{ row }">
            {{ row.original.attendedBookings }}
          </template>
        </base-table>
      </div>
    </div>

    <div class="bg-card  rounded-xl shadow-sm p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 class="text-base font-semibold text-secondary flex items-center gap-2">
            <UIcon :name="ICONS.CALENDAR" class="h-4 w-4 text-primary-700" />
            Today's Sessions
          </h3>
          <p class="text-xs font-normal text-secondary-300 mt-0.5">
            Active sessions scheduled for today
          </p>
        </div>
        <NuxtLink to="/offerings/session" class="shrink-0">
          <base-button
            variant="outline"
            size="sm"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            View all
          </base-button>
        </NuxtLink>
      </div>

      <div class="border-t h-fit border-border py-4 flex overflow-x-auto  gap-2">
        <div
          v-if="todaySessions.length === 0"
          class="flex justify-center items-center w-full"
        >
          <base-empty
            title="No sessions scheduled for today"
          />
        </div>

        <dashboard-session-card
          v-for="(session, index) in todaySessions"
          v-else
          :key="index"
          :title="session.name"
          :capacity="session.capacity"
          :starts-at="session.startsAt"
          :occupied="session.occupied"
        />
      </div>
    </div>

    <div class="flex flex-col gap-6 md:flex-row justify-between">
      <!-- sessions chart -->
      <div class="bg-white rounded-xl shadow-sm flex-1 min-w-0">
        <div class="flex flex-col gap-1 p-6">
          <div class="flex items-center gap-2">
            <UIcon :name="ICONS.CALENDAR" class="h-4 w-4 text-primary-700" />
            <h2 class="text-secondary font-semibold">
              Bookings by Sessions
            </h2>
          </div>
          <p class="text-xs font-normal text-secondary-300 mt-0.5">
            Booking volume split by sessions
          </p>
        </div>
        <USeparator />
        <dashboard-bar-chart :data="bookingsBySessions" />
        <USeparator />
        <div v-if="bookingsBySessions?.series?.length" class="flex items-center justify-between p-6">
          <div class="flex items-center gap-4">
            <div
              v-for="(cat, key) in RevenueCategoriesMultple"
              :key="key"
              class="flex items-center gap-1.5"
            >
              <span
                class="h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: cat?.color }"
              />
              <span class="text-xs text-muted-foreground">{{ cat?.name }}</span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-muted-foreground">
              7-Day Total
            </p>
            <p class="text-lg font-semibold text-secondary">
              {{ bookingsBySessions?.totalBookings }} Bookings
            </p>
          </div>
        </div>
      </div>

      <!-- Revenue Trend -->
      <div class="bg-white rounded-xl shadow-sm flex-1 min-w-0">
        <div class="flex flex-col gap-1 p-6">
          <div class="flex items-center gap-2">
            <UIcon :name="ICONS.CALENDAR" class="h-4 w-4 text-primary-700" />
            <h2 class="text-secondary font-semibold">
              Revenue Trend
            </h2>
          </div>
          <p class="text-xs font-normal text-secondary-300 mt-0.5">
            Track peak earning days at a glance
          </p>
        </div>
        <USeparator />
        <dashboard-area-chart :data="revenueTrend" show-title />
        <USeparator />

        <div v-if="revenueTrend" class="flex items-center justify-between p-6">
          <div class="text-right">
            <p class="text-xs text-muted-foreground">
              7-Day Total
            </p>
            <p class="text-lg font-semibold text-secondary">
              Rs. {{ revenueTrend.totalRevenue }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-muted-foreground">
              Peak Day
            </p>
            <p class="text-lg font-semibold text-secondary">
              {{ revenueTrend.peakDay?.label }} - Rs. {{ revenueTrend.peakDay?.amount }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-muted-foreground">
              Today vs Avg
            </p>
            <p class="text-lg font-semibold text-secondary">
              {{ revenueTrend.todayVsAveragePercent }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
