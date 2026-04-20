<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from "vue";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { getInquiryStatusColor } from "~/config/inquiry-status";
import { useAnalyticsStore } from "~/stores/analytics";
import { useInquiriesStore } from "~/stores/inquiries";
import { formatDateTime } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

const todaySessions = [
  {
    title: "Session 1",
    date: "2022-01-01",
    time: "10:00 AM",
    capacity: "2/10",
  },
  {
    title: "Session 2",
    date: "2022-01-02",
    time: "11:00 AM",
    capacity: "18/20",
  },
  {
    title: "Session 3",
    date: "2022-01-03",
    time: "12:00 PM",
    capacity: "26/30",
  },
  {
    title: "Session 3",
    date: "2022-01-03",
    time: "12:00 PM",
    capacity: "12/30",
  },
];

definePageMeta({
  auth: true,
  layout: "dashboard",
});

const { error: showError } = useNotification();
const analyticsStore = useAnalyticsStore();
const inquiriesStore = useInquiriesStore();
const inquiriesLoading = ref(false);
const analyticsLoading = ref(false);

async function getInquiriesData() {
  try {
    inquiriesLoading.value = true;
    await inquiriesStore.getInquiries({ page: 1, limit: 5 });
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load inquiries") });
  }
  finally {
    inquiriesLoading.value = false;
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

onMounted(() => {
  Promise.all([
    getAnalyticsData(),
    getInquiriesData(),
  ]);
});

const recentInquiries = computed(() => inquiriesStore.inquiries.data);

const recentInquiriesColumns = [
  {
    accessorKey: "company_name",
    header: "Booking ID",
    cell: ({ row }: { row: any }) => row.original.company_name || "—",
  },
  {
    accessorKey: "contact_name",
    header: "Client",
    cell: ({ row }: { row: any }) => row.original.contact_name || "—",
  },
  {
    accessorKey: "status_name",
    header: "Session/Service",
    cell: ({ row }: { row: any }) => {
      const inquiry = row.original;
      const statusId = Number(inquiry.status_id ?? 0);
      const label = inquiry.status_name || "—";
      const color = getInquiryStatusColor(statusId);
      return h(resolveComponent("base-badge"), { color }, () => label);
    },
  },
  {
    accessorKey: "created_at",
    header: "Type",
    cell: ({ row }: { row: any }) => formatDateTime(row.original.created_at),
  },
  {
    accessorKey: "created_at",
    header: "Booked Date",
    cell: ({ row }: { row: any }) => formatDateTime(row.original.created_at),
  },
  {
    accessorKey: "created_at",
    header: "Status",
    cell: ({ row }: { row: any }) => formatDateTime(row.original.created_at),
  },
];

// Computed KPI data from store
const kpiData = computed(() => [
  {
    title: "Today's Bookings",
    icon: ICONS.INQUIRIES,
    value: analyticsStore.analyticsStats.community_total_count,
    link: { path: "/communities/list" },
  },
  {
    title: "Today's Sessions",
    icon: ICONS.CALENDAR,
    value: analyticsStore.analyticsStats.inquiry_total_count,
    link: { path: "/inquiries" },
  },
  {
    title: "Total Members",
    icon: ICONS.USERS,
    value: analyticsStore.analyticsStats.total_invoiced,
    link: { path: "/transaction/list" },
  },
  {
    title: "Today's Revenue",
    icon: ICONS.CHART_LINE,
    value: analyticsStore.analyticsStats.total_paid,
    link: { path: "/transaction/payment" },
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
      <div v-if="analyticsLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-muted/50 border border-border rounded-lg p-6 animate-pulse"
        >
          <div class="h-4 bg-muted rounded w-24 mb-4" />
          <div class="h-8 bg-muted rounded w-32 mb-4" />
          <div class="h-3 bg-muted rounded w-40" />
        </div>
      </div>
      <div v-else class="grid bg-stone-50 rounded border border-border py-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-y-6 md:gap-y-8 gap-x-0">
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
          <NuxtLink to="/inquiries" class="shrink-0">
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
          :data="recentInquiries"
          :columns="recentInquiriesColumns"
          :loading="inquiriesLoading"
          :skeleton-rows="5"
          empty-title="No inquiries yet"
          empty-description="New inquiries will appear here once created."
        />
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
          :data="recentInquiries"
          :columns="recentInquiriesColumns"
          :loading="inquiriesLoading"
          :skeleton-rows="5"
          empty-title="No inquiries yet"
          empty-description="New inquiries will appear here once created."
        />
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
        <NuxtLink to="/inquiries" class="shrink-0">
          <base-button
            variant="outline"
            size="sm"
            :leading-icon="ICONS.ARROW_LEFT"
          >
            View all
          </base-button>
        </NuxtLink>
      </div>

      <div class="border-t border-border py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2">
        <dashboard-session-card
          v-for="(session, index) in todaySessions"
          :key="index"
          :title="session.title"
          :date="session.date"
          :time="session.time"
          :capacity="session.capacity"
        />
      </div>
    </div>
  </div>
</template>
