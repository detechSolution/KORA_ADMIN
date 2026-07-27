<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { MembershipPlan } from "~/types/membership";

import { usePagination } from "~/composables/use-pagination";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_MEMBERSHIP_PLANS } from "~/config/permissions";
import { useMembershipStore } from "~/stores/membership";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "membership_plans.view",
});

const options = ref([
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
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
const { can } = usePermission();
const state = ref({
  search: "",
  type: null,
  status: null,
});

const plans = computed(() => planStore.plans);

async function fetchPlans(): Promise<void> {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      q: state.value.search,
      frequency: state.value.type,
      isActive: state.value.status,
    };
    await planStore.fetchPlans(params);
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

function hasActiveFilters(): boolean {
  return !!(state.value.search || state.value.type || state.value.status);
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
          v-if="can(PERMISSIONS_MEMBERSHIP_PLANS.CREATE)"
          to="/members/create-membership"
        >
          <base-button
            variant="solid"
            size="lg"
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
          @keyup.enter="handleSearchClick"
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
            class="flex-1 sm:flex-none"
            variant="outline"
            :leading-icon="ICONS.SEARCH"
            @click="handleSearchClick"
            @keyup.enter="handleSearchClick"
          >
            Search
          </base-button>
          <base-button
            v-if="hasActiveFilters()"
            variant="outline"
            class="flex-1 sm:flex-none"
            @click="handleClearFilters"
          >
            Clear Filters
          </base-button>
        </div>
      </div>
      <base-table
        :data="plans.data"
        :columns="columns"
        :loading="planStore.loading"
        empty-title="No plans found"
      >
        <template #details-cell="{ row }">
          <div class="flex items-center gap-2">
            <div
              v-for="(option, index) in row.original.options.slice(0, 2)"
              :key="index"
              :status="option.frequency"
            >
              <span class="capitalize">{{ option.frequency }}</span>: Rs. {{ option.price }} <span v-if="index !== row.original.options.slice(0, 2).length - 1">|</span>
            </div>

            <UTooltip
              v-if="row.original.options.length > 2"
              arrow
              :ui="{
                content: 'bg-white py-4 ',
              }"
            >
              <div class="bg-[#F9F6F2] rounded-full text-xs h-6 w-6 p-1 text-secondary">
                +{{ row.original.options.length - 2 }}
              </div>

              <template #content>
                <div
                  v-for="(option, index) in row.original.options.slice(2)"
                  :key="index"
                  :status="option.frequency"
                >
                  {{ `${option.frequency}: Rs. ${option.price}` }}
                </div>
              </template>
            </UTooltip>
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
                  disabled: !can(PERMISSIONS_MEMBERSHIP_PLANS.UPDATE),
                  onSelect: () => openEditDrawer(row.original),
                  class: 'cursor-pointer',
                },
              ]"
            >
              <base-button :icon="ICONS.ELLIPSIS_VERTICAL" variant="ghost" />
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
      title="Edit Plan"
      @close="editDrawerOpen = false"
      @updated="fetchPlans"
    />
  </div>
</template>
