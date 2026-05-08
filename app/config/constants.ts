/**
 * API Endpoints
 * Centralized API endpoint definitions
 */
export const API_ENDPOINTS = {
  ANALYTICS: {
    GET_STATS: "/api/v1/analytics/getSummary",
  },
  SESSION: {
    CREATE: "/api/v1/sessions",
    GET_LIST: "/api/v1/sessions",
    UPDATE: (id: number) => `/api/v1/sessions/${id}`,
    GET_ATTENDANCE_CANDIDATES: (id: number) => `/api/v1/sessions/${id}/attendance/candidates`,
  },
  KORA_PASSES: {
    GET_LIST: "/api/v1/kora-passes",
    CREATE: "/api/v1/kora-passes",
    UPDATE: (id: number) => `/api/v1/kora-passes/${id}`,
  },
  SPA: {
    GET_SPA: "/api/v1/spa",
    UPDATE_SPA: "/api/v1/spa",
    POST_SUB_TYPE: "/api/v1/spa/sub-types",
    UPDATE_SUB_TYPE: (id: number) => `/api/v1/spa/sub-types/${id}`,
    DELETE_SUB_TYPE: (id: number) => `/api/v1/spa/sub-types/${id}`,
    GET_SUB_TYPE: (id: number) => `/api/v1/spa/sub-types/${id}`,
  },
  COMMUNITIES: {
    CREATE: "/api/v1/communities",
    GET_LIST: "/api/v1/communities/getList",
    UPDATE_STATUS: "/api/v1/communities/updateStatus",
    UPDATE_SUBSCRIPTION_STATUS: "/api/v1/communities/subscription/update",
    GET_ACCOUNT_SUMMARY: (id: number) => `/api/v1/communities/${id}/getSummary`,
    GET_USAGE_SUMMARY: (id: number) => `/api/v1/communities/${id}/usageSummary`,
    GET_COMMUNITY_SUBSCRIPTION_PLAN: (id: number) => `/api/v1/communities/${id}/subscription`,
    GET_ADMINS: `/api/v1/communities/admins/getList`,
    ACTIVATE_ADMIN: `/api/v1/communities/admins/activate`,
  },
  AUTH: {
    LOGIN: "/api/v1/auth/admin/login",
    ME: "/api/v1/auth/me",
    REFRESH: "/api/v1/auth/refresh-token",
    UPDATE_PASSWORD: "/api/v1/auth/update-password",
    UPDATE_PROFILE: "/api/v1/auth/update-profile",
  },
  CONFIGURATION: {
    BILLABLE_ITEMS: "/api/v1/billable-items/getList",
    BILLABLE_ITEMS_CREATE: "/api/v1/billable-items",
    BILLABLE_ITEMS_UPDATE: "/api/v1/billable-items/update",
  },
  COUPONS: {
    BASE: "/api/v1/coupons",
    GET_LIST: "/api/v1/coupons/getList",
    PREVIEW: "/api/v1/coupons/preview",
    UPDATE: "/api/v1/coupons/update",
  },
  INQUIRIES: {
    BASE: "/api/v1/inquiries",
    GET_LIST: "/api/v1/inquiries/getList",
    GET_LOGS: "/api/v1/inquiries/getLogs",
    GET_SOURCES_LIST: "/api/v1/inquiries/getSourcesList",
    GET_STATUS_LIST: "/api/v1/inquiries/getStatusList",
    UPDATE: "/api/v1/inquiries/update",
    UPDATE_STATUS: "/api/v1/inquiries/updateStatus",
  },
  SUBSCRIPTION: {
    CREATE_PLAN: "/api/v1/subscription/plans",
    PLANS_GET_LIST: "/api/v1/subscription/plans/getList",
    UPDATE_PLAN: "/api/v1/subscription/plans/update",
  },
  TRANSACTIONS: {
    CREATE: "/api/v1/transactions",
    GET_LIST: "/api/v1/transactions/getList",
    ITEMS_GET_LIST: "/api/v1/transactions/getItems",
    UPDATE: "/api/v1/transactions/updateStatus",
  },
  INSTRUCTORS: {
    BASE: "/api/v1/instructors",
    CREATE: "/api/v1/instructors",
    GET_LIST: "/api/v1/instructors/getList",
    GET_DETAILS: (id: number) => `/api/v1/instructors/${id}`,
  },
  // used
  MEMBERS: {
    BASE: "/api/v1/members",
    UPDATE: (id: number) => `/api/v1/members/${id}`,
    SUMMARY: "/api/v1/members/summary",
    DELETE: (id: number) => `/api/v1/members/${id}`,

  },
  // used
  MEMBERSHIP: {
    CREATE_PLAN: "/api/v1/membership-plans",
    GET_PLANS: "/api/v1/membership-plans",
    UPDATE_PLAN: (id: number) => `/api/v1/membership-plans/${id}`,
  },
  // used
  PAYMENTS: {
    BASE: "/api/v1/payments",
    SUMMARY: "/api/v1/payments/summary",
    DETAIL: (id: number) => `/api/v1/payments/${id}`,
    UPDATE: (id: number) => `/api/v1/payments/${id}/refund`,
  },
  // used
  PROMO_CODES: {
    BASE: "/api/v1/promo-codes",
    GET_LIST: "/api/v1/promo-codes/getList",
    PREVIEW: "/api/v1/promo-codes/preview",
    UPDATE: (id: number) => `/api/v1/promo-codes/${id}`,
  },
  // used
  MAILS: {
    BASE: "/api/v1/mails",
    CREATE: "/api/v1/mails",
    GET_LIST: "/api/v1/mails/getList",
    GET_RECIPIENTS: "/api/v1/mails/recipients",
    GET_DETAILS: (id: number) => `/api/v1/mails/${id}`,
  },
  SYSTEM_ADMIN: {
    // used
    ROLES: {
      GET_ROLES: "/api/v1/administration/roles",
      GET_ROLES_CATALOG: "/api/v1/administration/roles/catalog",
      UPDATE_MODULES: "/api/v1/system-admins/roles/updateModules",
      CREATE_ROLE: "/api/v1/administration/roles",
    },
    // used
    ADMINS: {
      GET_ADMINS: "/api/v1/administration/admins",
      CREATE_ADMIN: "/api/v1/administration/admins",
      UPDATE: (id: number) => `/api/v1/administration/admins/${id}`,
    },
    MODULES: {
      GET_LIST: "/api/v1/system-admins/modules/getList",
      GET_NAME_LIST: "/api/v1/system-admins/modules/getNameList",
      SET_ROLE_MODULES: "/api/v1/system-admins/roles/updateModules",
    },
  },
  TRANSACTION_PAYMENT: {
    CATEGORY: "/api/v1/transaction-payment/category",
    CATEGORY_GET_LIST: "/api/v1/transaction-payment/category/getList",
    GET_LIST: "/api/v1/transaction-payment/getList",
    MAKE_PAYMENT: "/api/v1/transaction-payment",
    METHOD: "/api/v1/transaction-payment/method",
    METHOD_GET_LIST: "/api/v1/transaction-payment/method/getList",
    METHOD_UPDATE: "/api/v1/transaction-payment/method/update",
  },
} as const;

