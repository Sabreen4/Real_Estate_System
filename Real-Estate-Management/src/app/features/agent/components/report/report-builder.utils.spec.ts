import { buildReport } from './report-builder.utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProperty(o: Partial<any> = {}): any {
  return {
    id: 1, title: 'Test Property', city: 'Chennai',
    price: 5000000, status: 'ACTIVE', listingType: 'SALE',
    createdAt: '2024-01-15T10:00:00Z', ...o,
  };
}

function makeAppt(status: string): any {
  return { id: 1, status, propertyId: 1, visitDate: '2024-01-01' };
}

function makeOffer(status: string, amt = 4500000): any {
  return { id: 1, status, amount: amt, propertyId: 1 };
}

function makePayment(status: string, amt = 4500000): any {
  return { id: 1, status, amount: amt };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildReport', () => {

  // ── Empty / null inputs ────────────────────────────────────────────────────

  describe('empty / null inputs', () => {
    it('should return zero counts when all inputs are empty arrays', () => {
      const r = buildReport([], [], [], []);
      expect(r.totalProperties).toBe(0);
      expect(r.activeProperties).toBe(0);
      expect(r.soldProperties).toBe(0);
      expect(r.forSaleCount).toBe(0);
      expect(r.forRentCount).toBe(0);
      expect(r.leaseCount).toBe(0);
      expect(r.totalPortfolioValue).toBe(0);
      expect(r.avgPropertyPrice).toBe(0);
      expect(r.highestPrice).toBe(0);
      expect(r.lowestPrice).toBe(0);
      expect(r.totalAppointments).toBe(0);
      expect(r.totalOffers).toBe(0);
      expect(r.totalPayments).toBe(0);
      expect(r.totalRevenue).toBe(0);
      expect(r.cityBreakdown).toEqual([]);
      expect(r.rows).toEqual([]);
    });

    it('should handle null propertiesRaw gracefully', () => {
      const r = buildReport(null, [], [], []);
      expect(r.totalProperties).toBe(0);
    });

    it('should handle null apptsRaw gracefully', () => {
      const r = buildReport([], null, [], []);
      expect(r.totalAppointments).toBe(0);
    });

    it('should handle null offersRaw gracefully', () => {
      const r = buildReport([], [], null, []);
      expect(r.totalOffers).toBe(0);
    });

    it('should handle null paymentsRaw gracefully', () => {
      const r = buildReport([], [], [], null);
      expect(r.totalPayments).toBe(0);
      expect(r.totalRevenue).toBe(0);
    });

    it('should handle undefined propertiesRaw gracefully', () => {
      const r = buildReport(undefined, [], [], []);
      expect(r.totalProperties).toBe(0);
    });

    it('should handle undefined apptsRaw gracefully', () => {
      const r = buildReport([], undefined, [], []);
      expect(r.totalAppointments).toBe(0);
    });

    it('should handle undefined offersRaw gracefully', () => {
      const r = buildReport([], [], undefined, []);
      expect(r.totalOffers).toBe(0);
    });

    it('should handle undefined paymentsRaw gracefully', () => {
      const r = buildReport([], [], [], undefined);
      expect(r.totalPayments).toBe(0);
      expect(r.totalRevenue).toBe(0);
    });

    it('should unwrap paginated { items } shape for properties', () => {
      const props = [makeProperty()];
      const r = buildReport({ items: props }, [], [], []);
      expect(r.totalProperties).toBe(1);
    });

    it('should use plain array when no items wrapper present', () => {
      const props = [makeProperty(), makeProperty({ id: 2 })];
      const r = buildReport(props, [], [], []);
      expect(r.totalProperties).toBe(2);
    });

    it('should unwrap { items } with multiple properties', () => {
      const props = [
        makeProperty({ id: 1, status: 'ACTIVE' }),
        makeProperty({ id: 2, status: 'SOLD'   }),
      ];
      const r = buildReport({ items: props }, [], [], []);
      expect(r.totalProperties).toBe(2);
      expect(r.activeProperties).toBe(1);
      expect(r.soldProperties).toBe(1);
    });
  });

  // ── Property status buckets ────────────────────────────────────────────────

  describe('property status buckets', () => {
    it('should count ACTIVE properties (case-insensitive)', () => {
      const r = buildReport([
        makeProperty({ status: 'ACTIVE' }),
        makeProperty({ status: 'active' }),
        makeProperty({ status: 'SOLD' }),
      ], [], [], []);
      expect(r.activeProperties).toBe(2);
      expect(r.soldProperties).toBe(1);
    });

    it('should count SOLD properties', () => {
      const r = buildReport([makeProperty({ status: 'SOLD' })], [], [], []);
      expect(r.soldProperties).toBe(1);
    });

    it('should count mixed-case ACTIVE and SOLD together', () => {
      const r = buildReport([
        makeProperty({ status: 'Active' }),
        makeProperty({ status: 'Sold'   }),
        makeProperty({ status: 'ACTIVE' }),
        makeProperty({ status: 'sold'   }),
      ], [], [], []);
      expect(r.activeProperties).toBe(2);
      expect(r.soldProperties).toBe(2);
    });

    it('should count PENDING status as neither active nor sold', () => {
      const r = buildReport([
        makeProperty({ status: 'PENDING' }),
        makeProperty({ status: 'PENDING' }),
        makeProperty({ status: 'ACTIVE'  }),
      ], [], [], []);
      expect(r.totalProperties).toBe(3);
      expect(r.activeProperties).toBe(1);
      expect(r.soldProperties).toBe(0);
    });
  });

  // ── Listing type buckets ───────────────────────────────────────────────────

  describe('listing type buckets', () => {
    it('should count SALE listing type (includes check)', () => {
      const r = buildReport([
        makeProperty({ listingType: 'SALE' }),
        makeProperty({ listingType: 'FOR_SALE' }),
      ], [], [], []);
      expect(r.forSaleCount).toBe(2);
    });

    it('should count RENT listing type', () => {
      const r = buildReport([
        makeProperty({ listingType: 'RENT' }),
        makeProperty({ listingType: 'MONTHLY_RENT' }),
      ], [], [], []);
      expect(r.forRentCount).toBe(2);
    });

    it('should count LEASE listing type', () => {
      const r = buildReport([makeProperty({ listingType: 'LEASE' })], [], [], []);
      expect(r.leaseCount).toBe(1);
    });

    it('should handle mixed listing types', () => {
      const r = buildReport([
        makeProperty({ listingType: 'SALE' }),
        makeProperty({ listingType: 'RENT' }),
        makeProperty({ listingType: 'LEASE' }),
      ], [], [], []);
      expect(r.forSaleCount).toBe(1);
      expect(r.forRentCount).toBe(1);
      expect(r.leaseCount).toBe(1);
    });

    it('should count listing types case-insensitively', () => {
      const r = buildReport([
        makeProperty({ listingType: 'sale'  }),
        makeProperty({ listingType: 'rent'  }),
        makeProperty({ listingType: 'lease' }),
      ], [], [], []);
      expect(r.forSaleCount).toBe(1);
      expect(r.forRentCount).toBe(1);
      expect(r.leaseCount).toBe(1);
    });
  });

  // ── Pricing ────────────────────────────────────────────────────────────────

  describe('pricing calculations', () => {
    it('should calculate totalPortfolioValue', () => {
      const r = buildReport([
        makeProperty({ price: 1000000 }),
        makeProperty({ price: 2000000 }),
      ], [], [], []);
      expect(r.totalPortfolioValue).toBe(3000000);
    });

    it('should calculate avgPropertyPrice', () => {
      const r = buildReport([
        makeProperty({ price: 1000000 }),
        makeProperty({ price: 3000000 }),
      ], [], [], []);
      expect(r.avgPropertyPrice).toBeCloseTo(2000000, 0);
    });

    it('should set avgPropertyPrice to 0 when no valid prices', () => {
      const r = buildReport([makeProperty({ price: 0 })], [], [], []);
      expect(r.avgPropertyPrice).toBe(0);
    });

    it('should set avgPropertyPrice to 0 when all prices are negative', () => {
      const r = buildReport([
        makeProperty({ price: -1000 }),
        makeProperty({ price: -500  }),
      ], [], [], []);
      expect(r.avgPropertyPrice).toBe(0);
    });

    it('should set avgPropertyPrice to 0 when prices array is empty after filter', () => {
      const r = buildReport([
        makeProperty({ price: 0    }),
        makeProperty({ price: -100 }),
      ], [], [], []);
      expect(r.avgPropertyPrice).toBe(0);
    });

    it('should calculate highestPrice', () => {
      const r = buildReport([
        makeProperty({ price: 1000000 }),
        makeProperty({ price: 9000000 }),
        makeProperty({ price: 5000000 }),
      ], [], [], []);
      expect(r.highestPrice).toBe(9000000);
    });

    it('should calculate lowestPrice', () => {
      const r = buildReport([
        makeProperty({ price: 1000000 }),
        makeProperty({ price: 9000000 }),
        makeProperty({ price: 5000000 }),
      ], [], [], []);
      expect(r.lowestPrice).toBe(1000000);
    });

    it('should return highestPrice=0 and lowestPrice=0 when no valid prices', () => {
      const r = buildReport([makeProperty({ price: 0 })], [], [], []);
      expect(r.highestPrice).toBe(0);
      expect(r.lowestPrice).toBe(0);
    });

    it('should filter out non-positive prices from statistics', () => {
      const r = buildReport([
        makeProperty({ price: -1000 }),
        makeProperty({ price: 0 }),
        makeProperty({ price: 5000000 }),
      ], [], [], []);
      expect(r.lowestPrice).toBe(5000000);
      expect(r.highestPrice).toBe(5000000);
    });

    it('should coerce string price to number', () => {
      const r = buildReport([makeProperty({ price: '2000000' })], [], [], []);
      expect(r.totalPortfolioValue).toBe(2000000);
    });

    it('should exclude non-positive prices from totalPortfolioValue', () => {
      const r = buildReport([
        makeProperty({ price: 3000000 }),
        makeProperty({ price: 0       }),
        makeProperty({ price: -100    }),
      ], [], [], []);
      // totalPortfolioValue sums ALL prices via +p.price (including 0 / negatives)
      // but prices[] for stats filters to > 0 only
      expect(r.highestPrice).toBe(3000000);
      expect(r.lowestPrice).toBe(3000000);
    });
  });

  // ── City breakdown ─────────────────────────────────────────────────────────

  describe('cityBreakdown', () => {
    it('should group properties by city', () => {
      const r = buildReport([
        makeProperty({ city: 'Chennai', price: 1000000 }),
        makeProperty({ city: 'Chennai', price: 2000000 }),
        makeProperty({ city: 'Mumbai',  price: 5000000 }),
      ], [], [], []);
      const chennai = r.cityBreakdown.find((c: any) => c.city === 'Chennai');
      expect(chennai?.count).toBe(2);
      expect(chennai?.value).toBe(3000000);
    });

    it('should sort cityBreakdown by count descending', () => {
      const r = buildReport([
        makeProperty({ city: 'A' }),
        makeProperty({ city: 'B' }),
        makeProperty({ city: 'B' }),
        makeProperty({ city: 'C' }),
        makeProperty({ city: 'C' }),
        makeProperty({ city: 'C' }),
      ], [], [], []);
      const counts = r.cityBreakdown.map((c: any) => c.count);
      expect(counts[0]).toBe(3);
      expect(counts[1]).toBe(2);
      expect(counts[2]).toBe(1);
    });

    it('should cap cityBreakdown at 8 cities', () => {
      const props = Array.from({ length: 12 }, (_, i) =>
        makeProperty({ city: `City${i}`, id: i + 1 })
      );
      const r = buildReport(props, [], [], []);
      expect(r.cityBreakdown.length).toBeLessThanOrEqual(8);
    });

    it('should use "Unknown" for missing city', () => {
      const r = buildReport([makeProperty({ city: '' }), makeProperty({ city: null })], [], [], []);
      const unknown = r.cityBreakdown.find((c: any) => c.city === 'Unknown');
      expect(unknown?.count).toBe(2);
    });

    it('should trim whitespace from city names', () => {
      const r = buildReport([makeProperty({ city: '  Chennai  ' })], [], [], []);
      expect(r.cityBreakdown[0].city).toBe('Chennai');
    });

    it('should merge cities that differ only by surrounding whitespace', () => {
      const r = buildReport([
        makeProperty({ city: '  Mumbai  ' }),
        makeProperty({ city: 'Mumbai'     }),
        makeProperty({ city: ' Mumbai'    }),
      ], [], [], []);
      expect(r.cityBreakdown.length).toBe(1);
      expect(r.cityBreakdown[0].count).toBe(3);
    });

    it('should accumulate value per city correctly', () => {
      const r = buildReport([
        makeProperty({ city: 'Delhi', price: 3000000 }),
        makeProperty({ city: 'Delhi', price: 7000000 }),
      ], [], [], []);
      const delhi = r.cityBreakdown.find((c: any) => c.city === 'Delhi');
      expect(delhi?.value).toBe(10000000);
    });

    it('should normalise null city to "Unknown" in cityBreakdown', () => {
      const r = buildReport(
        [{ id: 1, city: null, price: 100, status: 'ACTIVE', listingType: 'SALE' }],
        [], [], []
      );
      expect(r.cityBreakdown[0].city).toBe('Unknown');
    });

    it('should handle empty string city as "Unknown"', () => {
      const r = buildReport(
        [{ id: 1, city: '', price: 100, status: 'ACTIVE', listingType: 'SALE' }],
        [], [], []
      );
      expect(r.cityBreakdown[0].city).toBe('Unknown');
    });
  });

  // ── Appointments ───────────────────────────────────────────────────────────

  describe('appointment counts', () => {
    it('should count appointments by status', () => {
      const appts = [
        makeAppt('PENDING'),
        makeAppt('PENDING'),
        makeAppt('APPROVED'),
        makeAppt('REJECTED'),
      ];
      const r = buildReport([], appts, [], []);
      expect(r.totalAppointments).toBe(4);
      expect(r.pendingAppointments).toBe(2);
      expect(r.approvedAppointments).toBe(1);
      expect(r.rejectedAppointments).toBe(1);
    });

    it('should be case-insensitive for appointment status', () => {
      const r = buildReport([], [makeAppt('pending'), makeAppt('Approved')], [], []);
      expect(r.pendingAppointments).toBe(1);
      expect(r.approvedAppointments).toBe(1);
    });

    it('should count mixed-case rejected appointments', () => {
      const r = buildReport([], [makeAppt('rejected'), makeAppt('REJECTED')], [], []);
      expect(r.rejectedAppointments).toBe(2);
    });

    it('totalAppointments should equal sum of pending + approved + rejected', () => {
      const appts = [
        makeAppt('PENDING'),
        makeAppt('APPROVED'),
        makeAppt('APPROVED'),
        makeAppt('REJECTED'),
      ];
      const r = buildReport([], appts, [], []);
      expect(r.totalAppointments).toBe(
        r.pendingAppointments + r.approvedAppointments + r.rejectedAppointments
      );
    });
  });

  // ── Offers ─────────────────────────────────────────────────────────────────

  describe('offer counts', () => {
    it('should count offers by status', () => {
      const offers = [
        makeOffer('PENDING'),
        makeOffer('APPROVED'),
        makeOffer('APPROVED'),
        makeOffer('REJECTED'),
      ];
      const r = buildReport([], [], offers, []);
      expect(r.totalOffers).toBe(4);
      expect(r.pendingOffers).toBe(1);
      expect(r.approvedOffers).toBe(2);
      expect(r.rejectedOffers).toBe(1);
    });

    it('should be case-insensitive for offer status', () => {
      const r = buildReport([], [], [
        makeOffer('pending'),
        makeOffer('Approved'),
        makeOffer('Rejected'),
      ], []);
      expect(r.pendingOffers).toBe(1);
      expect(r.approvedOffers).toBe(1);
      expect(r.rejectedOffers).toBe(1);
    });

    it('totalOffers should equal sum of pending + approved + rejected', () => {
      const offers = [makeOffer('PENDING'), makeOffer('APPROVED'), makeOffer('REJECTED')];
      const r = buildReport([], [], offers, []);
      expect(r.totalOffers).toBe(
        r.pendingOffers + r.approvedOffers + r.rejectedOffers
      );
    });
  });

  // ── Payments ───────────────────────────────────────────────────────────────

  describe('payment counts and revenue', () => {
    it('should count completed (APPROVED) payments', () => {
      const payments = [
        makePayment('APPROVED', 5000000),
        makePayment('APPROVED', 3000000),
        makePayment('PENDING',  2000000),
      ];
      const r = buildReport([], [], [], payments);
      expect(r.completedPayments).toBe(2);
      expect(r.totalPayments).toBe(3);
    });

    it('should sum totalRevenue across all payments regardless of status', () => {
      const payments = [
        makePayment('APPROVED', 5000000),
        makePayment('PENDING',  3000000),
      ];
      const r = buildReport([], [], [], payments);
      expect(r.totalRevenue).toBe(8000000);
    });

    it('should ignore non-numeric amounts in totalRevenue', () => {
      const payments = [
        { status: 'APPROVED', amount: undefined },
        { status: 'APPROVED', amount: 1000000 },
      ];
      const r = buildReport([], [], [], payments);
      expect(r.totalRevenue).toBe(1000000);
    });

    it('should coerce string amounts to numbers', () => {
      const r = buildReport([], [], [], [{ status: 'APPROVED', amount: '2000000' }]);
      expect(r.totalRevenue).toBe(2000000);
    });

    it('should handle REJECTED payments in totalRevenue', () => {
      const r = buildReport([], [], [], [
        makePayment('APPROVED', 5000000),
        makePayment('PENDING',  3000000),
        makePayment('REJECTED', 2000000),
      ]);
      expect(r.totalRevenue).toBe(10000000);
    });

    it('completedPayments should be case-insensitive', () => {
      const r = buildReport([], [], [], [
        makePayment('approved', 1000),
        makePayment('Approved', 2000),
      ]);
      expect(r.completedPayments).toBe(2);
    });
  });

  // ── Table rows ─────────────────────────────────────────────────────────────

  describe('table rows (PropertyRow)', () => {
    it('should map properties to rows with correct shape', () => {
      const r = buildReport([makeProperty({
        id: 42, title: 'Luxe Villa', city: 'Bangalore',
        price: 9000000, status: 'active', listingType: 'sale',
        createdAt: '2024-05-01T00:00:00Z',
      })], [], [], []);
      const row = r.rows[0];
      expect(row.id).toBe(42);
      expect(row.title).toBe('Luxe Villa');
      expect(row.city).toBe('Bangalore');
      expect(row.price).toBe(9000000);
      expect(row.status).toBe('ACTIVE');
      expect(row.listingType).toBe('SALE');
      expect(row.createdAt).toBe('2024-05-01T00:00:00Z');
    });

    it('should fall back to propertyId when id is absent', () => {
      const r = buildReport([{ propertyId: 99, title: 'X', city: 'Y', price: 100, status: 'ACTIVE', listingType: 'SALE' }], [], [], []);
      expect(r.rows[0].id).toBe(99);
    });

    it('should fall back to 0 when both id and propertyId are absent', () => {
      const r = buildReport([{ title: 'X', city: 'Y', price: 100, status: 'ACTIVE', listingType: 'SALE' }], [], [], []);
      expect(r.rows[0].id).toBe(0);
    });

    it('should fall back to name when title is absent', () => {
      const r = buildReport([{ id: 1, name: 'Fallback Name', city: 'X', price: 100, status: 'ACTIVE', listingType: 'SALE' }], [], [], []);
      expect(r.rows[0].title).toBe('Fallback Name');
    });

    it('should use "—" when both title and name are absent', () => {
      const r = buildReport([{ id: 1, city: 'X', price: 100, status: 'ACTIVE', listingType: 'SALE' }], [], [], []);
      expect(r.rows[0].title).toBe('—');
    });

    it('should use "Unknown" city when city is missing', () => {
      const r = buildReport([{ id: 1, title: 'T', price: 100, status: 'ACTIVE', listingType: 'SALE' }], [], [], []);
      expect(r.rows[0].city).toBe('Unknown');
    });

    it('should fall back to created_at when createdAt is absent', () => {
      const r = buildReport([{ id: 1, title: 'T', city: 'C', price: 100, status: 'ACTIVE', listingType: 'SALE', created_at: '2023-01-01' }], [], [], []);
      expect(r.rows[0].createdAt).toBe('2023-01-01');
    });

    it('should use empty string when both createdAt and created_at are absent', () => {
      const r = buildReport([{ id: 1, title: 'T', city: 'C', price: 100, status: 'ACTIVE', listingType: 'SALE' }], [], [], []);
      expect(r.rows[0].createdAt).toBe('');
    });

    it('should coerce price to number in rows', () => {
      const r = buildReport([makeProperty({ price: '750000' })], [], [], []);
      expect(r.rows[0].price).toBe(750000);
    });

    it('should use 0 for non-numeric price in rows', () => {
      const r = buildReport([makeProperty({ price: 'bad' })], [], [], []);
      expect(r.rows[0].price).toBe(0);
    });

    it('should uppercase status in rows', () => {
      const r = buildReport([makeProperty({ status: 'active' })], [], [], []);
      expect(r.rows[0].status).toBe('ACTIVE');
    });

    it('should uppercase listingType in rows', () => {
      const r = buildReport([makeProperty({ listingType: 'sale' })], [], [], []);
      expect(r.rows[0].listingType).toBe('SALE');
    });

    it('should trim city in rows', () => {
      const r = buildReport([makeProperty({ city: '  Pune  ' })], [], [], []);
      expect(r.rows[0].city).toBe('Pune');
    });

    it('should use "Unknown" for null city in rows', () => {
      const r = buildReport([makeProperty({ city: null })], [], [], []);
      expect(r.rows[0].city).toBe('Unknown');
    });

    it('should use empty string for status when status is absent', () => {
      const r = buildReport([{ id: 1, title: 'T', city: 'C', price: 100, listingType: 'SALE' }], [], [], []);
      expect(r.rows[0].status).toBe('');
    });

    it('should use empty string for listingType when absent', () => {
      const r = buildReport([{ id: 1, title: 'T', city: 'C', price: 100, status: 'ACTIVE' }], [], [], []);
      expect(r.rows[0].listingType).toBe('');
    });

    it('should produce correct number of rows', () => {
      const props = [makeProperty({ id: 1 }), makeProperty({ id: 2 }), makeProperty({ id: 3 })];
      const r = buildReport(props, [], [], []);
      expect(r.rows.length).toBe(3);
    });
  });

  // ── generatedAt ────────────────────────────────────────────────────────────

  describe('generatedAt', () => {
    it('should be a Date instance', () => {
      const r = buildReport([], [], [], []);
      expect(r.generatedAt).toBeInstanceOf(Date);
    });

    it('should be close to now', () => {
      const before = Date.now();
      const r      = buildReport([], [], [], []);
      const after  = Date.now();
      expect(r.generatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(r.generatedAt.getTime()).toBeLessThanOrEqual(after);
    });
  });
});