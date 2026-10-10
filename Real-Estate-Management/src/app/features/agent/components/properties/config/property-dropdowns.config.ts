export const PROPERTY_TYPES = [
  { id: 40, label: 'Apartment' },
  { id: 50, label: 'House' },
  { id: 60, label: 'Commercial' },
  { id: 70, label: 'Villa' },
  { id: 80, label: 'Plot' },
] as const;

export const LISTING_TYPES = [
  { id: 70, label: 'For Sale' },
  { id: 80, label: 'For Rent' },
  { id: 90, label: 'Lease' },
] as const;

export const STATUSES = [
  { id: 100, label: 'Active' },
  { id: 200, label: 'Pending' },
  { id: 300, label: 'Sold' },
] as const;