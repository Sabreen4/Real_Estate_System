import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ChangeDetectorRef, ViewChild, ElementRef, NgZone,
} from '@angular/core';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { Chart, ChartConfiguration } from 'chart.js';
import { AgentPropertyService }   from 'src/app/core/services/agent-property.service';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';
import {
  ReportData, PropertyRow, StatusFilter,
  ListingTypeFilter, SortField, SortDir,
} from './report.types';
import { STATUS_TABS, LISTING_TABS, PAGE_SIZE_OPTIONS } from './report.constants';
import { buildReport } from './report-builder.utils';
import { exportCsv } from './report-export.utils';
import {
  buildStatusDonutConfig, buildListingDonutConfig,
  buildPipelineBarConfig, buildCityCountBarConfig, buildCityValueBarConfig,
} from './config/report-charts.config';
import './report.constants';

@Component({
  selector:    'app-report',
  templateUrl: './report.component.html',
  styleUrls:   ['./report.component.css'],
  standalone:  false,
})
export class ReportComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Canvas refs ───────────────────────────────────────────────────────────────
  @ViewChild('statusDonutCanvas')  statusDonutCanvas!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('listingDonutCanvas') listingDonutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pipelineBarCanvas')  pipelineBarCanvas!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('cityCountBarCanvas') cityCountBarCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cityValueBarCanvas') cityValueBarCanvas!: ElementRef<HTMLCanvasElement>;

  // ── State ─────────────────────────────────────────────────────────────────────
  public  isLoading  = true;
  public  report: ReportData | null = null;
  public  errorMsg   = '';
  public  agentName  = '';

  private charts:       Chart[] = [];
  private viewReady    = false;
  private pendingBuild = false;
  private agentUserId  = 0;
  private destroy$     = new Subject<void>();

  // ── Filter / sort / pagination ────────────────────────────────────────────────
  public statusFilter:  StatusFilter      = 'ALL';
  public listingFilter: ListingTypeFilter = 'ALL';
  public searchQuery    = '';
  public sortField:     SortField         = 'createdAt';
  public sortDir:       SortDir           = 'desc';
  public pageSize       = 10;
  public currentPage    = 1;

  // ── Template-facing constants ─────────────────────────────────────────────────
  public readonly statusTabs      = STATUS_TABS;
  public readonly listingTabs     = LISTING_TABS;
  public readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  constructor(
    private agentSvc: AgentPropertyService,
    private txSvc:    BuyerTransactionService,
    private auth:     AuthService,
    private cdr:      ChangeDetectorRef,
    private zone:     NgZone,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const decoded    = this.auth.decodeToken();
    this.agentName   = decoded?.firstName
      ? `${decoded.firstName} ${decoded.lastName || ''}`.trim()
      : 'Agent';
    this.agentUserId = decoded?.sub ? +decoded.sub : 0;
    this.loadReport();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.pendingBuild) {
      this.pendingBuild = false;
      this.buildAllCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────────────────────────────────────────

  public loadReport(): void {
    this.isLoading = true;
    this.errorMsg  = '';
    this.cdr.detectChanges();

    forkJoin({
      properties:   this.agentSvc.getAgentProperties(this.agentUserId, null, 1, 1000).pipe(catchError(() => of([]))),
      appointments: this.txSvc.getAgentAppointments().pipe(catchError(() => of([]))),
      offers:       this.txSvc.getAgentOffers().pipe(catchError(() => of([]))),
      payments:     this.txSvc.getAgentTransactions(this.agentUserId).pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ properties, appointments, offers, payments }) => {
          this.report      = buildReport(properties, appointments, offers, payments);
          this.isLoading   = false;
          this.currentPage = 1;
          this.cdr.detectChanges();

          this.destroyCharts();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this.viewReady ? this.buildAllCharts() : (this.pendingBuild = true);
            });
          });
        },
        error: () => {
          this.errorMsg  = 'Failed to load report data. Please try again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ── Chart management ──────────────────────────────────────────────────────────

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private createChart(canvas: HTMLCanvasElement, config: ChartConfiguration): void {
    this.charts.push(new Chart(canvas, config));
  }

  private buildAllCharts(): void {
    if (!this.report) return;

    this.zone.runOutsideAngular(() => {
      this.destroyCharts();
      const r       = this.report!;
      const pending = Math.max(0, r.totalProperties - r.activeProperties - r.soldProperties);

      const builds: [ElementRef<HTMLCanvasElement> | undefined, ChartConfiguration][] = [
        [this.statusDonutCanvas,  buildStatusDonutConfig(r.activeProperties, r.soldProperties, pending)],
        [this.listingDonutCanvas, buildListingDonutConfig(r.forSaleCount, r.forRentCount, r.leaseCount)],
        [this.pipelineBarCanvas,  buildPipelineBarConfig(
          r.pendingAppointments, r.approvedAppointments, r.rejectedAppointments,
          r.pendingOffers,       r.approvedOffers,       r.rejectedOffers,
        )],
        [this.cityCountBarCanvas, buildCityCountBarConfig(r.cityBreakdown)],
        [this.cityValueBarCanvas, buildCityValueBarConfig(r.cityBreakdown, this.formatCurrency.bind(this))],
      ];

      builds.forEach(([ref, config]) => {
        if (ref?.nativeElement) this.createChart(ref.nativeElement, config);
      });
    });
  }

  // ── Filtering / sorting / pagination ──────────────────────────────────────────

  public get filteredRows(): PropertyRow[] {
    if (!this.report) return [];
    let rows = this.report.rows;

    if (this.statusFilter  !== 'ALL') rows = rows.filter(r => r.status === this.statusFilter);
    if (this.listingFilter !== 'ALL') rows = rows.filter(r => r.listingType.includes(this.listingFilter));

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      rows = rows.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q),
      );
    }

    return [...rows].sort((a, b) => {
      let va: string | number | Date = a[this.sortField];
      let vb: string | number | Date = b[this.sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return this.sortDir === 'asc' ? -1 :  1;
      if (va > vb) return this.sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }

  public get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  public get pagedRows(): PropertyRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  public get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    const range: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) range.push(i);
    if (range[0] > 1)                    { range.unshift(-1); range.unshift(1); }
    if (range[range.length - 1] < total) { range.push(-1); range.push(total); }
    return range;
  }

  public setPage(p: number): void                      { if (p >= 1 && p <= this.totalPages) this.currentPage = p; }
  public setStatusFilter(v: StatusFilter): void        { this.statusFilter  = v; this.currentPage = 1; }
  public setListingFilter(v: ListingTypeFilter): void  { this.listingFilter = v; this.currentPage = 1; }
  public onSearch(): void                              { this.currentPage = 1; }
  public onPageSizeChange(): void                      { this.currentPage = 1; }

  public toggleSort(field: SortField): void {
    this.sortDir     = this.sortField === field && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortField   = field;
    this.currentPage = 1;
  }

  public getEndRow(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredRows.length);
  }

  // ── Badge helpers ─────────────────────────────────────────────────────────────

  public statusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-active', SOLD: 'badge-sold', PENDING: 'badge-pending',
    };
    return map[status] ?? 'badge-default';
  }

  public listingClass(type: string): string {
    if (type.includes('SALE'))  return 'badge-sale';
    if (type.includes('RENT'))  return 'badge-rent';
    if (type.includes('LEASE')) return 'badge-lease';
    return 'badge-default';
  }

  public listingLabel(type: string): string {
    if (type.includes('SALE'))  return 'For Sale';
    if (type.includes('RENT'))  return 'For Rent';
    if (type.includes('LEASE')) return 'Lease';
    return type || '—';
  }

  // ── Exports ───────────────────────────────────────────────────────────────────

  public exportExcel(): void {
    if (!this.report) return;
    exportCsv(this.filteredRows, this.agentName, this.listingLabel.bind(this));
  }


  public exportPDF(): void {
    if (!this.report) return;

    const savedPage = this.currentPage;
    const savedSize = this.pageSize;
    const savedTitle = document.title;

    // 1 ─ expand table so every row is rendered
    this.pageSize    = 99999;
    this.currentPage = 1;
    this.cdr.detectChanges();         // Angular writes full <tbody> to DOM

    // 2 ─ hide non-print chrome (nav, charts, filters …)
    const hideEls = document.querySelectorAll<HTMLElement>('.no-print');
    hideEls.forEach(el => (el.style.display = 'none'));

    // 3 ─ set document title so the browser uses it as the PDF filename
    document.title = `Report_${this.agentName.replace(/\s+/g, '_')}`;

   const restore = () => {
  hideEls.forEach(el => el.style.removeProperty('display'));
  document.title   = savedTitle;
  this.pageSize    = savedSize;
  this.currentPage = savedPage;
  this.cdr.detectChanges();

  // ← rebuild charts after print dialog closes
  this.destroyCharts();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      this.buildAllCharts();
    });
  });
};

    // 4 ─ two rAF passes guarantee a full browser reflow before printing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        // afterprint fires after the print dialog closes (Chrome/FF/Edge/Safari)
        window.addEventListener('afterprint', restore, { once: true });
      });
    });
  }

  // ── Formatters ────────────────────────────────────────────────────────────────

  public formatCurrency(n: number): string {
    if (!n || isNaN(n)) return '₹0';
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
    if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(n);
  }

  public formatDate(d: Date): string {
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  public formatShortDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  public trackByIndex(i: number): number { return i; }
}