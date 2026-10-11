export enum CoupleSpaceStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum MembershipRole {
  CREATOR = "CREATOR",
  PARTNER = "PARTNER",
}

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum InvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

export enum WishlistStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum WishlistPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum DatePlanStatus {
  DRAFT = "DRAFT",
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ExpenseStatus {
  ACTIVE = "ACTIVE",
  VOIDED = "VOIDED",
}

export enum MediaStatus {
  UPLOADING = "UPLOADING",
  ACTIVE = "ACTIVE",
  FAILED = "FAILED",
  DELETED = "DELETED",
  PURGING = "PURGING",
  PURGED = "PURGED",
}

export enum CalendarEventType {
  MANUAL = "MANUAL",
  DATE_LINKED = "DATE_LINKED",
  ANNIVERSARY = "ANNIVERSARY",
  REMINDER = "REMINDER",
}
