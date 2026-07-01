export type ServiceState = {
  serviceType: string;
  serviceId: number | undefined;
  durationId: number | null;
  date: string;
  time: string;
  resolvedItemId?: number | null;
  resolvedItemName?: string;
  resolvedItemType?: string;
  resolvedPrice?: number;
  resolvedDiscountPercent?: number;
  resolvedDurationLabel?: string;
};

export type VisitorState = ServiceState & {
  fullName: string;
  phoneNumber: string;
  email: string;
};

export type Booking = {
  id: number;
  bookingCode: string;
  itemName: string;
  itemType: string;
  status: string;
  bookedDate: string | number;
  bookedFor: string | number;
  visitorCount: number;
  participantCount: number;
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  visitors?: any[];
};

export type BookingItemGroup = {
  type: string;
  label: string;
  items: Array<{
    id: number;
    amount: number;
    name: string;
    occupied?: number;
    capacity?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export type PromoValidationResponse = {
  isValid: boolean;
  code: string;
  type: "fixed" | "percent";
  amount: number;
};

export type CreateNewClientBookingPayload = {
  itemType: {
    id: number;
    name: string;
    type: string;
  };
  bookingDate: string;
  bookingTime: string | undefined;
  fullName: string;
  phoneNumber?: string;
  email: string;
  promoCode?: string;
  paymentMethod: string;
};

export type CreateExistingMemberBookingPayload = {
  selectedMemberId: number;
  item?: {
    id: number;
    name: string;
    type: string;
  };
  bookingDate?: string;
  bookingTime?: string;
  visitors: Array<{
    fullName: string;
    phoneNumber: string;
    email: string;
    item: {
      id: number;
      name: string;
      type: string;
    };
    bookingDate: string;
    bookingTime?: string;
  }>;
  promoCode?: string;
  paymentMethod: string;
};
