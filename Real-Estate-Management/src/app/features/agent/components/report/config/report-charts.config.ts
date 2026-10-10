import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';

// ── Color Palettes ────────────────────────────────────────────────────────────

export const STATUS_COLORS = {
  active:  '#10b981',
  sold:    '#ef4444',
  pending: '#f59e0b',
};

export const LISTING_COLORS = {
  sale:  '#3b82f6',
  rent:  '#0ea5e9',
  lease: '#8b5cf6',
};

export const CITY_COUNT_COLORS = [
  '#3b82f6','#6366f1','#10b981','#f59e0b',
  '#ef4444','#0ea5e9','#8b5cf6','#14b8a6',
];

export const CITY_VALUE_COLORS = [
  '#10b981','#3b82f6','#f59e0b','#6366f1',
  '#ef4444','#0ea5e9','#8b5cf6','#14b8a6',
];

export const PIPELINE_COLORS = {
  appointments: '#6366f1',
  offers:       '#10b981',
};

// ── Shared default options ─────────────────────────────────────────────────────

const SHARED_DOUGHNUT_OPTIONS: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 10,
        font: { size: 12, family: "'Inter', sans-serif" },
        color: '#64748b',
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${Math.round(ctx.parsed / (ctx.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0) * 100)}%)`,
      },
    },
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 700,
    easing: 'easeOutQuart',
  },
};

const SHARED_BAR_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 },
    },
  },
  animation: { duration: 700, easing: 'easeOutQuart' },
};

// ── Factory functions ──────────────────────────────────────────────────────────

/**
 * Doughnut config for Property Status chart.
 */
export function buildStatusDonutConfig(
  active: number,
  sold: number,
  pending: number
): ChartConfiguration<'doughnut'> {
  const labels: string[] = [];
  const data: number[]   = [];
  const colors: string[] = [];

  if (active  > 0) { labels.push('Active');  data.push(active);  colors.push(STATUS_COLORS.active);  }
  if (sold    > 0) { labels.push('Sold');    data.push(sold);    colors.push(STATUS_COLORS.sold);    }
  if (pending > 0) { labels.push('Pending'); data.push(pending); colors.push(STATUS_COLORS.pending); }

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map(c => c + 'cc'),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      }],
    },
    options: { ...SHARED_DOUGHNUT_OPTIONS },
  };
}

/**
 * Doughnut config for Listing Type chart.
 */
export function buildListingDonutConfig(
  forSale: number,
  forRent: number,
  lease: number
): ChartConfiguration<'doughnut'> {
  const labels: string[] = [];
  const data: number[]   = [];
  const colors: string[] = [];

  if (forSale > 0) { labels.push('For Sale'); data.push(forSale); colors.push(LISTING_COLORS.sale);  }
  if (forRent > 0) { labels.push('For Rent'); data.push(forRent); colors.push(LISTING_COLORS.rent);  }
  if (lease   > 0) { labels.push('Lease');    data.push(lease);   colors.push(LISTING_COLORS.lease); }

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map(c => c + 'cc'),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      }],
    },
    options: { ...SHARED_DOUGHNUT_OPTIONS },
  };
}

/**
 * Grouped bar config for Appointments vs Offers Pipeline.
 */
export function buildPipelineBarConfig(
  pendingAppts: number,  approvedAppts: number,  rejectedAppts: number,
  pendingOffers: number, approvedOffers: number, rejectedOffers: number,
): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data: {
      labels: ['Pending', 'Approved', 'Rejected'],
      datasets: [
        {
          label: 'Appointments',
          data: [pendingAppts, approvedAppts, rejectedAppts],
          backgroundColor: PIPELINE_COLORS.appointments + 'cc',
          hoverBackgroundColor: PIPELINE_COLORS.appointments,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Offers',
          data: [pendingOffers, approvedOffers, rejectedOffers],
          backgroundColor: PIPELINE_COLORS.offers + 'cc',
          hoverBackgroundColor: PIPELINE_COLORS.offers,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...SHARED_BAR_OPTIONS,
      plugins: {
        ...SHARED_BAR_OPTIONS.plugins,
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyleWidth: 10,
            padding: 16,
            color: '#64748b',
            font: { size: 12 },
          },
        },
      },
    },
  };
}

/**
 * Horizontal bar config for Properties per City (count).
 */
export function buildCityCountBarConfig(
  cityBreakdown: { city: string; count: number; value: number }[]
): ChartConfiguration<'bar'> {
  const top = cityBreakdown.slice(0, 8);
  return {
    type: 'bar',
    data: {
      labels: top.map(d => d.city),
      datasets: [{
        label: 'Properties',
        data: top.map(d => d.count),
        backgroundColor: top.map((_, i) => CITY_COUNT_COLORS[i % CITY_COUNT_COLORS.length] + 'cc'),
        hoverBackgroundColor: top.map((_, i) => CITY_COUNT_COLORS[i % CITY_COUNT_COLORS.length]),
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      ...SHARED_BAR_OPTIONS,
      indexAxis: 'y' as const,
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#475569', font: { size: 12 } },
        },
      },
    },
  };
}

/**
 * Horizontal bar config for Portfolio Value per City.
 */
export function buildCityValueBarConfig(
  cityBreakdown: { city: string; count: number; value: number }[],
  formatCurrency: (n: number) => string,
): ChartConfiguration<'bar'> {
  const top = cityBreakdown.slice(0, 8);
  return {
    type: 'bar',
    data: {
      labels: top.map(d => d.city),
      datasets: [{
        label: 'Portfolio Value',
        data: top.map(d => d.value),
        backgroundColor: top.map((_, i) => CITY_VALUE_COLORS[i % CITY_VALUE_COLORS.length] + 'cc'),
        hoverBackgroundColor: top.map((_, i) => CITY_VALUE_COLORS[i % CITY_VALUE_COLORS.length]),
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      ...SHARED_BAR_OPTIONS,
      indexAxis: 'y' as const,
      plugins: {
        legend: { display: false },
        tooltip: {
         callbacks: {
  label: (ctx) => {
    const val = ctx.parsed?.x;
    return val == null ? '' : ` ${formatCurrency(val)}`;
  },
},
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            color: '#94a3b8',
            font: { size: 11 },
           callback: (val) => (val == null ? '' : formatCurrency(val as number)),
          },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#475569', font: { size: 12 } },
        },
      },
    },
  };
}