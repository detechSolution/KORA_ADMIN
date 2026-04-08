<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import type { RoleModule } from "~/types/system-admin";

import { usePermission } from "~/composables/use-permission";
import { ICONS } from "~/config/icons";
import { PERMISSIONS_ADMINS } from "~/config/permissions";
import { useSystemAdminStore } from "~/stores/system-admin";
import { getApiErrorMessage } from "~/utils/error";

type ModuleTreeItem = {
  label: string;
  id: number;
  children?: ModuleTreeItem[];
  defaultExpanded?: boolean;
};

definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "ADMINS.ROLES_PERMISSIONS",
});

const systemAdminStore = useSystemAdminStore();
const { can } = usePermission();
const { error: showError, success } = useNotification();

const loadingRoles = ref(false);
const loadingModules = ref(false);
const savingModules = ref(false);
const isCreateModalOpen = ref(false);

const roles = computed(() => systemAdminStore.roles);
const modulesList = ref<RoleModule[]>([]);
const treeItems = ref<ModuleTreeItem[]>([]);
const selectedRoleId = ref<number | null>(null);
const allowedModuleIds = ref<number[]>([]);
const savedAllowedModuleIds = ref<number[]>([]);

function mapModuleToTreeItem(module: RoleModule): ModuleTreeItem {
  return {
    label: module.display_name,
    id: module.id,
    defaultExpanded: true,
    children: module.children?.length
      ? module.children.map(mapModuleToTreeItem)
      : undefined,
  };
}

function getTreeItemKey(item: ModuleTreeItem): string {
  return String(item.id);
}

function toggleModule(moduleId: number) {
  if (allowedModuleIds.value.includes(moduleId))
    allowedModuleIds.value = allowedModuleIds.value.filter(id => id !== moduleId);
  else
    allowedModuleIds.value = [...allowedModuleIds.value, moduleId];
}

const hasChanges = computed(() => {
  if (allowedModuleIds.value.length !== savedAllowedModuleIds.value.length)
    return true;
  const a = new Set(allowedModuleIds.value);
  const b = new Set(savedAllowedModuleIds.value);
  if (a.size !== b.size)
    return true;
  for (const id of a) {
    if (!b.has(id))
      return true;
  }
  return false;
});

async function getRoles(): Promise<void> {
  try {
    loadingRoles.value = true;
    await systemAdminStore.getRoles();
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load roles") });
  }
  finally {
    loadingRoles.value = false;
  }
}

/** Load modules and allowed state when a role is selected. */
async function loadRolePrivileges(roleId: number): Promise<void> {
  try {
    loadingModules.value = true;
    modulesList.value = [];
    allowedModuleIds.value = [];
    savedAllowedModuleIds.value = [];

    const res = await systemAdminStore.getRoleModules({ role_id: roleId });
    const list = res.list ?? [];
    modulesList.value = list;
    treeItems.value = list.map(mapModuleToTreeItem);
    const ids = res.allowedModules ?? [];
    allowedModuleIds.value = [...ids];
    savedAllowedModuleIds.value = [...ids];
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to load privileges") });
  }
  finally {
    loadingModules.value = false;
  }
}

function selectRole(role: { id: number }) {
  selectedRoleId.value = role.id;
  loadRolePrivileges(role.id);
}

async function savePrivileges(): Promise<void> {
  const roleId = selectedRoleId.value;
  if (roleId == null)
    return;
  try {
    savingModules.value = true;
    const payload = {
      role_id: roleId,
      module_ids: [...allowedModuleIds.value],
    };
    await systemAdminStore.updateRoleModules(payload);
    success({ message: "Privileges updated successfully" });
    savedAllowedModuleIds.value = [...allowedModuleIds.value];
    await loadRolePrivileges(roleId);
  }
  catch (error: unknown) {
    showError({ message: getApiErrorMessage(error, "Failed to update privileges") });
  }
  finally {
    savingModules.value = false;
  }
}

function handleCreated(): void {
  isCreateModalOpen.value = false;
  getRoles();
}

