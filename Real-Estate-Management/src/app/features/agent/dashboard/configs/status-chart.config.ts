import { ChartOptions } from 'chart.js';

export function getStatusDonutOptions(): ChartOptions<'doughnut'> {
  return {
    responsive:          true,
    maintainAspectRatio: false,
    cutout:              '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx =>
            ' ' + ctx.label + ': ' + ctx.parsed +
            ' propert' + (ctx.parsed === 1 ? 'y' : 'ies')
        }
      }
    }
  };
}