<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from "vue";

import { useNotification } from "~/composables/use-notification";
import { ICONS } from "~/config/icons";
import { getInquiryStatusColor } from "~/config/inquiry-status";
import { useAnalyticsStore } from "~/stores/analytics";
import { useInquiriesStore } from "~/stores/inquiries";
import { formatDateTime } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

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
    header: "Company",
    cell: ({ row }: { row: any }) => row.original.company_name || "—",
  },
  {
    accessorKey: "contact_name",
    header: "Contact",
    cell: ({ row }: { row: any }) => row.original.contact_name || "—",
  },
  {
    accessorKey: "status_name",
    header: "Status",
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
    header: "Created",
    cell: ({ row }: { row: any }) => formatDateTime(row.original.created_at),
  },
];

// Computed KPI data from store
const kpiData = computed(() => [
  {
    title: "Total Communities",
    icon: ICONS.BUILDING,
    value: analyticsStore.analyticsStats.community_total_count,
    subtitle: "Communities currently managed in the system",
    link: { path: "/communities/list" },
  },
  {
    title: "Total Inquiries",
    icon: ICONS.INQUIRIES,
    value: analyticsStore.analyticsStats.inquiry_total_count,
    subtitle: "Leads and inquiries received across all channels",
    link: { path: "/inquiries" },
  },
  {
    title: "Total Invoiced",
    icon: ICONS.BILLING,
    value: analyticsStore.analyticsStats.total_invoiced,
    subtitle: "Total amount invoiced to all communities",
    link: { path: "/transaction/list" },
  },
  {
    title: "Total Paid",
    icon: ICONS.CHECK_CIRCLE,
    value: analyticsStore.analyticsStats.total_paid,
    subtitle: "Payments successfully received from communities",
    link: { path: "/transaction/payment" },
  },
]);
</script>

<template>
  <div class="w-full flex flex-col">
    <base-page-header>
      <template #title>
        Dashboard
      </template>
      <template #description>
        Overview of your system and recent activity.
      </template>
    </base-page-header>

    <div class="page-content-height bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6 space-y-6">
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
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <dashboard-kpi-card
          v-for="(kpi, index) in kpiData"
          :key="index"
          :title="kpi.title"
          :value="kpi.value"
          :subtitle="kpi.subtitle"
          :icon="kpi.icon"
          :link="kpi.link"
        />
      </div>

      <div class="border-t border-border pt-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
              <UIcon :name="ICONS.INQUIRIES" class="h-4 w-4 text-muted-foreground" />
              Recent Inquiries
            </h3>
            <p class="text-xs text-muted-foreground mt-0.5">
              Latest inquiries from your funnel.
            </p>
          </div>
          <NuxtLink to="/inquiries" class="shrink-0">
            <base-button
              variant="outline"
              size="sm"
              trailing-icon="i-lucide-arrow-right"
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
    </div>
  </div>
</template>
