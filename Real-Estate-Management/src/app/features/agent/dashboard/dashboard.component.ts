import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Property } from 'src/app/core/models/property.model';
import { AgentPropertyService } from 'src/app/core/services/agent-property.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { BY_TYPE_CONFIG } from './configs/by-types.config';
import { LISTING_SEGMENTS_CONFIG } from './configs/listing-segments.config';
import { KNOWN_STATUSES, STATUS_SEGMENTS_CONFIG } from './configs/status-segments.config';
import { ACTIVE_STATUSES, ALL_KNOWN_STATUSES, CLOSED_STATUSES, CURRENCY_FORMAT_CONFIG } from './configs/property-status.config';
import { CacheService } from 'src/app/core/services/cache.service';
import { getBreakdownChartOptions, getBreakdownDatasets } from './configs/breakdown-chart.config';
import { getChartTheme, fmtINR } from './configs/chart-theme.config';
import { getStatusDonutOptions } from './configs/status-chart.config';
import { getListingDonutOptions } from './configs/listing-chart.config';
import { getPriceBarOptions, PRICE_BAR_DATASET_DEFAULTS } from './configs/price-chart.config';
import { getValueBarOptions, VALUE_BAR_DATASET_DEFAULTS } from './configs/value-chart.config';
Chart.register(...registerables);

/** Shape returned by getAgentProperties — may be a plain array or a paged wrapper. */
interface PagedPropertyResponse {
  items: Property[];
}

/**
 * The raw API response can include ownership fields not yet on the Property model.
 * Extend locally rather than casting to any.
 */
interface RawProperty extends Property {
  ownerId?:   number;
  createdBy?: number;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  properties:  Property[] = [];
  isLoading    = false;
  successMsg   = '';
  errorMsg     = '';
  agentName    = '';
  agentUserId  = 0;

  @ViewChild('statusChart')    statusChartRef!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('listingChart')   listingChartRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('priceChart')     priceChartRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('valueChart')     valueChartRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('breakdownChart') breakdownChartRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  constructor(
    private svc:          AgentPropertyService,
    private auth:         AuthService,
    private router:       Router,
    private cdr:          ChangeDetectorRef,
    private txService:    BuyerTransactionService,
    private cacheService: CacheService
  ) {}

  // ── LIFECYCLE ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const decoded    = this.auth.decodeToken();
    this.agentUserId = decoded?.sub ? +decoded.sub : 0;
    this.agentName   = decoded?.firstName
      ? `${decoded.firstName} ${decoded.lastName || ''}`.trim()
      : 'Agent';

