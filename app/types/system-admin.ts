/**
 * System admin types for roles and admins
 */

export type SystemAdminRole = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type SystemAdminAdmin = {
  id: number;
  role_id: number | null;
  email: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role_name: string;
};

export type CreateRolePayload = {
  name: string;
};

export type CreateAdminPayload = {
  role_id: number | null;
  email: string;
  password: string;
  name: string;
  phone: string | null;
  is_active?: boolean;
};

export type UpdateAdminPayload = {
  admin_id: number;
  role_id: number | null;
  phone: string | null;
  is_active: boolean;
};

/** Role module (privilege) from modules/getList */
export type RoleModule = {
  id: number;
  name: string;
  display_name: string;
  parent_id: number | null;
  sort_order: number;
  created_at?: string;
  children: RoleModule[];
};

/** Response from modules/getList (with optional role_id for allowedModules) */
export type RoleModulesResponse = {
  list: RoleModule[];
  allowedModules: number[];
};
