export type MembershipPlanOption = {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  membershipPlanId?: number;
  frequency: string;
  customDays?: number | null;
  price: number;
  memberBenefit: number;
  isVisible: boolean;
  sortOrder?: number;
  durationDays?: number;
};

export type PlanOption = MembershipPlanOption;

export type MembershipPlan = {
  id: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  name: string;
  description: string;
  isActive: boolean;
  options: MembershipPlanOption[];
};

export type CreateMembershipPlanPayload = {
  name: string;
  description: string;
  isActive: boolean;
  options: MembershipPlanOption[];
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

export type CreateMemberPayload = {
  fullName: string;
  phoneNumber: string;
  email: string;
  identificationDocument: File;
  membershipPlanOptionId: number;
  subscriptionStartDate: string;
  paymentMethod: string;
};

export type UpdateMembershipPlanPayload = CreateMembershipPlanPayload;