    const cached = this.cacheService.getDashboard(this.agentUserId);
    if (cached) {
      console.debug('[Cache HIT] dashboard');
      this.properties = cached.properties;
      this.agentName  = cached.agentName;
      this.isLoading  = false;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.buildCharts();
        this.refreshInBackground();
      }, 0);
    } else {
      this.loadProperties();
    }
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  // ── LOAD ──────────────────────────────────────────────────────────────────

  public loadProperties(): void {
    this.isLoading = true;
    this.svc.getAgentProperties(this.agentUserId).subscribe({
      next: (res: PagedPropertyResponse | RawProperty[]) => {
        const raw       = (res as PagedPropertyResponse)?.items ?? (res as RawProperty[]) ?? [];
        this.properties = this.filterOwn(raw);
        this.isLoading  = false;
        this.saveCache();
        this.cdr.markForCheck();
        setTimeout(() => this.buildCharts(), 0);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── REFRESH ───────────────────────────────────────────────────────────────

  private refreshInBackground(): void {
    this.svc.getAgentProperties(this.agentUserId).subscribe({
      next: (res: PagedPropertyResponse | RawProperty[]) => {
        const raw       = (res as PagedPropertyResponse)?.items ?? (res as RawProperty[]) ?? [];
        this.properties = this.filterOwn(raw);
        this.saveCache();
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  // ── CHARTS ────────────────────────────────────────────────────────────────

  buildCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    if (
      !this.statusChartRef    ||
      !this.listingChartRef   ||
      !this.priceChartRef     ||
      !this.valueChartRef     ||
      !this.breakdownChartRef
    ) return;

    const { txt, grid } = getChartTheme();

    const statusSegs = this.stackedSegments;
    this.charts.push(new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels:   statusSegs.map(s => s.label),
        datasets: [{ data: statusSegs.map(s => s.count), backgroundColor: statusSegs.map(s => s.color), borderWidth: 0, hoverOffset: 6 }]
      },
      options: getStatusDonutOptions()
    }));

    this.charts.push(new Chart(this.breakdownChartRef.nativeElement, {
      type: 'bar',
      data: { labels: [''], datasets: getBreakdownDatasets(this.stackedSegments) },
      options: getBreakdownChartOptions(this.pct.bind(this))
    }));

    const listSegs = this.listingSegments;
    this.charts.push(new Chart(this.listingChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels:   listSegs.map(s => s.label),
        datasets: [{ data: listSegs.map(s => s.count), backgroundColor: listSegs.map(s => s.color), borderWidth: 0, hoverOffset: 6 }]
      },
      options: getListingDonutOptions()
    }));

    this.charts.push(new Chart(this.priceChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels:   this.properties.map((p, i) => p.title ?? `Property ${i + 1}`),
        datasets: [{ ...PRICE_BAR_DATASET_DEFAULTS, data: this.properties.map(p => p.price || 0) }]
      },
      options: getPriceBarOptions(txt, grid, fmtINR)
    }));

    const byType = BY_TYPE_CONFIG
      .map(cfg => ({
        label: cfg.label, color: cfg.color,
        value: this.properties.filter(p => p.listingType?.toUpperCase().includes(cfg.keyword)).reduce((s, p) => s + (p.price || 0), 0)
      }))
      .filter(t => t.value > 0);

    this.charts.push(new Chart(this.valueChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels:   byType.map(t => t.label),
        datasets: [{ ...VALUE_BAR_DATASET_DEFAULTS, data: byType.map(t => t.value), backgroundColor: byType.map(t => t.color) }]
      },
      options: getValueBarOptions(txt, grid, fmtINR)
    }));
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

  private filterOwn(raw: RawProperty[]): Property[] {
    return raw.filter(p =>
      +p.userId    === +this.agentUserId ||
      +p.agentId!  === +this.agentUserId ||
      +p.ownerId!  === +this.agentUserId ||
      +p.createdBy! === +this.agentUserId
    );
  }

  private saveCache(): void {
    this.cacheService.setDashboard({
      properties:  this.properties,
      agentName:   this.agentName,
      agentUserId: this.agentUserId,
    });
  }

  public clearCache(): void { this.cacheService.clearDashboard(this.agentUserId); }

  // ── NAVIGATION ────────────────────────────────────────────────────────────

  public goToProperties(): void  { this.router.navigate(['/agent/properties']); }
  public goToAddProperty(): void { this.router.navigate(['/agent/properties'], { queryParams: { action: 'add' } }); }
  public goToReport(): void      { this.router.navigate(['/agent/report']); }

  // ── STATS ─────────────────────────────────────────────────────────────────

  public get totalCount(): number { return this.properties.length; }

 public get activeCount(): number {
  return this.properties.filter(p => (ACTIVE_STATUSES as readonly string[]).includes(p.status?.trim().toUpperCase() ?? '')).length;
}

public get soldCount(): number {
  return this.properties.filter(p => (CLOSED_STATUSES as readonly string[]).includes(p.status?.trim().toUpperCase() ?? '')).length;
}

public get otherCount(): number {
  return this.properties.filter(p => !(ALL_KNOWN_STATUSES as readonly string[]).includes(p.status?.trim().toUpperCase() ?? '')).length;
}

  public get totalValue(): number {
    return this.properties.reduce((s, p) => s + (p.price || 0), 0);
  }

  public pct(n: number): number {
    return this.totalCount ? Math.round((n / this.totalCount) * 100) : 0;
  }

  public get stackedSegments() {
    if (this.totalCount === 0) return [];
    return STATUS_SEGMENTS_CONFIG.map(cfg => {
      const count = cfg.statuses.length > 0
        ? this.properties.filter(p => cfg.statuses.includes(p.status?.trim().toUpperCase() ?? '')).length
        : this.properties.filter(p => !KNOWN_STATUSES.includes(p.status?.trim().toUpperCase() ?? '')).length;
      return { label: cfg.label, color: cfg.color, count, pct: this.pct(count) };
    }).filter(s => s.count > 0);
  }

  public get listingSegments() {
    return LISTING_SEGMENTS_CONFIG.map(cfg => ({
      label: cfg.label, color: cfg.color,
      count: this.properties.filter(p => p.listingType?.toUpperCase().includes(cfg.keyword)).length
    })).filter(s => s.count > 0);
  }

  public formatPrice(n: number): string {
    return new Intl.NumberFormat(CURRENCY_FORMAT_CONFIG.locale, {
      style: 'currency', currency: CURRENCY_FORMAT_CONFIG.currency, maximumFractionDigits: CURRENCY_FORMAT_CONFIG.maxDigits,
    }).format(n);
  }
}