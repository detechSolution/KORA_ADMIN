<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import type { RolesCatalog, SystemAdminRole } from "~/types/system-admin";

import { ICONS } from "~/config/icons";
import { PERMISSIONS_ADMINISTRATION } from "~/config/permissions";
import { useAdminStore } from "~/stores/admin";
import { getApiErrorMessage } from "~/utils/error";

// --- Types ---
type PermissionTreeItem = {
  label: string;
  permissionKey?: string;
  children?: PermissionTreeItem[];
  defaultExpanded?: boolean;
};

// --- Page Meta ---
definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "administration.roles.view",
});

// --- Stores & Composables ---
const adminStore = useAdminStore();
const { error: showError, success } = useNotification();

// --- State ---
const loadingRoles = ref(false);
const loadingRolesCatalog = ref(false);
const savingPermissions = ref(false);
const isEditing = ref(true);
const { can } = usePermission();
const selectedRoleId = ref<number | null>(null);
const draftPermissions = ref<string[]>([]);
const savedPermissions = ref<string[]>([]);

// --- Computed Properties ---
const roles = computed(() => adminStore.roles);
const rolesCatalog = computed(() => adminStore.rolesCatalog);

const selectedRole = computed<SystemAdminRole | undefined>(() =>
  roles.value.find(role => role.id === selectedRoleId.value),
);

const treeItems = computed(() => buildPermissionTree(rolesCatalog.value));

/**
 * Checks if the draft permissions have diverged from the currently saved permissions.
 */
const hasChanges = computed(() => {
  if (draftPermissions.value.length !== savedPermissions.value.length)
    return true;

  const current = new Set(draftPermissions.value);
  const saved = new Set(savedPermissions.value);

  if (current.size !== saved.size)
    return true;

  for (const permission of current) {
    if (!saved.has(permission))
      return true;
  }

  return false;
});

// --- Tree Building Helpers ---

/**
 * Formats a permission segment into a human-readable title
 * e.g., "roles_view" -> "Roles View"
 */
function formatPermissionLabel(segment: string): string {
  return segment
    .replace(/([A-Z])/g, " $1") // split camelCase
    .replace(/_/g, " ") // replace underscores
    .replace(/^./, str => str.toUpperCase()) // capitalize first letter
    .trim();
}

/**
 * Constructs the tree structure from the nested roles catalog to display in the UI.
 * Creates a two-level deep nested structure grouping permissions.
 */
function buildPermissionTree(catalog: RolesCatalog): PermissionTreeItem[] {
  const treeItems = Object.entries(catalog).map(([groupKey, permissions]) => {
    return {
      id: groupKey,
      label: formatPermissionLabel(groupKey),
      defaultExpanded: true,
      children: (permissions as string[]).map((permission) => {
        // Remove the groupKey prefix if present for cleaner display strings
        let displayStr = permission;
        const prefix = `${groupKey}.`;

        if (displayStr.startsWith(prefix)) {
          displayStr = displayStr.slice(prefix.length);
        }

        return {
          id: permission,
          label: displayStr.split(".").map(formatPermissionLabel).join(" "),
          permissionKey: permission,
        };
      }),
    };
  });

  return treeItems;
}

function getTreeItemKey(item: PermissionTreeItem): string {
  return item.id;
}

// --- Permission Manipulation Logic ---

/**
 * Collects all child `permissionKey`s mapped to a specific tree item.
 */
function collectPermissionKeys(item: PermissionTreeItem): string[] {
  const permissionKeys = item.permissionKey ? [item.permissionKey] : [];

  for (const child of item.children ?? []) {
    permissionKeys.push(...collectPermissionKeys(child));
  }

  return permissionKeys;
}

/**
 * Checks if the parent group node has all underlying permissions active.
 */
function isPermissionChecked(item: PermissionTreeItem): boolean {
  const permissionKeys = collectPermissionKeys(item);
  if (permissionKeys.length === 0)
    return false;

  return permissionKeys.every(permission => draftPermissions.value.includes(permission));
}

/**
 * Checks if the parent group node has a subset representing a partially checked state.
 */
function isPermissionIndeterminate(item: PermissionTreeItem): boolean {
  const permissionKeys = collectPermissionKeys(item);
  if (permissionKeys.length === 0)
    return false;

  const checkedCount = permissionKeys.filter(permission => draftPermissions.value.includes(permission)).length;
  return checkedCount > 0 && checkedCount < permissionKeys.length;
}

/**
 * Toggles an entire parent branch or leaf permission key.
 */
function updatePermissionGroup(item: PermissionTreeItem, isEnabled: boolean): void {
  isEditing.value = true;
  const permissionKeys = collectPermissionKeys(item);
  if (permissionKeys.length === 0)
    return;

  const nextPermissions = new Set(draftPermissions.value);
  for (const permission of permissionKeys) {
    if (isEnabled)
      nextPermissions.add(permission);
    else nextPermissions.delete(permission);
  }

  draftPermissions.value = Array.from(nextPermissions);
}

/**
 * Synchonizes internal state when user changes the active role on the left panel.
 */
function syncSelectedRolePermissions(role?: SystemAdminRole): void {
  const permissions = [...(role?.permissions ?? [])];
  draftPermissions.value = permissions;
  savedPermissions.value = permissions;
  isEditing.value = true;
}

// --- API Interactions ---

