import { getChartTheme, fmtINR } from './chart-theme.config';

describe('getChartTheme', () => {
  function mockMedia(dark: boolean) {
    spyOn(window, 'matchMedia').and.returnValue({ matches: dark } as MediaQueryList);
  }

  it('returns dark theme colors when dark mode is active', () => {
    mockMedia(true);
    const theme = getChartTheme();
    expect(theme.txt).toBe('#c2c0b6');
    expect(theme.grid).toBe('rgba(255,255,255,0.06)');
  });

  it('returns light theme colors when dark mode is inactive', () => {
    mockMedia(false);
    const theme = getChartTheme();
    expect(theme.txt).toBe('#4b5563');
    expect(theme.grid).toBe('rgba(0,0,0,0.06)');
  });
});

describe('fmtINR', () => {
  it('formats values >= 1 crore with Cr suffix', () => {
    expect(fmtINR(1e7)).toBe('₹1.0 Cr');
    expect(fmtINR(2.5e7)).toBe('₹2.5 Cr');
  });

  it('formats values >= 1 lakh with L suffix', () => {
    expect(fmtINR(1e5)).toBe('₹1 L');
    expect(fmtINR(5.6e5)).toBe('₹6 L');
  });

  it('formats values below 1 lakh with locale string', () => {
    expect(fmtINR(999)).toBe('₹999');
    expect(fmtINR(50000)).toBe('₹50,000');
  });

  it('1 crore boundary prefers Cr over L', () => {
    expect(fmtINR(1e7)).toContain('Cr');
  });

  it('exactly 1 lakh boundary uses L', () => {
    expect(fmtINR(100000)).toContain('L');
  });
});