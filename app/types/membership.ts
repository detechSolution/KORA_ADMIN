export type PlanOption = {
  frequency: string;
  customDays?: number;
  price: number;
  memberBenefit: number;
  isVisible: boolean;
};

export type MembershipPlan = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  options: PlanOption[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CreateMembershipPlanPayload = {
  name: string;
  description: string;
  isActive: boolean;
  options: PlanOption[];
};

export type User = {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Member = {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: User;
};

export type UpdateMembershipPlanPayload = CreateMembershipPlanPayload;