async function fetchRoles(): Promise<void> {
  try {
    loadingRoles.value = true;
    await adminStore.fetchRoles();

    if (selectedRoleId.value == null && roles.value?.length > 0) {
      selectedRoleId.value = roles.value[0].id;
    }
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to load roles") });
  }
  finally {
    loadingRoles.value = false;
  }
}

async function fetchRolesCatalog(): Promise<void> {
  try {
    loadingRolesCatalog.value = true;
    await adminStore.fetchRolesCatalog();
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to load roles catalog") });
  }
  finally {
    loadingRolesCatalog.value = false;
  }
}

async function handleSaveChanges(): Promise<void> {
  if (!selectedRole.value)
    return;

  try {
    savingPermissions.value = true;
    await adminStore.updateRole(selectedRole.value.id, {
      name: selectedRole.value.name,
      description: selectedRole.value.description,
      permissions: draftPermissions.value,
      isActive: selectedRole.value.isActive,
    });

    selectedRole.value.permissions = [...draftPermissions.value];
    savedPermissions.value = [...draftPermissions.value];
    isEditing.value = false;
    success({ message: "Permissions updated successfully" });
  }
  catch (error) {
    showError({ message: getApiErrorMessage(error, "Failed to update permissions") });
  }
  finally {
    savingPermissions.value = false;
  }
}

// --- Watchers & Lifecycle ---
watch(roles, (value) => {
  if (value.length === 0) {
    selectedRoleId.value = null;
    return;
  }

  // Graceful fallback to select first item if roles dynamically shrink and previously selected ID is absent
  const hasSelectedRole = value.some(role => role.id === selectedRoleId.value);
  if (!hasSelectedRole) {
    selectedRoleId.value = value[0].id;
  }
}, { immediate: true });

watch(selectedRole, role => syncSelectedRolePermissions(role), { immediate: true });

onMounted(() => {
  fetchRoles();
  fetchRolesCatalog();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <base-page-header>
      <template #title>
        Create New Role
      </template>
      <template #description>
        Create and manage roles
      </template>

      <template #actions>
        <NuxtLink
          v-if="can(PERMISSIONS_ADMINISTRATION.ROLES_CREATE)"
          to="/administration/create-role"
        >
          <base-button
            variant="solid"
            size="lg"
            :trailing-icon="ICONS.PLUS"
          >
            Create Role
          </base-button>
        </NuxtLink>
      </template>
    </base-page-header>

    <div class="bg-white rounded-xl flex flex-col h-full md:max-h-[calc(100vh-180px)] md:overflow-auto md:flex-row gap-4 md:gap-6 p-4 md:p-6 min-h-0 flex-1">
      <!-- left section where roles are displayed -->
      <div
        class="
        flex md:flex-col gap-4
        w-full md:w-72 lg:w-80 xl:w-96
        shrink-0
        overflow-x-auto md:overflow-x-hidden
        overflow-y-hidden md:overflow-y-auto
        pb-2 md:pb-0
      "
      >
        <roles-role-card
          v-for="role in roles"
          :id="role.id"
          :key="role.id"
          :name="role.name"
          :description="role.description"
          :operators="role.users.length"
          :is-active="role.id === selectedRoleId"
          @click="selectedRoleId = role.id"
        />
      </div>

      <!-- Righ Section where permission tree is shown  -->
      <div class="flex flex-col flex-1 min-w-0 gap-6 overflow-y-auto">
        <div class="bg-stone-50 rounded-lg p-4 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <UIcon :name="ICONS.INFO" class="text-primary" />
            <h3 class="text-sm text-secondary font-medium">
              Edit Permissions
            </h3>
          </div>
          <p class="text-secondary-500 text-xs">
            Compare the selected role against the permissions catalog, then check or uncheck access as needed.
          </p>
        </div>

        <div class="flex justify-between items-center gap-3">
          <h2 class="text-secondary-900 text-base font-medium">
            Permissions
          </h2>

          <base-button
            v-if="isEditing && selectedRole && hasChanges"
            variant="link"
            class="text-primary"
            size="md"
            :trailing-icon="ICONS.SAVE"
            :loading="savingPermissions"
            @click="handleSaveChanges"
          >
            Save Changes
          </base-button>
        </div>

        <div
          v-if="selectedRole && hasChanges"
          class="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2"
        >
          <UIcon :name="ICONS.WARNING" class="h-4 w-4" />
          <p class="text-wrap text-xs">
            You have unsaved changes to permissions. Don't forget to save your changes.
          </p>
        </div>

        <div class="border-border border rounded-sm p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          <template v-if="loadingRoles || loadingRolesCatalog">
            <div class="flex items-center justify-center py-8">
              <UIcon :name="ICONS.REFRESH_CW" class="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          </template>

          <template v-else-if="!selectedRole">
            <div class="text-sm text-secondary-500 bg-stone-50 rounded-lg p-4">
              Select a role to view its permissions.
            </div>
          </template>

          <UTree
            v-else
            :items="treeItems"
            :get-key="getTreeItemKey"
            class="border-0 p-0"
          >
            <template #item-leading="{ item }">
              <UCheckbox
                :disabled="!can(PERMISSIONS_ADMINISTRATION.ROLES_UPDATE)"
                :model-value="isPermissionChecked(item)"
                :indeterminate="isPermissionIndeterminate(item)"
                :aria-label="`Permission ${item.label}`"
                class="shrink-0"
                @click.stop
                @update:model-value="updatePermissionGroup(item, $event === true)"
              />
            </template>
          </UTree>
        </div>
      </div>
    </div>
  </div>
</template>
