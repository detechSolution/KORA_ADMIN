import { defineStore } from "pinia";
import { ref } from "vue";

import type {
  CreateAdminPayload,
  CreateRolePayload,
  RoleModule,
  RoleModulesResponse,
  SystemAdminAdmin,
  SystemAdminRole,
  UpdateAdminPayload,
} from "~/types/system-admin";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";

export const useSystemAdminStore = defineStore("system-admin", () => {
  const http = getHttp();

  const roles = ref<SystemAdminRole[]>([]);
  const modulesNameList = ref<any[]>([]);
  const admins = ref<{
    data: SystemAdminAdmin[];
    total: number;
  }>({
    data: [],
    total: 0,
  });

  const getRoles = async (): Promise<void> => {
    try {
      const res = await http.post(API_ENDPOINTS.SYSTEM_ADMIN.ROLES.GET_LIST, {}) as { data?: SystemAdminRole[] };
      roles.value = res.data || [];
    }
    catch (error: unknown) {
      console.error(error, "Get Roles Error");
      throw error;
    }
  };

  const createRole = async (payload: CreateRolePayload): Promise<{ id?: number }> => {
    try {
      const res = await http.post(API_ENDPOINTS.SYSTEM_ADMIN.ROLES.BASE, payload) as { data?: { id: number } };
      return res.data ? { id: res.data.id } : {};
    }
    catch (error: unknown) {
      console.error(error, "Create Role Error");
      throw error;
    }
  };

  const getAdmins = async (payload: {
    pagination: { page: number; limit: number };
    is_active?: boolean | null;
  }): Promise<void> => {
    try {
      const res = await http.post(API_ENDPOINTS.SYSTEM_ADMIN.ADMINS.GET_LIST, payload) as {
        data?: SystemAdminAdmin[];
        total_count?: number;
      };
      admins.value = {
        data: res.data || [],
        total: res.total_count ?? 0,
      };
    }
    catch (error: unknown) {
      console.error(error, "Get Admins Error");
      throw error;
    }
  };

  const createAdmin = async (payload: CreateAdminPayload): Promise<{ id?: number }> => {
    try {
      const res = await http.post(API_ENDPOINTS.SYSTEM_ADMIN.ADMINS.BASE, payload) as { data?: { id: number } };
      return res.data ? { id: res.data.id } : {};
    }
    catch (error: unknown) {
      console.error(error, "Create Admin Error");
      throw error;
    }
  };

  const updateAdmin = async (payload: UpdateAdminPayload): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.SYSTEM_ADMIN.ADMINS.UPDATE, payload);
    }
    catch (error: unknown) {
      console.error(error, "Update Admin Error");
      throw error;
    }
  };

  const getModulesList = async (payload: { role_id?: number }): Promise<RoleModulesResponse> => {
    try {
      const res = await http.post(API_ENDPOINTS.SYSTEM_ADMIN.MODULES.GET_LIST, payload) as {
        data?: { list?: RoleModule[]; allowedModules?: number[] };
      };
      return {
        list: res.data?.list ?? [],
        allowedModules: res.data?.allowedModules ?? [],
      } as RoleModulesResponse;
    }
    catch (error: unknown) {
      console.error(error, "Get Modules List Error");
      throw error;
    }
  };

  /** Fetch modules and allowed module IDs for a role. */
  const getRoleModules = async (payload: { role_id: number | null }): Promise<RoleModulesResponse> => {
    try {
      const res = await http.post(API_ENDPOINTS.SYSTEM_ADMIN.MODULES.GET_LIST, payload) as {
        data?: { list?: RoleModule[]; allowedModules?: number[] };
      };
      return {
        list: res.data?.list ?? [],
        allowedModules: res.data?.allowedModules ?? [],
      };
    }
    catch (error: unknown) {
      console.error(error, "Get Role Modules Error");
      throw error;
    }
  };

  const setRoleModules = async (payload: { role_id: number; module_ids: number[] }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.SYSTEM_ADMIN.MODULES.SET_ROLE_MODULES, payload);
    }
    catch (error: unknown) {
      console.error(error, "Set Role Modules Error");
      throw error;
    }
  };

  const updateRoleModules = async (payload: { role_id: number; module_ids: number[] }): Promise<void> => {
    try {
      await http.post(API_ENDPOINTS.SYSTEM_ADMIN.ROLES.UPDATE_MODULES, payload);
    }
    catch (error: unknown) {
      console.error(error, "Update Role Modules Error");
      throw error;
    }
  };

  const getModuleNameList = async (): Promise<void> => {
    try {
      const res = await http.post(API_ENDPOINTS.SYSTEM_ADMIN.MODULES.GET_NAME_LIST, {}) as { data?: any[] };
      modulesNameList.value = res.data || [];
    }
    catch (error: unknown) {
      console.error(error, "Get Module Name List Error");
      throw error;
    }
  };

  const clearAdminsData = () => {
    admins.value = { data: [], total: 0 };
  };

  return {
    roles,
    admins,
    modulesNameList,
    getRoles,
    createRole,
    getAdmins,
    createAdmin,
    updateAdmin,
    clearAdminsData,
    getModulesList,
    getRoleModules,
    updateRoleModules,
    getModuleNameList,
    setRoleModules,
  };
});
