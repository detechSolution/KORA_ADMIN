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

export type UpdateMembershipPlanPayload = CreateMembershipPlanPayload;
