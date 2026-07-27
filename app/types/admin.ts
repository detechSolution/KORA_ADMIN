export type Admin = {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  adminRoleId: number;
  isActive: boolean;
  adminRole?: {
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type AdminRole = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type RolesCatalog = {
  permissions: string[];
};

export type UpdateAdminPayload = {
  admin_id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  adminRoleId: number;
  isActive: boolean;
};
