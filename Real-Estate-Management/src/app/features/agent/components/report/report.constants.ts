import {Chart, ArcElement, Tooltip, Legend, DoughnutController, BarController,CategoryScale, LinearScale, BarElement,} from 'chart.js';

import { StatusFilter, ListingTypeFilter } from './report.types';

// ── Chart.js tree-shakeable registration ──────────────────────────────────────
// Placed here so it runs once when this module is first imported,
// keeping the component free of Chart.js bootstrap concerns.

Chart.register(
  ArcElement, Tooltip, Legend,
  DoughnutController, BarController,
  CategoryScale, LinearScale, BarElement,
);

// ── Filter tab definitions ────────────────────────────────────────────────────

export interface StatusTab {
  label: string;
  value: StatusFilter;
  color: string;
}

export interface ListingTab {
  label: string;
  value: ListingTypeFilter;
  color: string;
}

export const STATUS_TABS: StatusTab[] = [
  { label: 'All',     value: 'ALL',     color: '#6366f1' },
  { label: 'Active',  value: 'ACTIVE',  color: '#10b981' },
  { label: 'Sold',    value: 'SOLD',    color: '#ef4444' },
  { label: 'Pending', value: 'PENDING', color: '#f59e0b' },
];

export const LISTING_TABS: ListingTab[] = [
  { label: 'All Types', value: 'ALL',   color: '#6d6e7a' },
  { label: 'For Sale',  value: 'SALE',  color: '#3bd1f6' },
  { label: 'For Rent',  value: 'RENT',  color: '#ecea52' },
  { label: 'Lease',     value: 'LEASE', color: '#f65cf6' },
];

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
export type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number];