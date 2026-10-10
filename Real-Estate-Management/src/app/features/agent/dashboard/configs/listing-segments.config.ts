export interface ListingSegmentConfig {
  label: string;
  color: string;
  keyword: string;
}

export const LISTING_SEGMENTS_CONFIG: ListingSegmentConfig[] = [
  { label: 'For Sale', color: '#185FA5', keyword: 'SALE'  },
  { label: 'For Rent', color: '#7ed3f5', keyword: 'RENT'  },
  { label: 'Lease',    color: '#313133', keyword: 'LEASE' },
];