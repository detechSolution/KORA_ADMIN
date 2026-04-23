<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, resolveComponent } from "vue";

import { ICONS } from "~/config/icons";
import { useAdminStore } from "~/stores/admin";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "administration.admins.view",
});

// options for filter
const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

// columns for admins table
const columns = computed(() => [
  {
    header: "Client",
    cell: ({ row }: { row: any }) => {
      return h("div", { class: "flex items-center gap-2" }, [
        h("div", { class: "w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center" }, h("span", { class: "text-sm  font-medium text-secondary" }, row.original.fullName?.charAt(0).toUpperCase() ?? "—")),
        h("div", { class: "flex flex-col gap-1" }, [
          h("span", { class: "text-sm  font-medium text-secondary" }, row.original.fullName ?? "—"),
          h("span", { class: "text-xs font-normal text-secondary-500" }, row.original.email ?? "—"),
        ]),
      ]);
    },
  },
  {
    header: "Phone",
    cell: ({ row }: { row: any }) => row.original.phoneNumber ?? "—",
  },
  {
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const isActive = row.original.isActive === true;
      const color = isActive ? "emerald" : "red";
      const label = isActive ? "Active" : "Inactive";
      return h(
        resolveComponent("base-badge"),
        { color },
        () => label,
      );
    },
  },
  {
    header: "Created Date",
    cell: ({ row }: { row: any }) => formatDate(row.original.createdAt) ?? "—",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: { row: any }) => {
      const isInactive = row.original.is_active !== true;
      const showActions = isInactive;
      if (!showActions)
        return null;
      return h("div", { class: "text-left" }, h(
        resolveComponent("UDropdownMenu"),
        {
          content: {
            align: "end",
          },
          ui: { content: "min-w-[150px]", itemLeadingIcon: "hidden" },
          items: [
            {
              label: "Edit profile",
              click: () => {
              },
            },
          ],
        },
        () =>
          h(resolveComponent("UButton"), {
            icon: ICONS.ELLIPSIS_VERTICAL,
            color: "neutral",
            variant: "ghost",
          }),
      ));
    },
  },
]);

const adminStore = useAdminStore();
const { error: showError } = useNotification();
const { pagination } = usePagination();

const state = reactive({
  search: "",
  dateRange: "",
  status: "",
});

const loadingAdmins = ref(false);
const admins = computed(() => adminStore.admins);

async function fetchAdmins(): Promise<void> {
  try {
    loadingAdmins.value = true;
    await adminStore.fetchAdmins({
      pagination: {
        page: pagination.value.page,
      },
      search: state.search,
      status: state.status,
      dateRange: state.dateRange,
    });
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

// function to clear filters
function clearFilters(): void {
  state.status = "";
  state.search = "";
  state.dateRange = "";
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
              v-if="state.status !== '' || state.search !== '' || state.dateRange !== ''"
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
        :data="admins"
        :columns="columns"
        :loading="loadingAdmins"
        empty-title="No communities found"
        empty-description="It looks like you haven't added any communities. Create one to get started."
      />
    </div>
  </div>
</template>
