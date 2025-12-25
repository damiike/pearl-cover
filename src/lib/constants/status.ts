export const AGED_CARE_EXPENSE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  DISPUTED: 'disputed',
  WRITTEN_OFF: 'written_off',
} as const

export type AgedCareExpenseStatus = typeof AGED_CARE_EXPENSE_STATUS[keyof typeof AGED_CARE_EXPENSE_STATUS]

export const WORKCOVER_CLAIM_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  UNDER_REVIEW: 'under_review',
} as const

export type WorkcoverClaimStatus = typeof WORKCOVER_CLAIM_STATUS[keyof typeof WORKCOVER_CLAIM_STATUS]

export const WORKCOVER_EXPENSE_STATUS = {
  PENDING_SUBMISSION: 'pending_submission',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  REJECTED: 'rejected',
} as const

export type WorkcoverExpenseStatus = typeof WORKCOVER_EXPENSE_STATUS[keyof typeof WORKCOVER_EXPENSE_STATUS]

export const PAYMENT_TYPE = {
  AGED_CARE: 'aged_care',
  WORKCOVER: 'workcover',
  MIXED: 'mixed',
} as const

export type PaymentType = typeof PAYMENT_TYPE[keyof typeof PAYMENT_TYPE]

export const PAYMENT_METHOD = {
  BANK_TRANSFER: 'bank_transfer',
  CREDIT_CARD: 'credit_card',
  CASH: 'cash',
  CHEQUE: 'cheque',
  DIRECT_DEBIT: 'direct_debit',
} as const

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD]

export const USER_ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  SUPPORT: 'support',
  READ_ONLY: 'read_only',
  SUPPLIER: 'supplier',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
