import { computed } from "vue";

import { useAuthStore } from "~/stores/auth";

/**
 * Composable for permission-based access control.
 * Permissions are loaded with the user via auth/me and stored in the auth store.
 * Use can(permission) to gate UI or logic; use refreshPermissions() to re-fetch user + permissions.
 */
export function usePermission() {
  const authStore = useAuthStore();
  const permissions = computed(() => authStore.permissions);

  /** Check if the current user has the given permission. */
  function can(permission: string): boolean {
    if (!permission)
      return true;
    return authStore.permissions.includes(permission);
  }

  /**
   * Re-fetch user and permissions from the API (auth/me).
   * Call after login or when permissions may have changed on the server.
   */
  async function refreshPermissions(): Promise<void> {
    await authStore.checkAuth(true);
  }

  return {
    permissions,
    can,
    refreshPermissions,
  };
}
