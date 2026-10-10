import { getValueBarOptions, VALUE_BAR_DATASET_DEFAULTS } from './value-chart.config';
import { TooltipItem } from 'chart.js';

describe('VALUE_BAR_DATASET_DEFAULTS', () => {
  it('has correct static values', () => {
    expect(VALUE_BAR_DATASET_DEFAULTS.label).toBe('Portfolio value');
    expect(VALUE_BAR_DATASET_DEFAULTS.borderRadius).toBe(4);
    expect(VALUE_BAR_DATASET_DEFAULTS.barPercentage).toBe(0.5);
  });
});

describe('getValueBarOptions', () => {
  const fmt  = jasmine.createSpy('fmt').and.callFake((v: number) => `₹${v}`);
  const opts = getValueBarOptions('#333', 'rgba(0,0,0,0.06)', fmt);

  it('tooltip label callback formats parsed.y with fmt', () => {
    const cb  = opts.plugins!.tooltip!.callbacks!.label!;
    const ctx = { parsed: { y: 2500000 } } as unknown as TooltipItem<'bar'>;

    const result = (cb as Function).call({}, ctx);

    expect(fmt).toHaveBeenCalledWith(2500000);
    expect(result).toBe(' ₹2500000');
  });

  
it('y-axis tick callback formats value with fmt', () => {
  const tickCb = opts.scales!['y']!.ticks!.callback!;
  const result = (tickCb as Function).call({}, 1000000, 0, []);
  expect(fmt).toHaveBeenCalledWith(1000000);
  expect(result).toBe('₹1000000'); // ← no leading space
});
  it('x-axis ticks use provided txt color', () => {
    expect((opts.scales!['x']!.ticks as any).color).toBe('#333');
  });

  it('y-axis ticks use provided txt color', () => {
    expect((opts.scales!['y']!.ticks as any).color).toBe('#333');
  });

  it('y-axis grid uses provided grid color', () => {
    expect((opts.scales!['y']!.grid as any).color).toBe('rgba(0,0,0,0.06)');
  });
});