export type AccessCard = {
  id: number;
  userType: "existing_user" | "non_existing_user";
  userId: number | null;
  fullName: string;
  phoneNumber: string;
  email?: string;
  cardNumber: string;
  doorNumbers: number[];
  doorAccess: string[];
  validFrom: string | null;
  validUntil: string | null;
  expiryDate: string | null;
  removeExpiration: boolean;
  validity: "valid" | "invalid";
  lastSyncedAt?: string;
  controllerSerial?: string;
};

export type AccessControlUserOption = {
  label: string;
  value: string | number;
};

export type CreateAccessCardPayload = {
  userType: "existing_user" | "non_existing_user";
  userId?: string | number | null;
  fullName?: string;
  phoneNumber?: string;
  cardNumber: string;
  doorNumbers: number[];
  validFrom?: string | null;
  validUntil?: string | null;
  removeExpiration?: boolean;
};
