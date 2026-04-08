<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from "vue";

import { usePagination } from "~/composables/use-pagination";
import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_ADMINS } from "~/config/permissions";
import { useSystemAdminStore } from "~/stores/system-admin";
import { formatDateTime } from "~/utils/common";
import { getApiErrorMessage } from "~/utils/error";

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "ADMINS.LIST",
});

const systemAdminStore = useSystemAdminStore();
const { can } = usePermission();
const { pagination } = usePagination();
const { error: showError } = useNotification();

const loading = ref(false);
const isCreateModalOpen = ref(false);
const selectedAdmin = ref<any>(null);
const isEditModalOpen = ref(false);

const state = ref({
  is_active: null as boolean | null,
});

const isActiveOptions = ref([
  { label: "Active", value: true },
  { label: "Inactive", value: false },
]);

const columns = ref([
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }: { row: any }) => row.original.name ?? "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }: { row: any }) => row.original.email ?? "-",
  },
  {
    accessorKey: "role_name",
    header: "Role",
    cell: ({ row }: { row: any }) => row.original.role_name ?? "-",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }: { row: any }) => row.original.phone ?? "-",
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
      const createdAt = row.original.created_at ?? null;
      return createdAt ? formatDateTime(createdAt) : "-";
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }: { row: any }) => {
      const admin = row.original;
      const items = [];
      if (can(PERMISSIONS_ADMINS.LIST_UPDATE)) {
        items.push({
          label: "Update details",
          onSelect: () => {
            selectedAdmin.value = admin;
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

const roleOptions = computed(() => {
  return systemAdminStore.roles.map(role => ({
    label: role.name,
    value: role.id,
  }));
});

async function getAdmins(): Promise<void> {
  try {
    loading.value = true;
    const payload = {
      pagination: {
        page: pagination.value.page,
        limit: pagination.value.pageSize,
      },
      is_active: state.value.is_active ?? null,
    };
    await systemAdminStore.getAdmins(payload);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load admins") });
  }
  finally {
    loading.value = false;
  }
}

function handleSearch(): void {
  pagination.value.page = 1;
  getAdmins();
}

function clearFilters(): void {
  state.value.is_active = null;
}

function hasActiveFilters(): boolean {
  return state.value.is_active !== null;
}

function openCreateModal(): void {
  isCreateModalOpen.value = true;
}

function closeCreateModal(): void {
  isCreateModalOpen.value = false;
}

function handleCreated(): void {
  isCreateModalOpen.value = false;
  getAdmins();
}

function handleUpdated(): void {
  isEditModalOpen.value = false;
  selectedAdmin.value = null;
  getAdmins();
}

function closeEditModal(): void {
  isEditModalOpen.value = false;
  selectedAdmin.value = null;
}

onMounted(() => {
  getAdmins();
  systemAdminStore.getRoles();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Admins
      </template>
      <template #description>
        Manage system administrators and their roles.
      </template>
      <template #actions>
        <base-button
          v-if="can(PERMISSIONS_ADMINS.LIST_ADD)"
          type="button"
          variant="outline"
          size="md"
          :trailing-icon="ICONS.PLUS"
          @click="openCreateModal"
        >
          Add Admin
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
        :data="systemAdminStore.admins.data"
        :columns="columns"
        :loading="loading"
        empty-title="No admins found"
        empty-description="Admins will appear here when added."
      />
      <base-pagination
        :page="pagination.page"
        :total="Number(systemAdminStore.admins.total)"
        :items-per-page="pagination.pageSize"
        :disabled="loading"
        @update:page="(v) => { pagination.page = v; getAdmins(); }"
      />
    </div>

    <system-admin-create-modal
      :open="isCreateModalOpen"
      :roles="roleOptions"
      @close="closeCreateModal"
      @created="handleCreated"
    />
    <system-admin-view-modal
      :open="isEditModalOpen"
      :admin="selectedAdmin"
      :roles="roleOptions"
      @close="closeEditModal"
      @updated="handleUpdated"
    />
  </div>
</template>
