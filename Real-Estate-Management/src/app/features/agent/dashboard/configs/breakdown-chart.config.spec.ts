import { getBreakdownChartOptions, getBreakdownDatasets } from './breakdown-chart.config'; // ← fix path

import { TooltipItem, TooltipModel, ChartType } from 'chart.js';

describe('getBreakdownChartOptions', () => {
  it('label callback interpolates value and pctFn result', () => {
    const pctFn = jasmine.createSpy().and.returnValue(42);
    const opts  = getBreakdownChartOptions(pctFn);
    const cb    = opts.plugins!.tooltip!.callbacks!.label!;
    const ctx   = { dataset: { label: 'Active' }, parsed: { x: 10 } } as unknown as TooltipItem<'bar'>;

    // ← fix: provide a valid `this` context to satisfy TooltipModel<'bar'>
   const result = (cb as Function).call({}, ctx);

    expect(pctFn).toHaveBeenCalledWith(10);
    expect(result).toBe(' Active: 10 (42%)');
  });
});

describe('getBreakdownDatasets', () => {
  const segs = [
    { label: 'A', count: 1, color: 'red'   },
    { label: 'B', count: 2, color: 'green' },
    { label: 'C', count: 3, color: 'blue'  },
  ];

  it('first segment gets left border radius', () => {
    const [first] = getBreakdownDatasets(segs);
    expect(first.borderRadius).toEqual({ topLeft: 6, bottomLeft: 6 });
  });

  it('last segment gets right border radius', () => {
    const last = getBreakdownDatasets(segs)[2];
    expect(last.borderRadius).toEqual({ topRight: 6, bottomRight: 6 });
  });

  it('middle segment gets zero border radius', () => {
    const middle = getBreakdownDatasets(segs)[1];
    expect(middle.borderRadius).toBe(0);
  });

  it('single segment gets left radius (i === 0 wins over last)', () => {
    const [only] = getBreakdownDatasets([{ label: 'X', count: 5, color: 'purple' }]);
    expect(only.borderRadius).toEqual({ topLeft: 6, bottomLeft: 6 });
  });
});