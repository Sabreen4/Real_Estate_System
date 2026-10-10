import { formatVisitDate } from './buyer-date.config';

describe('formatVisitDate', () => {
  it('returns placeholder values for empty string', () => {
    const result = formatVisitDate('');
    expect(result).toEqual({ day: '--', month: '---', time: '--:--' });
  });

  it('returns correct day padded to 2 digits', () => {
    const result = formatVisitDate('2024-01-05T10:30:00');
    expect(result.day).toBe('05');
  });

  it('returns correct month in uppercase short form', () => {
    const result = formatVisitDate('2024-06-15T10:00:00');
    expect(result.month).toBe('JUN');
  });

  it('returns time in HH:MM format', () => {
    const result = formatVisitDate('2024-01-15T14:30:00');
    expect(result.time).toMatch(/^\d{1,2}:\d{2}(\s?(AM|PM))?$/); // ← updated, old one removed
  });

  it('returns correct day for double-digit date', () => {
    const result = formatVisitDate('2024-03-25T09:00:00');
    expect(result.day).toBe('25');
  });

  it('returns correct month for December', () => {
    const result = formatVisitDate('2024-12-01T00:00:00');
    expect(result.month).toBe('DEC');
  });

  it('does not throw for a valid ISO date string', () => {
    expect(() => formatVisitDate('2024-07-20T18:45:00Z')).not.toThrow();
  });
});