/**
 * System admin types for roles and admins
 */

export type SystemAdminRole = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  users: {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    role: string;
    adminRoleId: number;
    isActive: boolean;
    lastLoginAt: string;
  }[];
};

export type RolesCatalog = Record<string, string[]>;

export type ModuleTreeItem = {
  label: string;
  id: number;
  children?: ModuleTreeItem[];
  defaultExpanded?: boolean;
};

export type SystemAdmin = {
  id: number;
  adminRoleId: number | null;
  email: string;
  fullName?: string;
  name?: string;
  phoneNumber?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  adminRoleId?: number | null;
  isActive?: boolean;
  role_id?: number | null;
  phone?: string | null;
  is_active?: boolean;
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
