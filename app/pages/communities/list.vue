<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_COMMUNITIES } from "~/config/permissions";
import { getSubscriptionStatusConfig } from "~/config/subscription-status";
import { useCommunitiesStore } from "~/stores/communities";
import { formatDateTime } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

/** Returns remaining days from today to endDate (negative if past). endDate: ISO string or YYYY-MM-DD. */
function getRemainingDays(endDate: string | null | undefined): number | null {
  if (!endDate)
    return null;
  const end = new Date(String(endDate));
  if (Number.isNaN(end.getTime()))
    return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getRemainingDaysBadge(remainingDays: number | null): { label: string; color: "emerald" | "amber" | "red" | "muted" } {
  if (remainingDays === null)
    return { label: "N/A", color: "muted" };
  if (remainingDays < 0)
    return { label: "Expired", color: "red" };
  if (remainingDays === 0)
    return { label: "Expires today", color: "amber" };
  if (remainingDays <= 30)
    return { label: `${remainingDays} day${remainingDays === 1 ? "" : "s"} left`, color: "amber" };
  return { label: `${remainingDays} days left`, color: "emerald" };
}

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "COMMUNITIES.VIEW",
});

const communitiesStore = useCommunitiesStore();
const { can } = usePermission();
const { error: showError } = useNotification();
const { pagination } = usePagination();

const loading = ref(false);

const state = ref({
  search: null,
  dateRange: { start: null, end: null },
});

const selectedCommunity = ref<any>(null);
const isModalOpen = ref(false);

const columns = ref([
  {
    header: "Community Name",
    cell: ({ row }: { row: any }) => row.original.community_name || "N/A",
  },
  {
    header: "Code",
    cell: ({ row }: { row: any }) => row.original.community_code || "N/A",
  },
  {
    header: "Subscription Plan",
    cell: ({ row }: { row: any }) => { return row.original.subscription_plan_name || "N/A"; },
  },
  {
    header: "Subscription Start Date",
    cell: ({ row }: { row: any }) => { return row.original.subscription_plan_start_date ? formatDateTime(row.original.subscription_plan_start_date) : "N/A"; },
  },
  {
    header: "Subscription End Date",
    cell: ({ row }: { row: any }) => { return row.original.subscription_plan_end_date ? formatDateTime(row.original.subscription_plan_end_date) : "N/A"; },
  },
  {
    header: "Subscription Status",
    cell: ({ row }: { row: any }) => {
      const status = row.original.status || "N/A";
      const statusConfig = getSubscriptionStatusConfig(status);

      return h(
        resolveComponent("base-badge"),
        {
          color: statusConfig.color,
        },
        () => statusConfig.label,
      );
    },
  },
  {
    header: "Subscription Validity",
    cell: ({ row }: { row: any }) => {
      const endDate = row.original.subscription_plan_end_date;
      const remaining = getRemainingDays(endDate);
      const { label, color } = getRemainingDaysBadge(remaining);
      return h(
        resolveComponent("base-badge"),
        { color },
        () => label,
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }: { row: any }) => {
      const createdAt = row.original.created_at;
      return createdAt ? formatDateTime(createdAt) : "N/A";
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const items = [];
      if (can(PERMISSIONS_COMMUNITIES.VIEW) || can(PERMISSIONS_COMMUNITIES.VIEW_INFO)) {
        items.push({
          label: "View details",
          onSelect: () => {
            selectedCommunity.value = row.original;
            isModalOpen.value = true;
          },
        });
      }
      if (items.length === 0)
        return null;
      return h(
        "div",
        { class: "text-right" },
        h(
          resolveComponent("UDropdownMenu"),
          {
            content: {
              align: "end",
            },
            ui: { content: "min-w-[150px]", itemLeadingIcon: "hidden" },
            items,
          },
          () =>
            h(resolveComponent("UButton"), {
              icon: ICONS.ELLIPSIS_VERTICAL,
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
            }),
        ),
      );
    },
  },
]);

async function getCommunities(): Promise<void> {
  try {
    loading.value = true;
    const payload = {
      pagination: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
      search: state.value.search,
      start_date: state.value.dateRange.start || null,
      end_date: state.value.dateRange.end || null,
    };
    await communitiesStore.getCommunities(payload);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to get communities") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.value.page = 1;
  getCommunities();
}

function clearFilters() {
  state.value.search = null;
  state.value.dateRange = { start: null, end: null };
}

function closeModal(): void {
  isModalOpen.value = false;
  selectedCommunity.value = null;
}

function handleCommunityUpdated(): void {
  closeModal();
  getCommunities();
}

onMounted(() => {
  getCommunities();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Communities
      </template>
      <template #description>
        View and manage communities.
      </template>
      <template #actions>
        <NuxtLink
          v-if="can(PERMISSIONS_COMMUNITIES.CREATE)"
          to="/communities/create"
        >
          <base-button
            variant="outline"
            size="md"
            :trailing-icon="ICONS.PLUS"
          >
            Create Community
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>
    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6 flex flex-col gap-4 page-content-height">
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
        <base-input
          v-model="state.search"
          name="search"
          placeholder="Search"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-date-picker
          v-model="state.dateRange"
          name="dateRange"
          placeholder="Select date range"
          range
          :no-of-months="2"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <div class="flex gap-2 w-full sm:w-auto">
          <base-button
            v-if="state.search || state.dateRange?.start || state.dateRange?.end"
            variant="outline"
            class="flex-1 sm:flex-none"
            @click="clearFilters"
          >
            Clear Filters
          </base-button>
          <base-button
            :loading="loading"
            class="flex-1 sm:flex-none"
            :leading-icon="ICONS.SEARCH"
            @click="handleSearch"
          >
            Search
          </base-button>
        </div>
      </div>
      <base-table
        :data="communitiesStore.communities.data"
        :columns="columns"
        :loading="loading"
        empty-title="No communities found"
        empty-description="It looks like you haven't added any communities. Create one to get started."
      />
      <base-pagination
        :page="pagination.page"
        :total="Number(communitiesStore.communities.total)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; getCommunities(); }"
      />
    </div>
    <community-view-modal
      :open="isModalOpen"
      :community="selectedCommunity"
      @close="isModalOpen = false"
      @updated="handleCommunityUpdated"
    />
  </div>
</template>
