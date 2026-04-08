<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from "vue";

import { usePagination } from "~/composables/use-pagination";
import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_CONFIGURATION } from "~/config/permissions";
import { useBillableItemsStore } from "~/stores/billable-items";
import { formatDateTime, formatNumber } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "CONFIGURATION.BILLABLE_ITEMS",
});

const billableItemsStore = useBillableItemsStore();
const { can } = usePermission();
const { pagination } = usePagination();
const { error: showError } = useNotification();

const loading = ref(false);
const isCreateModalOpen = ref(false);
const selectedItem = ref<any>(null);
const isEditModalOpen = ref(false);

const state = ref({
  is_active: "" as "" | "true" | "false",
});

const isActiveOptions = ref([
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
]);

const columns = ref([
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }: { row: any }) => row.original.name ?? "-",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }: { row: any }) => {
      const desc = row.original.description;
      return desc ? (desc.length > 50 ? `${desc.slice(0, 50)}...` : desc) : "-";
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }: { row: any }) => {
      const value = row.original.amount;
      return value !== undefined && value !== null ? formatNumber(value) : "-";
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const active = row.original.is_active;
      return h(
        resolveComponent("base-badge"),
        {
          color: active ? "success" : "red",
        },
        () => (active ? "Active" : "Inactive"),
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }: { row: any }) => {
      const createdAt = row.original.created_at ?? row.original.createdAt;
      return createdAt ? formatDateTime(createdAt) : "-";
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }: { row: any }) => {
      const item = row.original;
      const items = [];
      if (can(PERMISSIONS_CONFIGURATION.BILLABLE_ITEMS_UPDATE)) {
        items.push({
          label: "Update details",
          onSelect: () => {
            selectedItem.value = item;
            isEditModalOpen.value = true;
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
            content: { align: "end" },
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

async function getBillableItems(): Promise<void> {
  try {
    loading.value = true;
    const payload = {
      pagination: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
      is_active: state.value.is_active === "" ? undefined : state.value.is_active === "true",
    };
    await billableItemsStore.getBillableItems(payload);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to get billable items") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearch(): void {
  pagination.value.page = 1;
  getBillableItems();
}

function clearFilters(): void {
  state.value.is_active = "";
}

function hasActiveFilters(): boolean {
  return state.value.is_active !== "";
}

function handleCreated(): void {
  isCreateModalOpen.value = false;
  getBillableItems();
}

function handleUpdated(): void {
  isEditModalOpen.value = false;
  selectedItem.value = null;
  getBillableItems();
}

function closeEditModal(): void {
  isEditModalOpen.value = false;
  selectedItem.value = null;
}

onMounted(() => {
  getBillableItems();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Billable Items
      </template>
      <template #description>
        Manage billable items for transactions.
      </template>
      <template #actions>
        <base-button
          v-if="can(PERMISSIONS_CONFIGURATION.BILLABLE_ITEMS_ADD)"
          variant="outline"
          size="md"
          :trailing-icon="ICONS.PLUS"
          @click="isCreateModalOpen = true"
        >
          Add Billable Item
        </base-button>
      </template>
    </base-page-header>

    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6 flex flex-col gap-4 page-content-height">
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start sm:items-end flex-wrap">
        <base-select
          v-model="state.is_active"
          name="is_active"
          placeholder="Select status"
          :options="isActiveOptions"
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
        :data="billableItemsStore.billableItems.data"
        :columns="columns"
        :loading="loading"
        empty-title="No billable items found"
        empty-description="Billable items will appear here when added."
      />
      <base-pagination
        :page="pagination.page"
        :total="Number(billableItemsStore.billableItems.total_count)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; getBillableItems(); }"
      />
    </div>

    <configuration-billable-items-create-modal
      :open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="handleCreated"
    />
    <configuration-billable-items-edit-modal
      :open="isEditModalOpen"
      :item="selectedItem"
      @close="closeEditModal"
      @updated="handleUpdated"
    />
  </div>
</template>
