export type KoraPass = {
  id: number;
  name: string;
  description: string | null;
  numberOfDays: number;
  price: number;
  isActive: boolean;
  isInvitation: boolean;
};

export type InvitationGuest = { fullName: string; email: string };
export type InvitationRequest = {
  passId: number;
  guests: InvitationGuest[];
  fromDate: string;
};
export type InvitationResult = {
  granted: {
    email: string;
    userId: number;
    userPassId: number;
    sentEmail: boolean;
  }[];
  skipped: { email: string; reason: string }[];
};
export type PassInvitee = {
  id: number;
  user: { fullName: string; email: string };
  startsOn: string;
  endsOn: string;
  status: "active" | "cancelled" | "expired";
  cancellationReason: string | null;
};
export type InvitationUpdate = {
  status?: "cancelled";
  startsOn?: string;
  endsOn?: string;
  emailGuest: boolean;
  notes?: string;
};
