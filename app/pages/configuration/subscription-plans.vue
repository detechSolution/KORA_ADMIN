<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from "vue";

import { useNotification } from "~/composables/use-notification";
import { usePagination } from "~/composables/use-pagination";
import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_CONFIGURATION } from "~/config/permissions";
import { useSubscriptionsStore } from "~/stores/subscriptions";
import { formatDateTime, formatNumber } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "CONFIGURATION.PLANS",
});

const { can } = usePermission();
const { error: showError } = useNotification();
const subscriptionsStore = useSubscriptionsStore();
const { pagination } = usePagination();

const loading = ref(false);
const selectedPlan = ref<any>(null);
const isModalOpen = ref(false);
const isCreateModalOpen = ref(false);

const state = ref({
  status: null as boolean | null,
});

const statusOptions = ref([
  { label: "Active", value: true },
  { label: "Inactive", value: false },
]);

const columns = ref([
  {
    accessorKey: "name",
    header: "Plan Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }: { row: any }) => {
      const price = row.original.price;
      return price !== undefined && price !== null ? formatNumber(price) : "-";
    },
  },
  {
    accessorKey: "interval",
    header: "Frequency",
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const isActive = !!row.original.is_active;

      return h(
        resolveComponent("base-badge"),
        {
          color: isActive ? "emerald" : "red",
        },
        () => (isActive ? "Active" : "Disabled"),
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }: { row: any }) => formatDateTime(row.original.created_at),
  },
  {
    accessorKey: "updated_at",
    header: "Updated At",
    cell: ({ row }: { row: any }) => formatDateTime(row.original.updated_at),
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const items = [];
      if (can(PERMISSIONS_CONFIGURATION.PLANS_VIEW)) {
        items.push({
          label: "View details",
          onSelect: () => {
            selectedPlan.value = row.original;
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

async function getSubscriptionPlans(): Promise<void> {
  try {
    loading.value = true;
    await subscriptionsStore.getSubscriptionPlans({
      pagination: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
      is_active: state.value.status,
    });
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to get subscription plans") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearch(): void {
  pagination.value.page = 1;
  getSubscriptionPlans();
}

function clearFilters(): void {
  state.value.status = null;
}

function closeModal(): void {
  isModalOpen.value = false;
  selectedPlan.value = null;
}

function handleUpdated(): void {
  closeModal();
  getSubscriptionPlans();
}

function openCreateModal(): void {
  isCreateModalOpen.value = true;
}

function closeCreateModal(): void {
  isCreateModalOpen.value = false;
}

function handleCreated(): void {
  closeCreateModal();
  getSubscriptionPlans();
}

onMounted(() => {
  getSubscriptionPlans();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Subscriptions Plans
      </template>
      <template #description>
        View and manage subscriptions plans.
      </template>
      <template #actions>
        <base-button
          v-if="can(PERMISSIONS_CONFIGURATION.PLANS_ADD)"
          variant="outline"
          size="md"
          :trailing-icon="ICONS.PLUS"
          @click="openCreateModal"
        >
          Create Plan
        </base-button>
      </template>
    </base-page-header>
    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6 flex flex-col gap-4 page-content-height">
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end">
        <base-select
          v-model="state.status"
          name="status"
          placeholder="Select status"
          :options="statusOptions"
          class="w-full sm:w-auto sm:flex-1 sm:max-w-xs"
        />
        <div class="flex gap-2 w-full sm:w-auto">
          <base-button
            v-if="state.status !== null"
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
        :data="subscriptionsStore.subscriptionPlans.data"
        :columns="columns"
        :loading="loading"
        empty-title="No subscription plans found"
        empty-description="Create a plan to start offering subscriptions."
      />
      <base-pagination
        :page="pagination.page"
        :total="Number(subscriptionsStore.subscriptionPlans.total)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; getSubscriptionPlans(); }"
      />
    </div>
    <subscription-plans-view
      :open="isModalOpen"
      :plan="selectedPlan"
      @close="closeModal"
      @updated="handleUpdated"
    />
    <subscription-plans-create
      :open="isCreateModalOpen"
      @close="closeCreateModal"
      @created="handleCreated"
    />
  </div>
</template>
