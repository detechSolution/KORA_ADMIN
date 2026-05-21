<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

import type { SystemAdmin } from "~/types/system-admin";

import { ICONS } from "~/config/icons";
import { useAdminStore } from "~/stores/admin";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "administration.admins.view",
});

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const adminStore = useAdminStore();
const { error: showError } = useNotification();
const { pagination } = usePagination();

type DateRangeFilter = {
  start: string | null;
  end?: string | null;
};

const state = reactive({
  search: "",
  dateRange: { start: null, end: null } as DateRangeFilter,
  status: "",
});

const loadingAdmins = ref(false);
const admins = computed(() => adminStore.admins);
const isAdminDrawerOpen = ref(false);
const selectedAdmin = ref<SystemAdmin | null>(null);

function openAdminDrawer(admin: SystemAdmin): void {
  selectedAdmin.value = admin;
  isAdminDrawerOpen.value = true;
}

function closeAdminDrawer(): void {
  isAdminDrawerOpen.value = false;
  selectedAdmin.value = null;
}

async function handleAdminUpdated(): Promise<void> {
  closeAdminDrawer();
  await fetchAdmins();
}

const columns = [
  {
    id: "fullName",
    header: "Client",
    accessorKey: "fullName",
  },
  {
    id: "phoneNumber",
    header: "Phone",
    accessorKey: "phoneNumber",
  },
  {
    id: "role",
    header: "Role",
    accessorKey: "role",
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "isActive",
  },
  {
    id: "createdAt",
    header: "Created Date",
    accessorKey: "createdAt",
    accessorFn: (row: SystemAdmin) => formatDate(row.createdAt),
  },
  {
    id: "actions",
    header: "Actions",
  },

];

async function fetchAdmins(): Promise<void> {
  try {
    loadingAdmins.value = true;
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.search,
      status: state.status,
      createdFrom: state.dateRange.start,
      createdTo: state.dateRange.end,
    };
    await adminStore.fetchAdmins(params);
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to load admins") });
  }
  finally {
    loadingAdmins.value = false;
  }
}

function handleSearchClick(): void {
  pagination.value.page = 1;
  fetchAdmins();
}

function clearFilters(): void {
  state.status = "";
  state.search = "";
  state.dateRange = { start: null, end: null };
  handleSearchClick();
}

onMounted(() => {
  fetchAdmins();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Admins
      </template>
      <template #description>
        Create and manage admins
      </template>

      <template #actions>
        <NuxtLink to="/administration/create-admin">
          <base-button
            variant="solid"
            size="md"
            :trailing-icon="ICONS.PLUS"
          >
            Create Admin
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl flex flex-col gap-4 p-4">
      <div class="">
        <h2 class="text-base font-semibold">
          Admins List
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
            :options="statusOptions"
            name="status"
            placeholder="All statuses"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              v-if="state.status !== '' || state.search !== '' || state.dateRange.start || state.dateRange.end"
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
              @click="handleSearchClick"
            >
              Search
            </base-button>
          </div>
        </div>
      </div>

      <base-table
        :data="admins.data"
        :columns="columns"
        :loading="loadingAdmins"
        empty-title="No communities found"
        empty-description="It looks like you haven't added any communities. Create one to get started."
      >
        <template #fullName-cell="{ row }">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-secondary">
              {{ row.original.fullName || "-" }}
            </span>
            <span class="text-xs text-secondary-400">
              {{ row.original.email || "-" }}
            </span>
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
                  label: 'Edit Profile',
                  onSelect: () => openAdminDrawer(row.original),
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
        :page="admins.pagination.page"
        :total="admins.pagination.total"
        :items-per-page="admins.pagination.itemsPerPage"
        :disabled="loadingAdmins"
      />
    </div>

    <admin-edit-admin
      :open="isAdminDrawerOpen"
      :admin="selectedAdmin"
      title="Edit Admin"
      @close="closeAdminDrawer"
      @updated="handleAdminUpdated"
    />
  </div>
</template>
