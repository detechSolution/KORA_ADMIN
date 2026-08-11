export type AccessCard = {
  id: number;
  client: { name: string; phone: string; initials: string };
  cardNumber: string;
  expiryDate: string | null;
  expiryLabel: string;
  doorAccess: string;
  additionalDoors?: number;
  validity: "valid" | "invalid";
};

export type AccessControlUserOption = {
  label: string;
  value: string | number;
};

export type AccessControlQuery = Record<string, string | number | boolean | null | undefined>;

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

export type AccessCardApiRecord = {
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
