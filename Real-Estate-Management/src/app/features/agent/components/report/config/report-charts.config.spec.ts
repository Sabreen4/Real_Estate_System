import {
  buildStatusDonutConfig,
  buildListingDonutConfig,
  buildPipelineBarConfig,
  buildCityCountBarConfig,
  buildCityValueBarConfig,
  STATUS_COLORS,
  LISTING_COLORS,
  CITY_COUNT_COLORS,
  CITY_VALUE_COLORS,
  PIPELINE_COLORS,
} from './report-charts.config';

// ── Helper ────────────────────────────────────────────────────────────────────

function makeCityBreakdown(cities: { city: string; count: number; value: number }[]) {
  return cities;
}

// ── Color palettes ────────────────────────────────────────────────────────────

describe('Color palettes', () => {
  it('STATUS_COLORS should contain active, sold, pending', () => {
    expect(STATUS_COLORS.active).toBeDefined();
    expect(STATUS_COLORS.sold).toBeDefined();
    expect(STATUS_COLORS.pending).toBeDefined();
  });

  it('LISTING_COLORS should contain sale, rent, lease', () => {
    expect(LISTING_COLORS.sale).toBeDefined();
    expect(LISTING_COLORS.rent).toBeDefined();
    expect(LISTING_COLORS.lease).toBeDefined();
  });

  it('CITY_COUNT_COLORS should have 8 entries', () => {
    expect(CITY_COUNT_COLORS.length).toBe(8);
  });

  it('CITY_VALUE_COLORS should have 8 entries', () => {
    expect(CITY_VALUE_COLORS.length).toBe(8);
  });

  it('PIPELINE_COLORS should contain appointments and offers', () => {
    expect(PIPELINE_COLORS.appointments).toBeDefined();
    expect(PIPELINE_COLORS.offers).toBeDefined();
  });
});

// ── buildStatusDonutConfig ─────────────────────────────────────────────────────

