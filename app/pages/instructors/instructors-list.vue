<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { Instructor } from "~/types/instructors";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useInstructorsStore } from "~/stores/instructors";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "instructors.view",
});

type DateRangeFilter = {
  start: string | null;
  end: string | null;
};

const instructorsStore = useInstructorsStore();
const { pagination } = usePagination();
const { error: showError } = useNotification();

const isEditDrawerOpen = ref(false);
const isDetailModalOpen = ref(false);
const selectedInstructor = ref<Instructor | null>(null);

function openEditDrawer(instructor: Instructor): void {
  selectedInstructor.value = instructor;
  isEditDrawerOpen.value = true;
}

function closeEditDrawer(): void {
  isEditDrawerOpen.value = false;
  selectedInstructor.value = null;
}

function openDetailModal(instructor: Instructor): void {
  selectedInstructor.value = instructor;
  isDetailModalOpen.value = true;
}

function closeDetailModal(): void {
  isDetailModalOpen.value = false;
  selectedInstructor.value = null;
}

async function handleInstructorUpdated(): Promise<void> {
  closeEditDrawer();
  await getInstructors();
}

const state = ref({
  search: "",
  status: "",
  dateRange: { start: null, end: null } as DateRangeFilter,
});

const statusOptions = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
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
    id: "status",
    header: "Status",
    accessorKey: "status",
    accessorFn: (row: any) => (row.isActive ? "Active" : "Inactive"),
  },
  {
    id: "actions",
    header: "Actions",
    accessorKey: "actions",
  },
]);

const instructors = computed(() => instructorsStore.instructors);
const loading = ref(false);

async function getInstructors(): Promise<void> {
  try {
    loading.value = true;
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search,
      isActive: state.value.status,
      refundFrom: state.value.dateRange.start,
      refundTo: state.value.dateRange.end,
    };
    await instructorsStore.fetchInstructors(params);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load instructors") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearchClick(): void {
  pagination.value.page = 1;
  getInstructors();
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

// FIX: Changed from fetchMails() to getInstructors()
onMounted(() => {
  getInstructors();
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
        <NuxtLink
          to="/instructors/create-instructors"
          class="flex items-center gap-2"
        >
          <base-button
            variant="solid"
            :leading-icon="ICONS.PLUS"
          >
            Create Instructor
          </base-button>
        </NuxtLink>
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
            class="w-full sm:w-auto sm:flex-1 md:w-64"
            :leading-icon="ICONS.SEARCH"
            @keyup.enter="handleSearchClick"
          />

          <base-date-picker
            v-model="state.dateRange"
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1"
          />
          <base-select
            v-model="state.status"
            name="status"
            placeholder="All statuses"
            :options="statusOptions"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              :loading="loading"
              @click="handleSearchClick"
            >
              Search
            </base-button>
            <base-button
              v-if="hasActiveFilters()"
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="clearFilters"
            >
              Clear Filters
            </base-button>
          </div>
        </div>
      </div>

      <base-table
        :data="instructors.data || []"
        :columns="columns"
        :loading="loading"
        empty-title="No instructors found"
      >
        <template #client-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-avatar
              :src="row.original.avatar"
              :alt="row.original.fullName || 'Unknown'"
              size="sm"
            />
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

        <template #status-cell="{ row }">
          <base-badge :color="row.original.isActive ? 'emerald' : 'red'">
            {{ row.original.isActive ? "Active" : "Inactive" }}
          </base-badge>
        </template>

        <template #actions-cell="{ row }">
          <div class="text-left">
            <base-dropdown-menu
              :items="[
                {
                  label: 'View Details',
                  onSelect: () => openDetailModal(row.original),
                  class: 'cursor-pointer',
                },
                {
                  label: 'Edit Instructor',
                  onSelect: () => openEditDrawer(row.original),
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
        :total="instructors.meta?.total || 0"
        :items-per-page="pagination.pageSize"
        :disabled="instructorsStore.loading"
        @update:page="(v) => { pagination.page = v; getInstructors(); }"
      />
    </div>

    <instructors-edit-instructors
      :open="isEditDrawerOpen"
      :instructor="selectedInstructor"
      @close="closeEditDrawer"
      @updated="handleInstructorUpdated"
    />

    <instructors-overview-modal
      v-if="isDetailModalOpen"
      :id="selectedInstructor.id"
      :open="isDetailModalOpen"
      @close="closeDetailModal"
    />
  </div>
</template>