const selectedRole = computed(() =>
  roles.value.find(r => r.id === selectedRoleId.value),
);

onMounted(() => {
  getRoles();
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Roles & Permissions
      </template>
      <template #description>
        Manage roles and assign module permissions. Select a role on the left, then toggle permissions on the right.
      </template>
      <template #actions>
        <base-button
          v-if="can(PERMISSIONS_ADMINS.ROLES_PERMISSIONS_ADD_ROLE)"
          variant="outline"
          size="md"
          :trailing-icon="ICONS.PLUS"
          @click="isCreateModalOpen = true"
        >
          Add Role
        </base-button>
      </template>
    </base-page-header>

    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-4 sm:p-6 flex flex-col gap-4 page-content-height">
      <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 flex-1 min-h-0">
        <div class="flex flex-col rounded-lg border border-border bg-muted/30 overflow-hidden min-h-0">
          <div class="px-4 py-3 border-b border-border bg-muted/50 flex items-center h-11">
            <h2 class="text-sm font-semibold text-foreground">
              Roles
            </h2>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            <template v-if="loadingRoles">
              <div class="flex items-center justify-center py-8">
                <UIcon :name="ICONS.REFRESH_CW" class="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </template>
            <template v-else-if="roles.length === 0">
              <p class="text-sm text-muted-foreground text-center py-6">
                No roles yet. Add a role to get started.
              </p>
            </template>
            <template v-else>
              <button
                v-for="role in roles"
                :key="role.id"
                type="button"
                class="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between gap-2"
                :class="selectedRoleId === role.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'"
                @click="selectRole(role)"
              >
                <span>{{ role.name }}</span>
                <UIcon
                  v-if="selectedRoleId === role.id"
                  :name="ICONS.CHECK"
                  class="w-4 h-4 shrink-0"
                />
              </button>
            </template>
          </div>
        </div>

        <div class="flex flex-col rounded-lg border border-border bg-muted/30 overflow-hidden min-h-0 min-w-0">
          <div class="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between gap-2 min-h-11 h-11">
            <div class="flex items-center gap-2 min-w-0">
              <h2 class="text-sm font-semibold text-foreground shrink-0">
                Permissions
              </h2>
              <base-badge
                v-if="selectedRole"
                color="primary"
                class="text-xs shrink-0"
              >
                {{ selectedRole.name }}
              </base-badge>
            </div>
            <div class="flex justify-end">
              <base-button
                v-if="can(PERMISSIONS_ADMINS.ROLES_PERMISSIONS_UPDATE) && selectedRoleId != null && hasChanges"
                size="sm"
                variant="outline"
                :loading="savingModules"
                @click="savePrivileges"
              >
                Save Changes
              </base-button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <template v-if="selectedRoleId == null">
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <UIcon :name="ICONS.SHIELD_CHECK" class="w-12 h-12 text-muted-foreground mb-3" />
                <p class="text-sm font-medium text-foreground">
                  Select a role
                </p>
                <p class="text-sm text-muted-foreground mt-1">
                  Choose a role from the list on the left to view and edit its privileges.
                </p>
              </div>
            </template>
            <template v-else-if="loadingModules">
              <div class="flex items-center justify-center py-8">
                <UIcon :name="ICONS.REFRESH_CW" class="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </template>
            <template v-else>
              <UTree
                v-if="treeItems.length > 0"
                :items="treeItems"
                :get-key="getTreeItemKey"
                :disabled="savingModules"
                class="border-0 p-0"
              >
                <template #item-leading="{ item }">
                  <UCheckbox
                    :model-value="allowedModuleIds.includes(item.id)"
                    :aria-label="`Allow ${item.label}`"
                    class="shrink-0"
                    @click.stop
                    @update:model-value="toggleModule(item.id)"
                  />
                </template>
              </UTree>
              <p v-else class="text-sm text-muted-foreground py-4">
                No modules available for this role.
              </p>
            </template>
          </div>
        </div>
      </div>
    </div>

    <system-admin-role-create-modal
      :open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="handleCreated"
    />
  </div>
</template>
