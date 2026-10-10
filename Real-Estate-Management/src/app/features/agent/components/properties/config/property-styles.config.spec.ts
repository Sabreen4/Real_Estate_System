import { getStatusClass, getListingClass } from './property-styles.config';

describe('getStatusClass', () => {
  it('returns pill-active for ACTIVE', () => {
    expect(getStatusClass('ACTIVE')).toBe('pill-active');
  });

  it('is case-insensitive for active', () => {
    expect(getStatusClass('active')).toBe('pill-active');
  });

  it('returns pill-sold for SOLD', () => {
    expect(getStatusClass('SOLD')).toBe('pill-sold');
  });

  it('is case-insensitive for sold', () => {
    expect(getStatusClass('sold')).toBe('pill-sold');
  });

  it('returns pill-pending for PENDING', () => {
    expect(getStatusClass('PENDING')).toBe('pill-pending');
  });

  it('is case-insensitive for pending', () => {
    expect(getStatusClass('pending')).toBe('pill-pending');
  });

  it('returns pill-inactive for unknown status', () => {
    expect(getStatusClass('EXPIRED')).toBe('pill-inactive');
  });

  it('returns pill-inactive for empty string', () => {
    expect(getStatusClass('')).toBe('pill-inactive');
  });

  it('returns pill-inactive for null-like value', () => {
    expect(getStatusClass(null as any)).toBe('pill-inactive');
  });
});

describe('getListingClass', () => {
  it('returns badge-sale when type contains SALE', () => {
    expect(getListingClass('FOR_SALE')).toBe('badge-sale');
  });

  it('returns badge-sale for lowercase sale', () => {
    expect(getListingClass('for_sale')).toBe('badge-sale');
  });

  it('returns badge-rent when type contains RENT', () => {
    expect(getListingClass('FOR_RENT')).toBe('badge-rent');
  });

  it('returns badge-rent for lowercase rent', () => {
    expect(getListingClass('for_rent')).toBe('badge-rent');
  });

  it('returns badge-lease for LEASE', () => {
    expect(getListingClass('LEASE')).toBe('badge-lease');
  });

  it('returns badge-lease for unknown type', () => {
    expect(getListingClass('UNKNOWN')).toBe('badge-lease');
  });

  it('returns badge-lease for empty string', () => {
    expect(getListingClass('')).toBe('badge-lease');
  });
});