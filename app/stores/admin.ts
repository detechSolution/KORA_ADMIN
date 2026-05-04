import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";
import type {
  RolesCatalog,
  SystemAdmin,
  SystemAdminRole,
  UpdateAdminPayload,
} from "~/types/system-admin";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { buildQueryString } from "~/utils/common";

type AdminDateRange = {
  start: string | null;
  end?: string | null;
};

export const useAdminStore = defineStore("admin", () => {
  const http = getHttp();
  const roles = ref<SystemAdminRole[]>([]);

  const rolesCatalog = ref<RolesCatalog>({});

  const admins = ref<{
    data: SystemAdmin[];
    pagination: {
      page: number;
      itemsPerPage: number;
      total: number;
    };
  }>({
    data: [],
    pagination: {
      page: 1,
      itemsPerPage: 10,
      total: 0,
    },
  });

  const fetchRoles = async (): Promise<void> => {
    try {
      const response = await http.get(API_ENDPOINTS.SYSTEM_ADMIN.ROLES.GET_ROLES) as any;
      roles.value = response?.data || [];
    }
    catch (error) {
      console.error("Failed to fetch roles:", error);
      throw error;
    }
  };

  const fetchRolesCatalog = async (): Promise<void> => {
    try {
      const response = await http.get(API_ENDPOINTS.SYSTEM_ADMIN.ROLES.GET_ROLES_CATALOG, {}) as any;
      rolesCatalog.value = response?.data ?? response ?? {};
    }
    catch (error) {
      console.error("Failed to fetch roles catalog:", error);
      throw error;
    }
  };
  const createRole = async (payload: { name: string; description: string; permissions: string[] }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.SYSTEM_ADMIN.ROLES.CREATE_ROLE, payload);
    }
    catch (error) {
      console.error("Failed to create role:", error);
      throw error;
    }
  };

  const fetchAdmins = async (payload: {
    pagination: { page: number };
    search?: string;
    status?: string | null;
    dateRange?: AdminDateRange | null;
  }): Promise<void> => {
    const search = payload.search?.trim();
    const query = buildQueryString({
      q: search,
      status: payload.status || undefined,
      isActive: payload.status === "active" ? true : payload.status === "inactive" ? false : undefined,
      createdFrom: payload.dateRange?.start,
      createdTo: payload.dateRange?.end,
    });
    const endpoint = query
      ? `${API_ENDPOINTS.SYSTEM_ADMIN.ADMINS.GET_ADMINS}?${query}`
      : API_ENDPOINTS.SYSTEM_ADMIN.ADMINS.GET_ADMINS;
    try {
      const response = await http.get(endpoint) as ApiResponse;

      admins.value = {
        data: (response?.data || []) as SystemAdmin[],
        pagination: {
          page: response.meta.page,
          itemsPerPage: response.meta.limit,
          total: Number(response?.meta?.total) || 0,
        },
      };
    }
    catch (error) {
      console.error("Failed to fetch admins:", error);
      throw error;
    }
  };

  const createAdmin = async (payload: { fullName: string; phoneNumber: string; email: string; adminRoleId: string; isActive: boolean }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.SYSTEM_ADMIN.ADMINS.CREATE_ADMIN, payload);
    }
    catch (error) {
      console.error("Failed to create admin:", error);
      throw error;
    }
  };

  const updateAdmin = async (payload: UpdateAdminPayload): Promise<void> => {
    try {
      const { admin_id, ...data } = payload;
      await http.patch(API_ENDPOINTS.SYSTEM_ADMIN.ADMINS.UPDATE(admin_id), data);
    }
    catch (error) {
      console.error("Failed to update admin:", error);
      throw error;
    }
  };

  return {
    roles,
    rolesCatalog,
    admins,
    fetchRoles,
    fetchRolesCatalog,
    createRole,
    fetchAdmins,
    createAdmin,
    updateAdmin,
  };
});
