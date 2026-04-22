import { defineStore } from "pinia";
import { ref } from "vue";

import type {
  RolesCatalog,
  SystemAdminRole,
} from "~/types/system-admin";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useAdminStore = defineStore("admin", () => {
  const http = getHttp();
  const roles = ref<SystemAdminRole[]>([]);
  const rolesCatalog = ref<RolesCatalog>({});

  const fetchRoles = async (): Promise<void> => {
    try {
      const response = await http.get(API_ENDPOINTS.SYSTEM_ADMIN.ROLES.GET_ROLES, {}) as {
        data: SystemAdminRole[];
      };
      roles.value = response?.data;
    }
    catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };
  const fetchRolesCatalog = async (): Promise<void> => {
    try {
      const response = await http.get(API_ENDPOINTS.SYSTEM_ADMIN.ROLES.GET_ROLES_CATALOG, {}) as any;
      rolesCatalog.value = response?.data ?? response ?? {};
    }
    catch (error) {
      console.error("Failed to fetch roles catalog:", error);
    }
  };
  const createRole = async (payload: { name: string; description: string; permissions: string[] }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.SYSTEM_ADMIN.ROLES.CREATE_ROLE, payload);
    }
    catch (error) {
      console.error("Failed to create role:", error);
    }
  };

  return {
    roles,
    rolesCatalog,
    fetchRoles,
    fetchRolesCatalog,
    createRole,
  };
});