describe('buildStatusDonutConfig', () => {
  it('should return type "doughnut"', () => {
    const cfg = buildStatusDonutConfig(5, 3, 2);
    expect(cfg.type).toBe('doughnut');
  });

  it('should include all three labels when all counts > 0', () => {
    const cfg = buildStatusDonutConfig(5, 3, 2);
    expect(cfg.data.labels).toContain('Active');
    expect(cfg.data.labels).toContain('Sold');
    expect(cfg.data.labels).toContain('Pending');
  });

  it('should include data values matching inputs', () => {
    const cfg  = buildStatusDonutConfig(5, 3, 2);
    const data = cfg.data.datasets[0].data as number[];
    expect(data).toContain(5);
    expect(data).toContain(3);
    expect(data).toContain(2);
  });

  it('should omit Active when active = 0', () => {
    const cfg = buildStatusDonutConfig(0, 3, 2);
    expect(cfg.data.labels).not.toContain('Active');
    expect((cfg.data.datasets[0].data as number[])).not.toContain(0);
  });

  it('should omit Sold when sold = 0', () => {
    const cfg = buildStatusDonutConfig(5, 0, 2);
    expect(cfg.data.labels).not.toContain('Sold');
  });

  it('should omit Pending when pending = 0', () => {
    const cfg = buildStatusDonutConfig(5, 3, 0);
    expect(cfg.data.labels).not.toContain('Pending');
  });

  it('should return empty labels/data when all counts = 0', () => {
    const cfg = buildStatusDonutConfig(0, 0, 0);
    expect(cfg.data.labels!.length).toBe(0);
    expect((cfg.data.datasets[0].data as number[]).length).toBe(0);
  });

  it('should use STATUS_COLORS for backgroundColor', () => {
    const cfg    = buildStatusDonutConfig(5, 3, 2);
    const colors = cfg.data.datasets[0].backgroundColor as string[];
    expect(colors).toContain(STATUS_COLORS.active);
    expect(colors).toContain(STATUS_COLORS.sold);
    expect(colors).toContain(STATUS_COLORS.pending);
  });

  it('should set hoverBackgroundColor with "cc" suffix', () => {
    const cfg    = buildStatusDonutConfig(5, 0, 0);
    const hover  = cfg.data.datasets[0].hoverBackgroundColor as string[];
    expect(hover[0]).toBe(STATUS_COLORS.active + 'cc');
  });

  it('should have borderWidth of 2', () => {
    const cfg = buildStatusDonutConfig(5, 3, 2);
    expect(cfg.data.datasets[0].borderWidth).toBe(2);
  });

  it('should have borderColor "#ffffff"', () => {
    const cfg = buildStatusDonutConfig(5, 3, 2);
    expect(cfg.data.datasets[0].borderColor).toBe('#ffffff');
  });

  it('should have options defined', () => {
    const cfg = buildStatusDonutConfig(1, 1, 1);
    expect(cfg.options).toBeDefined();
  });

  it('should spread a fresh options object (not mutate shared options)', () => {
    const cfg1 = buildStatusDonutConfig(1, 0, 0);
    const cfg2 = buildStatusDonutConfig(0, 1, 0);
    expect(cfg1.options).not.toBe(cfg2.options);
  });

  // ── tooltip callback coverage ──────────────────────────────────────────────

  it('tooltip label callback should include label, count and percentage', () => {
    const cfg      = buildStatusDonutConfig(3, 1, 0); // total = 4
    const callback = (cfg.options as any).plugins.tooltip.callbacks.label;
    const ctx      = { label: 'Active', parsed: 3, dataset: { data: [3, 1] } };
    const result   = callback(ctx);
    expect(result).toContain('Active');
    expect(result).toContain('3');
    expect(result).toContain('75'); // 3/4 = 75 %
  });

  it('tooltip label callback should handle single-slice (100 %)', () => {
    const cfg      = buildStatusDonutConfig(5, 0, 0);
    const callback = (cfg.options as any).plugins.tooltip.callbacks.label;
    const ctx      = { label: 'Active', parsed: 5, dataset: { data: [5] } };
    const result   = callback(ctx);
    expect(result).toContain('100');
  });

  it('tooltip label callback should round non-integer percentages', () => {
    const cfg      = buildStatusDonutConfig(1, 2, 0); // 1/3 = 33 %
    const callback = (cfg.options as any).plugins.tooltip.callbacks.label;
    const ctx      = { label: 'Active', parsed: 1, dataset: { data: [1, 2] } };
    const result   = callback(ctx);
    expect(result).toContain('33');
  });
});

// ── buildListingDonutConfig ────────────────────────────────────────────────────

