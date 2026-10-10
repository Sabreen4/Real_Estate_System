import { ChartOptions } from 'chart.js';

export function getBreakdownChartOptions(
  pctFn: (n: number) => number
): ChartOptions<'bar'> {
  return {
    indexAxis:           'y',
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx =>
            ` ${ctx.dataset.label}: ${ctx.parsed.x}` +
            ` (${pctFn(ctx.parsed.x as number)}%)`
        }
      }
    },
    scales: {
      x: { display: false, stacked: true },
      y: { display: false, stacked: true }
    }
  };
}

export function getBreakdownDatasets(
  segs: { label: string; count: number; color: string }[]
) {
  return segs.map((seg, i) => ({
    label:           seg.label,
    data:            [seg.count],
    backgroundColor: seg.color,
    borderWidth:     0,
    borderSkipped:   false,
    borderRadius:
      i === 0                  ? { topLeft: 6, bottomLeft: 6 }  :
      i === segs.length - 1    ? { topRight: 6, bottomRight: 6 } : 0,
  }));
}