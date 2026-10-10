import { getApptStatusClass, getOfferStatusClass, getPaymentStatusClass } from './buyer-status.config';

describe('getApptStatusClass', () => {
  it('returns ts-approved for APPROVED', () => {
    expect(getApptStatusClass('APPROVED')).toBe('ts-approved');
  });

  it('is case-insensitive for approved', () => {
    expect(getApptStatusClass('approved')).toBe('ts-approved');
  });

  it('returns ts-rejected for REJECTED', () => {
    expect(getApptStatusClass('REJECTED')).toBe('ts-rejected');
  });

  it('is case-insensitive for rejected', () => {
    expect(getApptStatusClass('rejected')).toBe('ts-rejected');
  });

  it('returns ts-pending for PENDING', () => {
    expect(getApptStatusClass('PENDING')).toBe('ts-pending');
  });

  it('returns ts-pending for empty string (defaults to PENDING)', () => {
    expect(getApptStatusClass('')).toBe('ts-pending');
  });

  it('returns ts-pending for unknown status', () => {
    expect(getApptStatusClass('CANCELLED')).toBe('ts-pending');
  });
});

describe('getOfferStatusClass', () => {
  it('returns ts-approved for APPROVED', () => {
    expect(getOfferStatusClass('APPROVED')).toBe('ts-approved');
  });

  it('is case-insensitive for approved', () => {
    expect(getOfferStatusClass('approved')).toBe('ts-approved');
  });

  it('returns ts-rejected for REJECTED', () => {
    expect(getOfferStatusClass('REJECTED')).toBe('ts-rejected');
  });

  it('is case-insensitive for rejected', () => {
    expect(getOfferStatusClass('rejected')).toBe('ts-rejected');
  });

  it('returns ts-pending for PENDING', () => {
    expect(getOfferStatusClass('PENDING')).toBe('ts-pending');
  });

  it('returns ts-pending for empty string', () => {
    expect(getOfferStatusClass('')).toBe('ts-pending');
  });

  it('returns ts-pending for unknown status', () => {
    expect(getOfferStatusClass('WITHDRAWN')).toBe('ts-pending');
  });
});

describe('getPaymentStatusClass', () => {
  it('returns ts-approved for COMPLETED', () => {
    expect(getPaymentStatusClass('COMPLETED')).toBe('ts-approved');
  });

  it('is case-insensitive for completed', () => {
    expect(getPaymentStatusClass('completed')).toBe('ts-approved');
  });

  it('returns ts-rejected for FAILED', () => {
    expect(getPaymentStatusClass('FAILED')).toBe('ts-rejected');
  });

  it('is case-insensitive for failed', () => {
    expect(getPaymentStatusClass('failed')).toBe('ts-rejected');
  });

  it('returns ts-pending for empty string', () => {
    expect(getPaymentStatusClass('')).toBe('ts-pending');
  });

  it('returns ts-pending for unknown status', () => {
    expect(getPaymentStatusClass('PROCESSING')).toBe('ts-pending');
  });
});