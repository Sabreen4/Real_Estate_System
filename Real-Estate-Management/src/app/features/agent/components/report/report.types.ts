// ── Data shapes ───────────────────────────────────────────────────────────────

export interface ReportData {
  totalProperties:      number;
  activeProperties:     number;
  soldProperties:       number;
  forSaleCount:         number;
  forRentCount:         number;
  leaseCount:           number;
  totalPortfolioValue:  number;
  avgPropertyPrice:     number;
  highestPrice:         number;
  lowestPrice:          number;
  totalAppointments:    number;
  pendingAppointments:  number;
  approvedAppointments: number;
  rejectedAppointments: number;
  totalOffers:          number;
  pendingOffers:        number;
  approvedOffers:       number;
  rejectedOffers:       number;
  totalPayments:        number;
  completedPayments:    number;
  totalRevenue:         number;
  cityBreakdown:        CityBreakdown[];
  generatedAt:          Date;
  rows:                 PropertyRow[];
}

export interface PropertyRow {
  id:          number;
  title:       string;
  city:        string;
  price:       number;
  status:      string;
  listingType: string;
  createdAt:   string;
}

export interface CityBreakdown {
  city:  string;
  count: number;
  value: number;
}

// ── Filter / sort unions ──────────────────────────────────────────────────────

export type StatusFilter      = 'ALL' | 'ACTIVE' | 'SOLD' | 'PENDING';
export type ListingTypeFilter = 'ALL' | 'SALE'   | 'RENT' | 'LEASE';
export type SortField         = 'title' | 'city' | 'price' | 'status' | 'listingType' | 'createdAt';
export type SortDir           = 'asc' | 'desc';