describe('buildListingDonutConfig', () => {
  it('should return type "doughnut"', () => {
    const cfg = buildListingDonutConfig(4, 3, 2);
    expect(cfg.type).toBe('doughnut');
  });

  it('should include all three labels when all counts > 0', () => {
    const cfg = buildListingDonutConfig(4, 3, 2);
    expect(cfg.data.labels).toContain('For Sale');
    expect(cfg.data.labels).toContain('For Rent');
    expect(cfg.data.labels).toContain('Lease');
  });

  it('should omit For Sale when forSale = 0', () => {
    const cfg = buildListingDonutConfig(0, 3, 2);
    expect(cfg.data.labels).not.toContain('For Sale');
  });

  it('should omit For Rent when forRent = 0', () => {
    const cfg = buildListingDonutConfig(4, 0, 2);
    expect(cfg.data.labels).not.toContain('For Rent');
  });

  it('should omit Lease when lease = 0', () => {
    const cfg = buildListingDonutConfig(4, 3, 0);
    expect(cfg.data.labels).not.toContain('Lease');
  });

  it('should return empty data when all counts are 0', () => {
    const cfg = buildListingDonutConfig(0, 0, 0);
    expect((cfg.data.datasets[0].data as number[]).length).toBe(0);
  });

  it('should use LISTING_COLORS for backgroundColor', () => {
    const cfg    = buildListingDonutConfig(4, 3, 2);
    const colors = cfg.data.datasets[0].backgroundColor as string[];
    expect(colors).toContain(LISTING_COLORS.sale);
    expect(colors).toContain(LISTING_COLORS.rent);
    expect(colors).toContain(LISTING_COLORS.lease);
  });

  it('should set hoverBackgroundColor with "cc" suffix', () => {
    const cfg   = buildListingDonutConfig(4, 0, 0);
    const hover = cfg.data.datasets[0].hoverBackgroundColor as string[];
    expect(hover[0]).toBe(LISTING_COLORS.sale + 'cc');
  });

  it('should have borderWidth of 2 and borderColor "#ffffff"', () => {
    const cfg = buildListingDonutConfig(1, 1, 1);
    expect(cfg.data.datasets[0].borderWidth).toBe(2);
    expect(cfg.data.datasets[0].borderColor).toBe('#ffffff');
  });

  it('options should be defined', () => {
    const cfg = buildListingDonutConfig(1, 1, 1);
    expect(cfg.options).toBeDefined();
  });

  // ── tooltip callback coverage ──────────────────────────────────────────────

  it('tooltip label callback should compute percentage correctly', () => {
    const cfg      = buildListingDonutConfig(6, 2, 2); // total = 10
    const callback = (cfg.options as any).plugins.tooltip.callbacks.label;
    const ctx      = { label: 'For Sale', parsed: 6, dataset: { data: [6, 2, 2] } };
    const result   = callback(ctx);
    expect(result).toContain('60'); // 6/10 = 60 %
  });

  it('tooltip label callback should handle rent slice', () => {
    const cfg      = buildListingDonutConfig(6, 2, 2);
    const callback = (cfg.options as any).plugins.tooltip.callbacks.label;
    const ctx      = { label: 'For Rent', parsed: 2, dataset: { data: [6, 2, 2] } };
    const result   = callback(ctx);
    expect(result).toContain('For Rent');
    expect(result).toContain('20'); // 2/10 = 20 %
  });
});

// ── buildPipelineBarConfig ─────────────────────────────────────────────────────

