import { ReportData, PropertyRow, CityBreakdown } from './report.types';

/**
 * Transforms raw API payloads into a typed {@link ReportData} object.
 * Pure function — no Angular dependencies, fully unit-testable.
 */
export function buildReport(
  propertiesRaw: any,
  apptsRaw:      any,
  offersRaw:     any,
  paymentsRaw:   any,
): ReportData {
  const props:    any[] = propertiesRaw?.items ?? propertiesRaw ?? [];
  const appts:    any[] = apptsRaw    ?? [];
  const offers:   any[] = offersRaw   ?? [];
  const payments: any[] = paymentsRaw ?? [];

  // ── Property buckets ───────────────────────────────────────────────────────
  const active  = props.filter(p => p.status?.toUpperCase() === 'ACTIVE');
  const sold    = props.filter(p => p.status?.toUpperCase() === 'SOLD');
  const forSale = props.filter(p => p.listingType?.toUpperCase().includes('SALE'));
  const forRent = props.filter(p => p.listingType?.toUpperCase().includes('RENT'));
  const lease   = props.filter(p => p.listingType?.toUpperCase().includes('LEASE'));

  // ── Pricing ────────────────────────────────────────────────────────────────
  const prices     = props.map(p => +p.price).filter(v => v > 0);
  const totalValue = prices.reduce((a, b) => a + b, 0);
  const avgPrice   = prices.length ? totalValue / prices.length : 0;

  // ── City breakdown (top 8) ─────────────────────────────────────────────────
  const cityMap = new Map<string, { count: number; value: number }>();
  props.forEach(p => {
    const city = (p.city || 'Unknown').trim();
    const cur  = cityMap.get(city) ?? { count: 0, value: 0 };
    cityMap.set(city, { count: cur.count + 1, value: cur.value + (+p.price || 0) });
  });
  const cityBreakdown: CityBreakdown[] = Array.from(cityMap.entries())
    .map(([city, d]) => ({ city, count: d.count, value: d.value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ── Appointment / offer / payment buckets ──────────────────────────────────
  const pendingAppts   = appts.filter(a => a.status?.toUpperCase() === 'PENDING');
  const approvedAppts  = appts.filter(a => a.status?.toUpperCase() === 'APPROVED');
  const rejectedAppts  = appts.filter(a => a.status?.toUpperCase() === 'REJECTED');
  const pendingOffers  = offers.filter(o => o.status?.toUpperCase() === 'PENDING');
  const approvedOffers = offers.filter(o => o.status?.toUpperCase() === 'APPROVED');
  const rejectedOffers = offers.filter(o => o.status?.toUpperCase() === 'REJECTED');
  const completedPay   = payments.filter(p => p.status?.toUpperCase() === 'APPROVED');
  const totalRevenue   = payments.reduce((sum: number, p: any) => sum + (+p.amount || 0), 0);

  // ── Table rows ─────────────────────────────────────────────────────────────
  const rows: PropertyRow[] = props.map(p => ({
    id:          p.id ?? p.propertyId ?? 0,
    title:       p.title ?? p.name ?? '—',
    city:        (p.city || 'Unknown').trim(),
    price:       +p.price || 0,
    status:      (p.status      ?? '').toUpperCase(),
    listingType: (p.listingType ?? '').toUpperCase(),
    createdAt:   p.createdAt ?? p.created_at ?? '',
  }));

  return {
    totalProperties:      props.length,
    activeProperties:     active.length,
    soldProperties:       sold.length,
    forSaleCount:         forSale.length,
    forRentCount:         forRent.length,
    leaseCount:           lease.length,
    totalPortfolioValue:  totalValue,
    avgPropertyPrice:     avgPrice,
    highestPrice:         prices.length ? Math.max(...prices) : 0,
    lowestPrice:          prices.length ? Math.min(...prices) : 0,
    totalAppointments:    appts.length,
    pendingAppointments:  pendingAppts.length,
    approvedAppointments: approvedAppts.length,
    rejectedAppointments: rejectedAppts.length,
    totalOffers:          offers.length,
    pendingOffers:        pendingOffers.length,
    approvedOffers:       approvedOffers.length,
    rejectedOffers:       rejectedOffers.length,
    totalPayments:        payments.length,
    completedPayments:    completedPay.length,
    totalRevenue,
    cityBreakdown,
    generatedAt: new Date(),
    rows,
  };
}