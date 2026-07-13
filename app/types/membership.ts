export type MembershipPlanOption = {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  frequency: string;
  customDays?: number | null;
  isFreezeable: boolean;
  price: number;
  memberBenefit: number;
  isVisible: boolean;
  sortOrder?: number;
  durationDays?: number;
  membershipPlanOptionId?: number;
  membershipPlanId?: number;
};

export type MembershipPlan = {
  id: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  name: string;
  description: string;
  freezeDays: number;
  spaBenefit: number;
  classBenefit: number;
  eventBenefit: number;
  workshopBenefit: number;
  spaGuestBenefit: number;
  classGuestBenefit: number;
  eventGuestBenefit: number;
  workshopGuestBenefit: number;
  maxVisitors: number;

  isActive: boolean;
  options: MembershipPlanOption[];
};

export type MemberBenefits = {
  spa: number;
  class: number;
  event: number;
  workshop: number;
};

export type CreateMembershipPlanPayload = {
  name: string;
  description: string;
  isActive: boolean;
  // capacity: number;
  isFreezable: boolean;
  maxVisitors: number;
  freezeDays: number;
  spaBenefit: number;
  classBenefit: number;
  eventBenefit: number;
  workshopBenefit: number;
  spaGuestBenefit: number;
  classGuestBenefit: number;
  eventGuestBenefit: number;
  workshopGuestBenefit: number;
  options: Array<{
    frequency: string;
    customDays?: number | null;
    price: number;
    isVisible: boolean;
  }>;
};

type User = {
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
  membershipPlanOptionId?: number;
  membershipPlanId?: number;
};

export type UpdateMembershipPlanPayload = CreateMembershipPlanPayload;