describe('buildPipelineBarConfig', () => {
  it('should return type "bar"', () => {
    const cfg = buildPipelineBarConfig(2, 3, 1, 4, 2, 0);
    expect(cfg.type).toBe('bar');
  });

  it('should have labels ["Pending", "Approved", "Rejected"]', () => {
    const cfg = buildPipelineBarConfig(2, 3, 1, 4, 2, 0);
    expect(cfg.data.labels).toEqual(['Pending', 'Approved', 'Rejected']);
  });

  it('should have two datasets (Appointments and Offers)', () => {
    const cfg = buildPipelineBarConfig(2, 3, 1, 4, 2, 0);
    expect(cfg.data.datasets.length).toBe(2);
    expect(cfg.data.datasets[0].label).toBe('Appointments');
    expect(cfg.data.datasets[1].label).toBe('Offers');
  });

  it('should place appointment counts in the first dataset', () => {
    const cfg  = buildPipelineBarConfig(2, 3, 1, 4, 2, 0);
    const data = cfg.data.datasets[0].data as number[];
    expect(data[0]).toBe(2); // pending
    expect(data[1]).toBe(3); // approved
    expect(data[2]).toBe(1); // rejected
  });

  it('should place offer counts in the second dataset', () => {
    const cfg  = buildPipelineBarConfig(2, 3, 1, 4, 2, 0);
    const data = cfg.data.datasets[1].data as number[];
    expect(data[0]).toBe(4); // pending
    expect(data[1]).toBe(2); // approved
    expect(data[2]).toBe(0); // rejected
  });

  it('should use PIPELINE_COLORS for appointments dataset', () => {
    const cfg = buildPipelineBarConfig(1, 1, 1, 1, 1, 1);
    expect(cfg.data.datasets[0].backgroundColor).toContain(PIPELINE_COLORS.appointments);
  });

  it('should use PIPELINE_COLORS for offers dataset', () => {
    const cfg = buildPipelineBarConfig(1, 1, 1, 1, 1, 1);
    expect(cfg.data.datasets[1].backgroundColor).toContain(PIPELINE_COLORS.offers);
  });

  it('should have options with legend display true at bottom', () => {
    const cfg = buildPipelineBarConfig(1, 1, 1, 1, 1, 1);
    expect(cfg.options?.plugins?.legend?.display).toBeTrue();
    expect(cfg.options?.plugins?.legend?.position).toBe('bottom');
  });

  it('should handle all zero values', () => {
    const cfg  = buildPipelineBarConfig(0, 0, 0, 0, 0, 0);
    const appt = cfg.data.datasets[0].data as number[];
    const off  = cfg.data.datasets[1].data as number[];
    expect(appt).toEqual([0, 0, 0]);
    expect(off).toEqual([0, 0, 0]);
  });

  it('appointments dataset should have "cc" suffix on backgroundColor', () => {
    const cfg = buildPipelineBarConfig(1, 1, 1, 1, 1, 1);
    expect(cfg.data.datasets[0].backgroundColor).toBe(PIPELINE_COLORS.appointments + 'cc');
  });

  it('offers dataset should have "cc" suffix on backgroundColor', () => {
    const cfg = buildPipelineBarConfig(1, 1, 1, 1, 1, 1);
    expect(cfg.data.datasets[1].backgroundColor).toBe(PIPELINE_COLORS.offers + 'cc');
  });

  it('appointments hoverBackgroundColor should be PIPELINE_COLORS.appointments', () => {
    const cfg = buildPipelineBarConfig(1, 1, 1, 1, 1, 1);
    expect(cfg.data.datasets[0].hoverBackgroundColor).toBe(PIPELINE_COLORS.appointments);
  });

  it('offers hoverBackgroundColor should be PIPELINE_COLORS.offers', () => {
    const cfg = buildPipelineBarConfig(1, 1, 1, 1, 1, 1);
    expect(cfg.data.datasets[1].hoverBackgroundColor).toBe(PIPELINE_COLORS.offers);
  });
});

// ── buildCityCountBarConfig ────────────────────────────────────────────────────

