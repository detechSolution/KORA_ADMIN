export type PromoCode = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  redemptionLimit: number;
  redemptionCount: number;
  expiresAt: string;
  isActive: boolean;
};

export type CreatePromoCodePayload = {
  code: string;
  discountType: string;
  discountValue: number;
  redemptionLimit: number;
  expiresAt: string;
  isActive: boolean;
};

export type UpdatePromoCodePayload = CreatePromoCodePayload & {
  id: string;
};
