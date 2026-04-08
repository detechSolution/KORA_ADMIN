/**
 * API Endpoints
 * Centralized API endpoint definitions
 */
export const API_ENDPOINTS = {
  ANALYTICS: {
    GET_STATS: "/service/v1/analytics/getSummary",
  },
  COMMUNITIES: {
    CREATE: "/service/v1/communities",
    GET_LIST: "/service/v1/communities/getList",
    UPDATE_STATUS: "/service/v1/communities/updateStatus",
    UPDATE_SUBSCRIPTION_STATUS: "/service/v1/communities/subscription/update",
    GET_ACCOUNT_SUMMARY: (id: number) => `/service/v1/communities/${id}/getSummary`,
    GET_USAGE_SUMMARY: (id: number) => `/service/v1/communities/${id}/usageSummary`,
    GET_COMMUNITY_SUBSCRIPTION_PLAN: (id: number) => `/service/v1/communities/${id}/subscription`,
    GET_ADMINS: `/service/v1/communities/admins/getList`,
    ACTIVATE_ADMIN: `/service/v1/communities/admins/activate`,
  },
  AUTH: {
    LOGIN: "/service/v1/auth/login",
    ME: "/service/v1/auth/me",
    REFRESH: "/service/v1/auth/refresh-token",
    UPDATE_PASSWORD: "/service/v1/auth/update-password",
  },
  CONFIGURATION: {
    BILLABLE_ITEMS: "/service/v1/billable-items/getList",
    BILLABLE_ITEMS_CREATE: "/service/v1/billable-items",
    BILLABLE_ITEMS_UPDATE: "/service/v1/billable-items/update",
  },
  COUPONS: {
    BASE: "/service/v1/coupons",
    GET_LIST: "/service/v1/coupons/getList",
    PREVIEW: "/service/v1/coupons/preview",
    UPDATE: "/service/v1/coupons/update",
  },
  INQUIRIES: {
    BASE: "/service/v1/inquiries",
    GET_LIST: "/service/v1/inquiries/getList",
    GET_LOGS: "/service/v1/inquiries/getLogs",
    GET_SOURCES_LIST: "/service/v1/inquiries/getSourcesList",
    GET_STATUS_LIST: "/service/v1/inquiries/getStatusList",
    UPDATE: "/service/v1/inquiries/update",
    UPDATE_STATUS: "/service/v1/inquiries/updateStatus",
  },
  SUBSCRIPTION: {
    CREATE_PLAN: "/service/v1/subscription/plans",
    PLANS_GET_LIST: "/service/v1/subscription/plans/getList",
    UPDATE_PLAN: "/service/v1/subscription/plans/update",
  },
  TRANSACTIONS: {
    CREATE: "/service/v1/transactions",
    GET_LIST: "/service/v1/transactions/getList",
    ITEMS_GET_LIST: "/service/v1/transactions/getItems",
    UPDATE: "/service/v1/transactions/updateStatus",
  },
  SYSTEM_ADMIN: {
    ROLES: {
      BASE: "/service/v1/system-admins/roles",
      GET_LIST: "/service/v1/system-admins/roles/getList",
      UPDATE_MODULES: "/service/v1/system-admins/roles/updateModules",
    },
    ADMINS: {
      BASE: "/service/v1/system-admins",
      GET_LIST: "/service/v1/system-admins/getList",
      UPDATE: `/service/v1/system-admins/update`,
    },
    MODULES: {
      GET_LIST: "/service/v1/system-admins/modules/getList",
      GET_NAME_LIST: "/service/v1/system-admins/modules/getNameList",
      SET_ROLE_MODULES: "/service/v1/system-admins/roles/updateModules",
    },
  },
  TRANSACTION_PAYMENT: {
    CATEGORY: "/service/v1/transaction-payment/category",
    CATEGORY_GET_LIST: "/service/v1/transaction-payment/category/getList",
    GET_LIST: "/service/v1/transaction-payment/getList",
    MAKE_PAYMENT: "/service/v1/transaction-payment",
    METHOD: "/service/v1/transaction-payment/method",
    METHOD_GET_LIST: "/service/v1/transaction-payment/method/getList",
    METHOD_UPDATE: "/service/v1/transaction-payment/method/update",
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
export const DEFAULT_PAGE_SIZE = 20;

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
 * Type exports for TypeScript
 */
export type CommunityType = typeof COMMUNITY_TYPE[keyof typeof COMMUNITY_TYPE];
export type InquirySource = typeof INQUIRY_SOURCE[keyof typeof INQUIRY_SOURCE];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type SubscriptionInterval = typeof SUBSCRIPTION_INTERVAL[keyof typeof SUBSCRIPTION_INTERVAL];
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
