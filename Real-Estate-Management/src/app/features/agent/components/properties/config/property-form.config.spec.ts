import { emptyPropertyForm, formatPrice } from './property-form.config';

describe('emptyPropertyForm', () => {
  it('returns an object with empty string fields', () => {
    const form = emptyPropertyForm();
    expect(form.title).toBe('');
    expect(form.description).toBe('');
    expect(form.city).toBe('');
    expect(form.state).toBe('');
    expect(form.zipCode).toBe('');
  });

  it('returns price and size as 0', () => {
    const form = emptyPropertyForm();
    expect(form.price).toBe(0);
    expect(form.size).toBe(0);
  });

  it('returns propertyTypeId and listingTypeId as undefined', () => {
    const form = emptyPropertyForm();
    expect(form.propertyTypeId).toBeUndefined();
    expect(form.listingTypeId).toBeUndefined();
  });

  it('returns statusId as 100 (Active)', () => {
    const form = emptyPropertyForm();
    expect(form.statusId).toBe(100);
  });

  it('returns a new object on each call', () => {
    const a = emptyPropertyForm();
    const b = emptyPropertyForm();
    expect(a).not.toBe(b);
  });
});

describe('formatPrice', () => {
  it('formats a value in INR currency', () => {
    const result = formatPrice(500000);
    expect(result).toContain('5,00,000');
  });

  it('includes rupee symbol', () => {
    expect(formatPrice(1000)).toContain('₹');
  });

  it('formats zero correctly', () => {
    const result = formatPrice(0);
    expect(result).toContain('0');
  });

  it('has no decimal digits', () => {
    const result = formatPrice(1500);
    expect(result).not.toContain('.');
  });

  it('formats large crore value correctly', () => {
    const result = formatPrice(10000000);
    expect(result).toContain('1,00,00,000');
  });
});