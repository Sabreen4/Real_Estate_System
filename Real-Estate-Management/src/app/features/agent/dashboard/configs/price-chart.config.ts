import { ChartOptions } from 'chart.js';

export const PRICE_BAR_DATASET_DEFAULTS = {
  label:          'Price',
  backgroundColor: '#185FA5',
  borderRadius:    4,
  barPercentage:   0.55,
} as const;

export function getPriceBarOptions(
  txt:   string,
  grid:  string,
  fmt:   (v: number) => string
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
        ticks: { color: txt, maxRotation: 45, autoSkip: false },
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