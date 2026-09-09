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

export type SpaCategory = {
  id: number;
  name: string;
};

export type SpaCategoryOption = {
  label: string;
  value: number;
};

export type SpaStepItem = {
  title: string;
  description: string;
  detail: string;
};

export type CreateSpaCategoryPayload = {
  name: string;
};

export type SpaResponse = Spa | {
  spa?: Spa;
  subTypes?: SpaSubType[];
};

export type SpaCategoryListResponse = SpaCategory[] | {
  categories?: SpaCategory[];
  data?: SpaCategory[];
};

export type SpaCategoryResponse = SpaCategory | {
  category?: SpaCategory;
  data?: SpaCategory;
};

export type SpaSubTypeResponse = SpaSubType | {
  subType?: SpaSubType;
  data?: SpaSubType;
};

export type SpaSubType = {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  spaId: number;
  categoryId?: number;

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
  categoryId: number;
  name: string;
  description: string;
  prices: {
    duration: number;
    timeUnit: TimeUnit;
    price: number;
  }[];
};

export type UpdateSpaSubTypePayload = Omit<CreateSpaSubTypePayload, "categoryId"> & {
  categoryId?: number;
};

export type UpdateSpaPayload = {
  availableDays: Day[];
  availableFromTime: string;
  availableToTime: string;
  capacityPerSlot: number;
  video?: File | null;
  file?: File | null;
  description: string;
};