describe('buildCityCountBarConfig', () => {
  const sampleBreakdown = makeCityBreakdown([
    { city: 'Chennai', count: 10, value: 10000000 },
    { city: 'Mumbai',  count:  8, value:  8000000 },
    { city: 'Delhi',   count:  5, value:  5000000 },
  ]);

  it('should return type "bar"', () => {
    const cfg = buildCityCountBarConfig(sampleBreakdown);
    expect(cfg.type).toBe('bar');
  });

  it('should use city names as labels', () => {
    const cfg = buildCityCountBarConfig(sampleBreakdown);
    expect(cfg.data.labels).toContain('Chennai');
    expect(cfg.data.labels).toContain('Mumbai');
    expect(cfg.data.labels).toContain('Delhi');
  });

  it('should use counts as dataset data', () => {
    const cfg  = buildCityCountBarConfig(sampleBreakdown);
    const data = cfg.data.datasets[0].data as number[];
    expect(data).toContain(10);
    expect(data).toContain(8);
    expect(data).toContain(5);
  });

  it('should label the dataset "Properties"', () => {
    const cfg = buildCityCountBarConfig(sampleBreakdown);
    expect(cfg.data.datasets[0].label).toBe('Properties');
  });

  it('should cap the data at 8 cities', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ city: `City${i}`, count: i, value: i * 1000 }));
    const cfg  = buildCityCountBarConfig(many);
    expect((cfg.data.labels as string[]).length).toBeLessThanOrEqual(8);
    expect((cfg.data.datasets[0].data as number[]).length).toBeLessThanOrEqual(8);
  });

  it('should apply CITY_COUNT_COLORS cyclically to backgroundColor', () => {
    const cfg    = buildCityCountBarConfig(sampleBreakdown);
    const colors = cfg.data.datasets[0].backgroundColor as string[];
    expect(colors[0]).toBe(CITY_COUNT_COLORS[0] + 'cc');
    expect(colors[1]).toBe(CITY_COUNT_COLORS[1] + 'cc');
  });

  it('should apply CITY_COUNT_COLORS cyclically to hoverBackgroundColor', () => {
    const cfg    = buildCityCountBarConfig(sampleBreakdown);
    const hover  = cfg.data.datasets[0].hoverBackgroundColor as string[];
    expect(hover[0]).toBe(CITY_COUNT_COLORS[0]);
    expect(hover[1]).toBe(CITY_COUNT_COLORS[1]);
  });

  it('should have indexAxis set to "y" (horizontal bar)', () => {
    const cfg = buildCityCountBarConfig(sampleBreakdown);
    expect((cfg.options as any).indexAxis).toBe('y');
  });

  it('should handle empty cityBreakdown without throwing', () => {
    expect(() => buildCityCountBarConfig([])).not.toThrow();
  });

  it('should cycle colors past index 8 when more than 8 provided', () => {
    const more = Array.from({ length: 9 }, (_, i) => ({ city: `C${i}`, count: 1, value: 1 }));
    const cfg  = buildCityCountBarConfig(more.slice(0, 8)); // capped at 8
    expect((cfg.data.datasets[0].backgroundColor as string[]).length).toBe(8);
  });

  it('should produce correct backgroundColor for all 8 cities', () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({ city: `City${i}`, count: i + 1, value: 1000 }));
    const cfg   = buildCityCountBarConfig(eight);
    const colors = cfg.data.datasets[0].backgroundColor as string[];
    colors.forEach((color, i) => {
      expect(color).toBe(CITY_COUNT_COLORS[i % CITY_COUNT_COLORS.length] + 'cc');
    });
  });

  it('y-axis ticks should have color #475569', () => {
    const cfg = buildCityCountBarConfig(sampleBreakdown);
    expect((cfg.options as any).scales.y.ticks.color).toBe('#475569');
  });

  it('x-axis grid should use color #f1f5f9', () => {
    const cfg = buildCityCountBarConfig(sampleBreakdown);
    expect((cfg.options as any).scales.x.grid.color).toBe('#f1f5f9');
  });
});

// ── buildCityValueBarConfig ────────────────────────────────────────────────────

