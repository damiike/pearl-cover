export const ROUTES = {
  DASHBOARD: '/dashboard',
  AGED_CARE: '/aged-care',
  WORKCOVER: '/workcover',
  PAYMENTS: '/payments',
  NOTES: '/notes',
  CALENDAR: '/calendar',
  SUPPLIERS: '/suppliers',
  AI_ASSISTANT: '/ai-assistant',
  REPORTS: '/reports',
  SEARCH: '/search',
  AUDIT_LOG: '/audit-log',
  SETTINGS: '/settings',
  ADMIN_USERS: '/admin/users',
  ADMIN_PERMISSIONS: '/admin/permissions',
} as const

export type RouteKey = keyof typeof ROUTES
