export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type TimeUnit = "minutes" | "hours";

export type Spa = {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  name: string;
  description: string | null;

  bannerUrl: string;
  bannerKey: string;
  videoUrl: string;

  availableDays: Day[];
  availableFromTime: string;
  availableToTime: string;

  capacityPerSlot: number;
  currency: string;

  updatedById: number;

  subTypes: SpaSubType[];
};

export type SpaSubType = {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  spaId: number;

  name: string;
  description: string;

  prices: SpaPrice[];
};

type SpaPrice = {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  subTypeId: number;

  duration: number;
  timeUnit: TimeUnit;
  price: number;
};

export type CreateSpaSubTypePayload = {
  name: string;
  description: string;
  prices: {
    duration: number;
    timeUnit: TimeUnit;
    price: number;
  }[];
};

export type UpdateSpaPayload = {
  availableDays: Day[];
  availableFromTime: string;
  availableToTime: string;
  capacityPerSlot: number;
  videoFile?: File | null;
  description: string;
};
