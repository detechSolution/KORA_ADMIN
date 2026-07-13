<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useMembershipStore } from "~/stores/membership";
import { formatDate } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "members.view",
});

const options = [
  { label: "Active", value: "active" },
  { label: "Expired", value: "expired" },
];

const typeOptions = [
  { label: "Member", value: "member" },
  { label: "Guest", value: "guest" },
];

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
    accessorFn: (row: any) => row.phoneNumber || "N/A",
  },
  {
    accessorKey: "joinedAt",
    header: "Joined Date ",
    accessorFn: (row: any) => formatDate(row.joinedAt),
  },
  {
    accessorKey: "strikes",
    header: "Strikes",
    accessorFn: (row: any) => row.sessionAttendances?.filter((item: any) => item.attendanceStatus === "no_show").length ?? 0,
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "membershipPlan",
    header: "Membership Plan",
    accessorFn: (row: any) => row.membershipPlan?.name || "N/A",
  },
  {
    accessorKey: "status",
    header: "Status",
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
const addMembershipDrawerOpen = ref(false);
const isDetailModalOpen = ref(false);
const isFreezeModalOpen = ref(false);
const selectedMember = ref(null);

const state = ref({
  search: "",
  dateRange: {
    start: null as string | null,
    end: null as string | null,
  },
  status: null,
  type: null,
});

const members = computed(() => membersStore.members);
// const membersSummary = computed(() => membersStore.membersSummary);

async function fetchMembers(): Promise<void> {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search,
      status: state.value.status,
      joinedFrom: state.value.dateRange.start,
      type: state.value.type,
      joinedTo: state.value.dateRange.end,
    };
    await membersStore.fetchMembers(params);
    await membersStore.fetchMembersSummary();
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to fetch members") });
  }
}

// function openEditDrawer(member: any): void {
//   selectedMember.value = member;
//   editDrawerOpen.value = true;
// }

function openAddMembershipDrawer(member: any): void {
  selectedMember.value = member;
  addMembershipDrawerOpen.value = true;
}

function openFreezeModal(member: any): void {
  selectedMember.value = member;
  isFreezeModalOpen.value = true;
}

function openDetailModal(member: any): void {
  selectedMember.value = member;
  isDetailModalOpen.value = true;
}

function closeDetailModal(): void {
  isDetailModalOpen.value = false;
  selectedMember.value = null;
}

const kpiData = computed(() => [
  {
    title: "Total Clients",
    icon: ICONS.USERS,
    value: membersStore.membersSummary?.totalMembers,
    link: { path: "/members/list" },
  },
  {
    title: "Members Count",
    icon: ICONS.USER_STAR,
    value: membersStore.membersSummary?.activeMembers,
    link: { path: "/members/list" },
  },
  {
    title: "Guests Count",
    icon: ICONS.BRIEFCASE,
    value: membersStore.membersSummary?.activeGuests,
    link: { path: "/members/list" },
  },
]);

function clearFilters(): void {
  state.value = {
    search: "",
    status: null,
    dateRange: { start: null, end: null },
    type: null,
  };

  pagination.value.page = 1;
  fetchMembers();
}

const hasActiveFilters = computed(() => {
  return (
    state.value.search
    || state.value.status
    || state.value.dateRange.start
    || state.value.dateRange.end
    || state.value.type
  );
});

onMounted(() => {
  fetchMembers();
});
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
        <NuxtLink to="/members/create-member">
          <base-button
            variant="solid"
            size="lg"
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
            class="w-full sm:w-auto sm:flex-1 md:w-64"
            :leading-icon="ICONS.SEARCH"
            @keyup.enter="fetchMembers"
          />

          <base-date-picker
            v-model="state.dateRange"
            name="dateRange"
            placeholder="Select date range"
            range
            :no-of-months="2"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
          />
          <base-select
            v-model="state.type"
            name="type"
            :options="typeOptions"
            placeholder="Select Type"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
          />
          <base-select
            v-model="state.status"
            name="status"
            :options="options"
            placeholder="Select Status"
            class="w-full sm:w-auto sm:flex-1 md:w-64"
          />
          <div class="flex gap-2 w-full sm:w-auto">
            <base-button
              variant="outline"
              class="flex-1 sm:flex-none"
              :leading-icon="ICONS.SEARCH"
              @click="fetchMembers"
            >
              Search
            </base-button>
            <base-button
              v-if="hasActiveFilters"
              variant="outline"
              class="flex-1 sm:flex-none"
              @click="clearFilters"
            >
              Clear Filters
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
        :loading="membersStore.loading"
        empty-title="No members found"
      >
        <template #user-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-avatar
              :src="row.original?.user?.avatar"
              :alt="row.original?.user?.fullName || 'Unknown'"
              size="sm"
            />
            <div>
              <h2
                class="text-sm font-medium text-secondary capitalize"
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
            <base-badge :status="row.original?.user?.role">
              {{ row.original?.user?.role }}
            </base-badge>
          </div>
        </template>

        <template #status-cell="{ row }">
          <div
            v-if="row.original?.user?.role !== 'guest' && row.original?.membershipPlanId !== null"
            class="flex items-center gap-2"
          >
            <base-badge :status="row.original?.isActive ? 'active' : 'expired'">
              {{ row.original?.isActive ? 'Active' : 'Expired' }}
            </base-badge>
          </div>
          <div
            v-else
            class="flex items-center gap-2"
          >
            N/A
          </div>
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
                !row.original?.isActive && {
                  label: 'Add Membership',
                  onSelect: () => openAddMembershipDrawer(row.original),
                  class: 'cursor-pointer',
                },
                row.original?.membershipPlan?.isFreezable && !row.original?.isFrozen && !row.original?.isFrozen && {
                  label: 'Freeze Membership',
                  onSelect: () => openFreezeModal(row.original),
                  class: 'cursor-pointer',
                },
              ].filter(Boolean)"
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
      v-if="editDrawerOpen"
      :open="editDrawerOpen"
      :plan="selectedMember"
      title="Edit Member"
      @close="editDrawerOpen = false"
      @updated="fetchMembers()"
    />

    <members-add-membership
      v-if="addMembershipDrawerOpen && selectedMember"
      :open="addMembershipDrawerOpen"
      :member="selectedMember"
      @close="addMembershipDrawerOpen = false"
      @updated="fetchMembers()"
    />

    <members-member-detail
      v-if="isDetailModalOpen"
      :open="isDetailModalOpen"
      :member="selectedMember"
      @close="closeDetailModal"
    />

    <members-freeze-membership
      v-if="isFreezeModalOpen && selectedMember"
      :open="isFreezeModalOpen"
      :member="selectedMember"
      @close="isFreezeModalOpen = false"
      @updated="fetchMembers()"
    />
  </div>
</template>
