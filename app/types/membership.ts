export type MemberGuestOptionType =
  | "membership_plan_user"
  | "pass_user"
  | "member"
  | "guest"
  | "user"
  | "system_user";

export type MemberBookingOption = {
  id: number;
  memberId: number | null;
  userId: number;
  type: MemberGuestOptionType | string;
  role: string;
  label: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  membershipPlanId: number | null;
  membershipPlanName: string | null;
  passId: number | null;
  passName: string | null;
  startDate: string | null;
  endDate: string | null;
  membershipBenefits?: Record<string, number>;
  guestBenefits?: Record<string, number>;
  passBenefits?: Record<string, number>;
};

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
  minimumFreezeDays?: number;
  spaBenefit: number;
  classBenefit: number;
  eventBenefit: number;
  workshopBenefit: number;
  spaGuestBenefit: number;
  classGuestBenefit: number;
  eventGuestBenefit: number;
  workshopGuestBenefit: number;
  maxVisitors: number;

  isPurchasable: boolean;
  options: MembershipPlanOption[];
};

export type CreateMembershipPlanPayload = {
  name: string;
  description: string;
  isPurchasable: boolean;
  // capacity: number;
  isFreezable: boolean;
  maxVisitors: number;
  freezeDays: number;
  minimumFreezeDays?: number;
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
