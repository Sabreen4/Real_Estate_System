export interface StatusSegmentConfig {
  label: string;
  color: string;
  statuses: string[];
}

export const STATUS_SEGMENTS_CONFIG: StatusSegmentConfig[] = [
  { label: 'Active',        color: '#185FA5', statuses: ['ACTIVE', 'AVAILABLE', 'LISTED']                },
  { label: 'Sold / Leased', color: '#A32D2D', statuses: ['SOLD', 'LEASED', 'RENTED', 'CLOSED']          },
  { label: 'Other',         color: '#888780', statuses: [] /* fallback: anything not matched above */    },
];

// Flat list of all known statuses (used to identify "Other")
export const KNOWN_STATUSES: string[] = STATUS_SEGMENTS_CONFIG
  .flatMap(s => s.statuses);