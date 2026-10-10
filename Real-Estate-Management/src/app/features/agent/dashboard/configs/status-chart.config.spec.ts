import { getStatusDonutOptions } from './status-chart.config';
import { TooltipItem } from 'chart.js';

describe('getStatusDonutOptions', () => {
  function callLabel(parsed: number, label: string): unknown {
    const opts = getStatusDonutOptions();
    const cb   = opts.plugins!.tooltip!.callbacks!.label!;
    const ctx  = { label, parsed } as unknown as TooltipItem<'doughnut'>;
    return (cb as Function).call({}, ctx);
  }

  it('uses singular "property" when count is 1', () => {
    expect(callLabel(1, 'Active')).toBe(' Active: 1 property');
  });

  it('uses plural "properties" when count is 0', () => {
    expect(callLabel(0, 'Inactive')).toBe(' Inactive: 0 properties');
  });

  it('uses plural "properties" when count is greater than 1', () => {
    expect(callLabel(5, 'Sold')).toBe(' Sold: 5 properties');
  });
});