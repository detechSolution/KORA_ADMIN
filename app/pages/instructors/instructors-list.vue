<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useInstructorsStore } from "~/stores/instructors";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "mails.view",
});

type DateRangeFilter = {
  start: string | null;
  end: string | null;
};

const instructorsStore = useInstructorsStore();
const { pagination } = usePagination();
const { error: showError } = useNotification();

const state = ref({
  search: "",
  status: "",
  dateRange: { start: null, end: null } as DateRangeFilter,
});

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
];

const columns = ref([
  {
    header: "Client",
    accessorKey: "client",
  },
  {
    id: "email",
    header: "Email",
    accessorKey: "email",
  },
  {
    id: "assignedSession",
    header: "Session Assigned",
    accessorKey: "assignedSessions",
  },
  {
    id: "upcomingSessions",
    header: "Upcoming Session",
    accessorKey: "upcomingSessions",
  },
  {
    id: "actions",
    header: "Actions",
    accessorKey: "actions",
  },
]);

const instructors = computed(() => instructorsStore.instructors);

async function fetchMails(): Promise<void> {
  try {
    await instructorsStore.fetchInstructors({
      pagination: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
      search: state.value.search,
    });
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load emails") });
  }
}

function handleSearchClick(): void {
  pagination.value.page = 1;
  fetchMails();
}

function clearFilters(): void {
  state.value.search = "";
  state.value.status = "";
  state.value.dateRange = { start: null, end: null };
  handleSearchClick();
}

function hasActiveFilters(): boolean {
  return !!(
    state.value.search
    || state.value.status
    || state.value.dateRange.start
    || state.value.dateRange.end
  );
}

onMounted(() => {
  fetchMails();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Instructors
      </template>
      <template #description>
        View instructors details, assigned sessions & upcoming sessions
      </template>

      <template #actions>
        <Nuxt-Link
          to="/instructors/create-instructors"
          class="flex items-center gap-2"
        >
          <base-button
            variant="solid"
            :leading-icon="ICONS.PLUS"
          >
            Create Instructor
          </base-button>
        </Nuxt-Link>
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl flex flex-col gap-4 p-4">
      <div class="">
        <h2 class="text-base font-semibold">
          Instructors List
        </h2>
      </div>

      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
          <base-input
            v-model="state.search"
            name="search"
            placeholder="Search"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
            :leading-icon="ICONS.SEARCH"
            @keyup.enter="handleSearchClick"
          />

          <base-date-picker
            v-model="state.dateRange"
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <base-select
            v-model="state.status"
            name="status"
            placeholder="All statuses"
            :options="statusOptions"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              v-if="hasActiveFilters()"
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="clearFilters"
            >
              Clear Filters
            </base-button>
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              :loading="instructorsStore.loading"
              @click="handleSearchClick"
            >
              Search
            </base-button>
          </div>
        </div>
      </div>

      <base-table
        :data="instructors.data"
        :columns="columns"
        :loading="instructorsStore.loading"
        empty-title="No emails found"
        empty-description="Sent emails will appear here once available."
      >
        <template #client-cell="{ row }">
          <div class="flex items-center">
            <base-avatar :src="row?.original?.avatar" />
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium text-secondary">
                {{ row?.original?.fullName || "-" }}
              </span>
              <span class="text-xs text-secondary-400">
                {{ row?.original.phoneNumber || "-" }}
              </span>
            </div>
          </div>
        </template>
        <template #actions-cell>
          <div class="text-left">
            <base-dropdown-menu
              :items="[
                {
                  label: 'View Details',
                  // onSelect: () => openAdminDrawer(row.original),
                  class: 'cursor-pointer',
                },
                {
                  label: 'Edit Instructor',
                  // onSelect: () => openAdminDrawer(row.original),
                  class: 'cursor-pointer',
                },
              ]"
            >
              <base-button
                :icon="ICONS.ELLIPSIS_VERTICAL"
                variant="ghost"
              />
            </base-dropdown-menu>
          </div>
        </template>
      </base-table>

      <base-pagination
        :page="pagination.page"
        :total="instructors.meta.total"
        :items-per-page="pagination.pageSize"
        :disabled="instructorsStore.loading"
        @update:page="(v) => { pagination.page = v; fetchMails(); }"
      />
    </div>
  </div>
</template>
