/**
 * Permission keys for feature gating.
 * Must match the module `name` values from the backend (system_modules seed).
 * API returns these in auth/me data.permissions.
 */

// ——— Dashboard ———
export const DASHBOARD = {
  VIEW: "dashboard.view",
} as const;

// ——— Administration ———
export const PERMISSIONS_ADMINISTRATION = {
  ADMINS_CREATE: "administration.admins.create",
  ADMINS_DELETE: "administration.admins.delete",
  ADMINS_UPDATE: "administration.admins.update",
  ADMINS_VIEW: "administration.admins.view",

  ROLES_CREATE: "administration.roles.create",
  ROLES_DELETE: "administration.roles.delete",
  ROLES_UPDATE: "administration.roles.update",
  ROLES_VIEW: "administration.roles.view",
} as const;

// ——— Bookings ———
export const PERMISSIONS_BOOKINGS = {
  CREATE: "bookings.create",
  VIEW: "bookings.view",
} as const;

// ——— Members ———
export const PERMISSIONS_MEMBERS = {
  CREATE: "members.create",
  DELETE: "members.delete",
  UPDATE: "members.update",
  VIEW: "members.view",
} as const;

// ——— Membership Plans ———
export const PERMISSIONS_MEMBERSHIP_PLANS = {
  CREATE: "membership_plans.create",
  DELETE: "membership_plans.delete",
  UPDATE: "membership_plans.update",
  VIEW: "membership_plans.view",
} as const;

// ——— Services ———
export const PERMISSIONS_SERVICES = {
  CREATE: "offerings.services.create",
  DELETE: "offerings.services.delete",
  UPDATE: "offerings.services.update",
  VIEW: "offerings.services.view",
} as const;

// ——— Sessions ———
export const PERMISSIONS_SESSIONS = {
  CREATE: "offerings.sessions.create",
  DELETE: "offerings.sessions.delete",
  UPDATE: "offerings.sessions.update",
  VIEW: "offerings.sessions.view",
} as const;

// ——— Payments ———
export const PERMISSIONS_PAYMENTS = {
  VIEW: "payments.view",
} as const;

// ——— Promo Codes ———
export const PERMISSIONS_PROMO_CODES = {
  CREATE: "promo_codes.create",
  DELETE: "promo_codes.delete",
  UPDATE: "promo_codes.update",
  VIEW: "promo_codes.view",
} as const;

// ——— Refunds ———
export const PERMISSIONS_REFUNDS = {
  MANAGE: "refunds.manage",
} as const;

// ——— Uploads ———
export const PERMISSIONS_UPLOADS = {
  CREATE: "uploads.create",
} as const;

// ——— Mails ———
export const PERMISSIONS_MAILS = {
  CREATE: "mails.create",
  VIEW: "mails.view",
} as const;

/** Flat map of all permission strings for sidebar and simple checks. */
export const PERMISSIONS_NAV = {
  DASHBOARD: null,

  ADMINS: PERMISSIONS_ADMINISTRATION.ADMINS_VIEW,
  ROLES: PERMISSIONS_ADMINISTRATION.ROLES_VIEW,

  BOOKINGS: PERMISSIONS_BOOKINGS.VIEW,
  MEMBERS: PERMISSIONS_MEMBERS.VIEW,
  MEMBERSHIP_PLANS: PERMISSIONS_MEMBERSHIP_PLANS.VIEW,

  SERVICES: PERMISSIONS_SERVICES.VIEW,
  SESSIONS: PERMISSIONS_SESSIONS.VIEW,

  PAYMENTS: PERMISSIONS_PAYMENTS.VIEW,
  PROMO_CODES: PERMISSIONS_PROMO_CODES.VIEW,
  REFUNDS: PERMISSIONS_REFUNDS.MANAGE,

  MAILS: PERMISSIONS_MAILS.VIEW,
} as const;

type Permission = string;

export function hasPermission(userPermissions: Permission[], key: Permission) {
  return userPermissions.includes(key);
}