/**
 * Community Type Values
 */
export const COMMUNITY_TYPE = {
  APARTMENT: "APARTMENT",
  HOUSING: "HOUSING",
  OTHER: "OTHER",
} as const;

/**
 * Default Pagination Values
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Inquiry Source Values
 */
export const INQUIRY_SOURCE = {
  OFFLINE: "OFFLINE",
  OTHER: "OTHER",
  REFERRAL: "REFERRAL",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  WEBSITE: "WEBSITE",
} as const;

/**
 * Payment Status Values
 */
export const PAYMENT_STATUS = {
  FAILED: "FAILED",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  PENDING: "PENDING",
} as const;

/**
 * Subscription Interval Values
 */
export const SUBSCRIPTION_INTERVAL = {
  CUSTOM: "CUSTOM",
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
} as const;

/**
 * Subscription Status Values
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "ACTIVE",
  CANCELED: "CANCELED",
  EXPIRED: "EXPIRED",
  INACTIVE: "INACTIVE",
  PAST_DUE: "PAST_DUE",
} as const;

/**
 * Session Type Values
 */
export const SESSION_TYPE = {
  CLASS: "CLASS",
  EVENT: "EVENT",
  WORKSHOP: "WORKSHOP",
} as const;

/**
 * Type exports for TypeScript
 */
export type CommunityType = typeof COMMUNITY_TYPE[keyof typeof COMMUNITY_TYPE];
export type SessionType = typeof SESSION_TYPE[keyof typeof SESSION_TYPE];
export type InquirySource = typeof INQUIRY_SOURCE[keyof typeof INQUIRY_SOURCE];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type SubscriptionInterval = typeof SUBSCRIPTION_INTERVAL[keyof typeof SUBSCRIPTION_INTERVAL];
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
