import { ChartOptions } from 'chart.js';

export const VALUE_BAR_DATASET_DEFAULTS = {
  label:         'Portfolio value',
  borderRadius:   4,
  barPercentage:  0.5,
} as const;

export function getValueBarOptions(
  txt:  string,
  grid: string,
  fmt:  (v: number) => string
): ChartOptions<'bar'> {
  return {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ' ' + fmt(ctx.parsed.y as number)
        }
      }
    },
    scales: {
      x: {
        ticks: { color: txt },
        grid:  { display: false }
      },
      y: {
        ticks:       { color: txt, callback: v => fmt(+v) },
        grid:        { color: grid },
        beginAtZero: true
      }
    }
  };
}