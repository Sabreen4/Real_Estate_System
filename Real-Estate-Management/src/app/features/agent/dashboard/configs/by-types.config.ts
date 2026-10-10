export interface ListingTypeConfig {
  label: string;
  color: string;
  keyword: string;
}

export const BY_TYPE_CONFIG: ListingTypeConfig[] = [
  { label: 'For Sale', color: '#185FA5', keyword: 'SALE'  },
  { label: 'For Rent', color: '#4ab3b7', keyword: 'RENT'  },
  { label: 'Lease',    color: '#111312', keyword: 'LEASE' },
];