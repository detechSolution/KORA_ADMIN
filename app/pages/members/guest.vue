<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  // permission: "COMMUNITIES.CREATE",
});

const columns = [
  {
    id: "user",
    accessorKey: "user",
    header: "Name & Email",
  },
  {
    id: "phoneNumber",
    accessorKey: "phoneNumber",
    header: "Phone",
  },
  {
    accessorKey: "joinedAt",
    header: "Joined Date ",
    accessorFn: (row: any) => formatDate(row.joinedAt),
  },
  {
    accessorKey: "strikes",
    header: "Strikes",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    accessorFn: (row: any) => row.original?.user?.isActive ? "Active" : "Inactive",
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
];

const membersStore = useMembershipStore();
const { pagination } = usePagination();
const { error: showError } = useNotification();

const editDrawerOpen = ref(false);
const selectedMember = ref(null);

const state = ref({
  search: "",
  dateRange: null,
  status: null,
});

const members = computed(() => membersStore.members);
// const membersSummary = computed(() => membersStore.membersSummary);

async function fetchMembers(): Promise<void> {
  try {
    await membersStore.fetchMembers({
      pagination: {
        page: 1,
        pageSize: 10,
      },
      search: "",
      status: null,
    });
    await membersStore.fetchMembersSummary();
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to fetch members") });
  }
}

function openEditDrawer(member: any): void {
  selectedMember.value = member;
  editDrawerOpen.value = true;
}

onMounted(() => {
  fetchMembers();
});

const kpiData = computed(() => [
  {
    title: "Total Clients",
    icon: ICONS.USERS,
    value: 20,
    link: { path: "/members/list" },
  },
  {
    title: "Members Count",
    icon: ICONS.USERS,
    value: 10,
    link: { path: "/members/list" },
  },
  {
    title: "Guests Count",
    icon: ICONS.USERS,
    value: 3,
    link: { path: "/members/list" },
  },
]);
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Members
      </template>
      <template #description>
        Create and manage members
      </template>
      <template #actions>
        <NuxtLink to="/communities/list">
          <base-button
            variant="solid"
            size="md"
            :leading-icon="ICONS.PLUS"
          >
            Create Member
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-card  rounded-xl p-4 sm:p-6 page-content-height flex flex-col gap-4">
      <div class="grid bg-stone-50 rounded border border-border p-4 sm:p-6 py-6 grid-cols-1 md:grid-cols-3  gap-y-6 md:gap-y-8 gap-x-0">
        <dashboard-kpi-card
          v-for="(kpi, index) in kpiData"
          :key="index"
          class="px-6 border-border"
          :class="[
            index % 3 === 0 ? 'md:border-r' : 'md:border-r-0',
            index !== 2 ? 'xl:border-r' : 'xl:border-r-0',
          ]"
          :title="kpi.title"
          :value="kpi.value"
          :icon="kpi.icon"
        />
      </div>
      <h2 class="text-base font-semibold">
        Members & Guests List
      </h2>

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
            name="status"
            placeholder="All statuses"
            class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
            :options="[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
            >
              Clear Filters
            </base-button>
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
            >
              Search
            </base-button>
          </div>
        </div>

        <base-button
          variant="outline"
          :leading-icon="ICONS.DOWNLOAD"
        >
          Export
        </base-button>
      </div>
      <base-table
        :data="members.data"
        :columns="columns"
        :loading="false"
        empty-title="No communities found"
        empty-description="It looks like you haven't added any communities. Create one to get started."
      >
        <template #user-cell="{ row }">
          <div class="flex items-center gap-2">
            <img src="" alt="">
            <div>
              <h2
                class="text-sm font-medium text-secondary"
              >
                {{ row.original?.user?.fullName }}
              </h2>
              <p class="text-xs text-secondary-400">
                {{ row.original?.user?.email }}
              </p>
            </div>
          </div>
        </template>

        <template #type-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-badge :color="getStatusColor(row.original?.user?.role)">
              {{ getStatusLabel(row.original?.user?.role) }}
            </base-badge>
          </div>
        </template>

        <template #status-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-badge :color="row.original?.user?.isActive ? 'success' : 'red'">
              {{ row.original?.user?.isActive ? 'Active' : 'Inactive' }}
            </base-badge>
          </div>
        </template>

        <template #actions-cell="{ row }">
          <div class="text-left">
            <base-dropdown-menu
              :items="[
                {
                  label: 'Edit Client',
                  onSelect: () => openEditDrawer(row.original),
                  class: 'cursor-pointer',
                },
                {
                  label: 'View Details',
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
        :total="members.meta.total"
        :items-per-page="pagination.pageSize"
        :disabled="membersStore.loading"
        @update:page="(v) => { pagination.page = v; fetchMembers(); }"
      />
    </div>

    <members-edit-member
      :open="editDrawerOpen"
      :plan="selectedMember"
      @close="editDrawerOpen = false"
      @updated="fetchMembers()"
    />
  </div>
</template>
