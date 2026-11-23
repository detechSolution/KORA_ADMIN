export type ManualBookingClient =
  | { kind: "existing"; memberId: number }
  | { kind: "new"; fullName: string; email: string; phoneNumber?: string };

export type CreateManualBookingPayload = {
  client: ManualBookingClient;
  item: CreateManualBookingItem | CreateManualBookingItem[];
  bookingDate?: string;
  bookingTime?: string;
  roomType?: "private" | "shared";
  promoCode?: string;
  paymentMethod: string;
};

export type CreateManualBookingItem = { id: number; name: string; type: string; quantity?: number };

// Kept for the older, unlinked form components while they are phased out.
export type CreateNewClientBookingPayload = {
  itemType: CreateManualBookingItem | CreateManualBookingItem[];
  bookingDate: string;
  bookingTime?: string;
  roomType?: "private" | "shared";
  fullName: string;
  phoneNumber?: string;
  email: string;
  promoCode?: string;
  paymentMethod: string;
};

export type CreateExistingMemberBookingPayload = {
  selectedMemberId: number;
  item: CreateManualBookingItem[];
  bookingDate?: string;
  bookingTime?: string;
  roomType?: "private" | "shared";
  promoCode?: string;
  paymentMethod: string;
};

export type ServiceState = {
  serviceType: string;
  serviceId: number | undefined;
  durationId: number | null;
  roomType: "private" | "shared";
  date: string;
  time: string;
  sessionQuantity?: number | null;
  resolvedItemId?: number | null;
  resolvedItemName?: string;
  resolvedItemType?: string;
  resolvedPrice?: number;
  resolvedDiscountPercent?: number;
  resolvedDurationLabel?: string;
};

export type BookingParticipant = {
  name: string;
  email: string;
  phoneNumber: string;
};

export type BookingLine = {
  id: number;
  lineType: "session" | "spa" | "pass";
  sessionType?: "class" | "event" | "workshop" | string | null;
  referenceId: number;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  roomType: string | null;
  quantity: number;
  quantityCancelled: number;
  remainingQuantity: number;
  status: "confirmed" | "partly_cancelled" | "cancelled";
  unitRate: number;
  discountAmount: number;
  lineTotal: number;
};

export type Booking = {
  id: number;
  bookingCode: string;
  lines: BookingLine[];
  status: string;
  bookedDate: string | number;
  visitorCount: number;
  participantCount: number;
  participants: BookingParticipant[];
  createdByStaffId?: number | null;
  createdByStaff?: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    role: string;
  } | null;
  amount: number;
  clientName?: string;
  clientEmail?: string;
  clientPhoneNumber?: string;
  visitors?: any[];
  invoicePdfUrl?: string;
  currency?: string;
  paymentId?: number | null;
  tiggInvoiceId?: string | null;
  tiggInvoiceCode?: string | null;
};

export type BookingDetails = Booking & {
  booker?: { fullName: string | null; email: string | null; phoneNumber: string | null };
};

export type BookingDisplayItem = {
  id: number;
  itemType: string;
  title: string;
  scheduledAt: string | null;
  quantity: number;
  status: string;
  unitAmount: number;
  totalAmount: number;
  currency: string;
  quantityCancelled: number;
  remainingQuantity: number;
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
    availability?: number;
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
