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

export type SystemAdmin = {
  id: number;
  adminRoleId: number | null;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role_name: string;
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