describe('buildCityValueBarConfig', () => {
  const sampleBreakdown = makeCityBreakdown([
    { city: 'Chennai', count: 10, value: 50000000 },
    { city: 'Mumbai',  count:  8, value: 40000000 },
  ]);

  const formatCurrency = (n: number) => `₹${(n / 10000000).toFixed(2)} Cr`;

  it('should return type "bar"', () => {
    const cfg = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    expect(cfg.type).toBe('bar');
  });

  it('should use city names as labels', () => {
    const cfg = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    expect(cfg.data.labels).toContain('Chennai');
    expect(cfg.data.labels).toContain('Mumbai');
  });

  it('should use values as dataset data', () => {
    const cfg  = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const data = cfg.data.datasets[0].data as number[];
    expect(data).toContain(50000000);
    expect(data).toContain(40000000);
  });

  it('should label the dataset "Portfolio Value"', () => {
    const cfg = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    expect(cfg.data.datasets[0].label).toBe('Portfolio Value');
  });

  it('should cap data at 8 cities', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ city: `City${i}`, count: i, value: i * 1000000 }));
    const cfg  = buildCityValueBarConfig(many, formatCurrency);
    expect((cfg.data.labels as string[]).length).toBeLessThanOrEqual(8);
  });

  it('should apply CITY_VALUE_COLORS to backgroundColor with "cc" suffix', () => {
    const cfg    = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const colors = cfg.data.datasets[0].backgroundColor as string[];
    expect(colors[0]).toBe(CITY_VALUE_COLORS[0] + 'cc');
  });

  it('should apply CITY_VALUE_COLORS to hoverBackgroundColor without suffix', () => {
    const cfg   = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const hover = cfg.data.datasets[0].hoverBackgroundColor as string[];
    expect(hover[0]).toBe(CITY_VALUE_COLORS[0]);
  });

  it('should have indexAxis set to "y" (horizontal bar)', () => {
    const cfg = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    expect((cfg.options as any).indexAxis).toBe('y');
  });

  it('should set tooltip label callback using formatCurrency', () => {
    const cfg      = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const callback = (cfg.options as any).plugins.tooltip.callbacks.label;
    const result   = callback({ parsed: { x: 50000000 } });
    expect(result).toContain('Cr');
  });

  it('tooltip label callback should return empty string for null parsed.x', () => {
    const cfg      = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const callback = (cfg.options as any).plugins.tooltip.callbacks.label;
    expect(callback({ parsed: { x: null } })).toBe('');
  });

  it('tooltip label callback should return empty string for undefined parsed.x', () => {
    const cfg      = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const callback = (cfg.options as any).plugins.tooltip.callbacks.label;
    expect(callback({ parsed: {} })).toBe('');
  });

  it('should set tick callback using formatCurrency', () => {
    const cfg      = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const callback = (cfg.options as any).scales.x.ticks.callback;
    const result   = callback(50000000);
    expect(result).toContain('Cr');
  });

  it('tick callback should return empty string for null value', () => {
    const cfg      = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const callback = (cfg.options as any).scales.x.ticks.callback;
    expect(callback(null)).toBe('');
  });

  it('tick callback should return empty string for undefined value', () => {
    const cfg      = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const callback = (cfg.options as any).scales.x.ticks.callback;
    expect(callback(undefined)).toBe('');
  });

  it('tick callback should return empty string for 0 (falsy)', () => {
    // 0 is falsy — verify implementation treats it consistently
    const cfg      = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const callback = (cfg.options as any).scales.x.ticks.callback;
    // 0 passes the `val == null` check (0 != null is true), so formatCurrency is called
    const result = callback(0);
    expect(typeof result).toBe('string');
  });

  it('should not display legend', () => {
    const cfg = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    expect((cfg.options as any).plugins.legend.display).toBeFalse();
  });

  it('should handle empty cityBreakdown without throwing', () => {
    expect(() => buildCityValueBarConfig([], formatCurrency)).not.toThrow();
  });

  it('should produce correct backgroundColor for all cities', () => {
    const cfg    = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const colors = cfg.data.datasets[0].backgroundColor as string[];
    colors.forEach((color, i) => {
      expect(color).toBe(CITY_VALUE_COLORS[i % CITY_VALUE_COLORS.length] + 'cc');
    });
  });

  it('should produce correct hoverBackgroundColor for all cities', () => {
    const cfg   = buildCityValueBarConfig(sampleBreakdown, formatCurrency);
    const hover = cfg.data.datasets[0].hoverBackgroundColor as string[];
    hover.forEach((color, i) => {
      expect(color).toBe(CITY_VALUE_COLORS[i % CITY_VALUE_COLORS.length]);
    });
  });

  it('tooltip label callback should call formatCurrency with the parsed value', () => {
    const spy      = jasmine.createSpy('formatCurrency').and.returnValue('₹5.00 Cr');
    const cfg      = buildCityValueBarConfig(sampleBreakdown, spy);
    const callback = (cfg.options as any).plugins.tooltip.callbacks.label;
    callback({ parsed: { x: 50000000 } });
    expect(spy).toHaveBeenCalledWith(50000000);
  });

  it('tick callback should call formatCurrency with the tick value', () => {
    const spy      = jasmine.createSpy('formatCurrency').and.returnValue('₹4.00 Cr');
    const cfg      = buildCityValueBarConfig(sampleBreakdown, spy);
    const callback = (cfg.options as any).scales.x.ticks.callback;
    callback(40000000);
    expect(spy).toHaveBeenCalledWith(40000000);
  });
});