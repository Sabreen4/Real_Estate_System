export interface ChartTheme {
  txt:  string;
  grid: string;
}

export function getChartTheme(): ChartTheme {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    txt:  dark ? '#c2c0b6' : '#4b5563',
    grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };
}

export function fmtINR(v: number): string {
  if (v >= 1e7) return '₹' + (v / 1e7).toFixed(1) + ' Cr';
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(0) + ' L';
  return '₹' + v.toLocaleString('en-IN');
}