import { getListingDonutOptions } from './listing-chart.config';
import { TooltipItem } from 'chart.js';

describe('getListingDonutOptions', () => {
  it('label callback formats label and parsed value', () => {
    const opts = getListingDonutOptions();
    const cb   = opts.plugins!.tooltip!.callbacks!.label!;
    const ctx  = { label: 'For Sale', parsed: 42 } as unknown as TooltipItem<'doughnut'>;

    const result = (cb as Function).call({}, ctx);

    expect(result).toBe(' For Sale: 42');
  });
});