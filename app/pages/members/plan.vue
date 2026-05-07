<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { MembershipPlan } from "~/types/membership";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";
import { getStatusColor } from "~/utils/helpers";

definePageMeta({
  auth: true,
  layout: "dashboard",
  // permission: "COMMUNITIES.VIEW",
});

const options = ref([
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
]);

const detailsOption = ref([
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
  { label: "Custom", value: "custom" },
]);

const columns = [
  {
    accessorKey: "name",
    header: "Plan Name",
  },
  {
    accessorKey: "details",
    header: "Details",
  },
  {
    accessorKey: "isActive",
    header: "Status",
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
];

const planStore = useMembershipStore();
const { pagination } = usePagination();
const { error: showError } = useNotification();
const editDrawerOpen = ref(false);
const selectedPlan = ref<MembershipPlan | null>(null);

const state = ref({
  search: "",
  type: null,
  status: null,
});

const plans = computed(() => planStore.plans);

async function fetchPlans(): Promise<void> {
  try {
    await planStore.fetchPlans({
      pagination: {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
      },
      search: state.value.search,
      type: state.value.type,
      status: state.value.status,
    });
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to fetch plans") });
  }
}

function handleSearchClick(): void {
  fetchPlans();
}

function handleClearFilters(): void {
  state.value = {
    search: "",
    type: null,
    status: null,
  };
  fetchPlans();
}

function openEditDrawer(plan: MembershipPlan): void {
  selectedPlan.value = plan;
  editDrawerOpen.value = true;
}

onMounted(() => {
  fetchPlans();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Membership Plans
      </template>
      <template #description>
        Create and manage membership plans
      </template>
      <template #actions>
        <NuxtLink
          to="/members/create-membership"
        >
          <base-button
            variant="solid"
            size="md"
            :trailing-icon="ICONS.PLUS"
          >
            Create Plan
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>
    <div class=" bg-white rounded-xl p-6 flex flex-col gap-4">
      <h2 class="text-base font-semibold">
        Plans List
      </h2>

      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
        <base-input
          v-model="state.search"
          name="search"
          :leading-icon="ICONS.SEARCH"
          placeholder="Search plans"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <base-select
          v-model="state.type"
          name="type"
          placeholder="Select details"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          :options="detailsOption"
        />
        <base-select
          v-model="state.status"
          name="status"
          placeholder="Select status"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
          :options="options"
        />

        <div class="flex gap-2 w-full sm:w-auto">
          <base-button
            variant="outline"
            class="flex-1 sm:flex-none"
            @click="handleClearFilters"
          >
            Clear Filters
          </base-button>
          <base-button
            class="flex-1 sm:flex-none"
            variant="outline"
            :leading-icon="ICONS.SEARCH"
            @click="handleSearchClick"
            @keyup.enter="handleSearchClick"
          >
            Search
          </base-button>
        </div>
      </div>
      <base-table
        :data="plans.data"
        :columns="columns"
        :loading="planStore.loading"
        empty-title="No plans found"
        empty-description="It looks like you haven't added any plans. Create one to get started."
      >
        <template #details-cell="{ row }">
          <div class="flex items-center gap-2">
            <base-badge
              v-for="(option, index) in row.original.options.slice(0, 2)"
              :key="index"
              :color="getStatusColor(option.frequency)"
            >
              {{ `${option.frequency[0].toUpperCase() + option.frequency.slice(1)}: Rs. ${option.price}` }}
            </base-badge>
            <div
              v-if="row.original.options.length > 2"
              class="bg-[#F9F6F2] rounded-full p-2 text-secondary"
            >
              +{{ row.original.options.length - 2 }}
            </div>
          </div>
        </template>
        <template #isActive-cell="{ row }">
          <base-badge :color="row?.original?.isActive ? 'success' : 'red'">
            {{ row?.original?.isActive ? "Active" : "Inactive" }}
          </base-badge>
        </template>

        <template #actions-cell="{ row }">
          <div class="text-left">
            <base-dropdown-menu
              :items="[
                {
                  label: 'Edit Plan',
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
        :page="plans.meta.page"
        :items-per-page="plans.meta.limit"
        :total="plans.meta.total"
        :loading="planStore.loading"
        @update:page="(v) => { pagination.page = v; fetchPlans(); }"
      />
    </div>

    <membership-edit-plan
      :open="editDrawerOpen"
      :plan="selectedPlan"
      @close="editDrawerOpen = false"
      @updated="fetchPlans"
    />
  </div>
</template>
