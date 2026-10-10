export const ACTIVE_STATUSES  = ['ACTIVE', 'AVAILABLE', 'LISTED'] as const;
export const CLOSED_STATUSES  = ['SOLD', 'LEASED', 'RENTED', 'CLOSED'] as const;

export const ALL_KNOWN_STATUSES = [...ACTIVE_STATUSES, ...CLOSED_STATUSES] as const;

export const CURRENCY_FORMAT_CONFIG = {
  locale:    'en-IN',
  currency:  'INR',
  maxDigits: 0,
} as const;