import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AgentService } from 'src/app/core/services/agent.service';
import { CacheService } from 'src/app/core/services/cache.service';
import { Offer } from 'src/app/core/models/offer.model';
import { Property } from 'src/app/core/models/property.model';
import { User } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-agent-offer',
  standalone: false,
  templateUrl: './agent-offer.component.html',
  styleUrl: './agent-offer.component.css',
})
export class AgentOffersComponent implements OnInit {

  public offers:      Offer[] = [];
  public isLoading:   boolean = false;
  public pageSize:    number  = 5;
  public currentPage: number  = 1;

  private propertyCache = new Map<number, Property>();
  private buyerCache    = new Map<number, User>();

  constructor(
    private agentService: AgentService,
    private cdr:          ChangeDetectorRef,
    private cacheService: CacheService
  ) {}

  public ngOnInit(): void {
    const cached = this.cacheService.getOffers();
    if (cached) {
      console.debug('[Cache HIT] offers');
      this.offers    = cached;
      this.isLoading = false;
      this.cdr.markForCheck();
      setTimeout(() => this.refreshInBackground(), 0);
    } else {
      this.loadOffers();
    }
  }

  // ── LOAD ───────────────────────────────────────────────────────────────────
  public loadOffers(): void {
    this.isLoading = true;
    this.agentService.getOffers().subscribe({
      next: (data: Offer[]) => {
        this.enrich(data).subscribe((res: Offer[]) => {
          this.offers      = this.sortOffers(res);
          this.currentPage = 1;
          this.isLoading   = false;
          this.cacheService.setOffers(this.offers);
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── BACKGROUND REFRESH ─────────────────────────────────────────────────────
  private refreshInBackground(): void {
    this.agentService.getOffers().subscribe({
      next: (data: Offer[]) => {
        this.enrich(data).subscribe((res: Offer[]) => {
          this.offers = this.sortOffers(res);
          this.cacheService.setOffers(this.offers);
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // ── SORT ───────────────────────────────────────────────────────────────────
  private sortOffers(res: Offer[]): Offer[] {
    return [...res].sort((a: Offer, b: Offer) => {
      const aPending = this.isPending(a.status) ? 0 : 1;
      const bPending = this.isPending(b.status) ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return b.id - a.id;
    });
  }

  // ── PAGINATION ─────────────────────────────────────────────────────────────
  public get totalPages(): number {
    return Math.ceil(this.offers.length / this.pageSize) || 1;
  }

  public get pagedOffers(): Offer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.offers.slice(start, start + this.pageSize);
  }

  public get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  public get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.offers.length);
  }

  public goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.cdr.detectChanges();
  }

  // ── ENRICH ─────────────────────────────────────────────────────────────────
  private enrich(rows: Offer[]): Observable<Offer[]> {
    if (!rows.length) return of([]);

    const propertyIds = [...new Set(rows.map(r => r.propertyId).filter(Boolean))] as number[];
    const userIds     = [...new Set(rows.map(r => r.buyerId ?? r.agentUserId).filter(Boolean))] as number[];

    const property$ = propertyIds.map(id =>
      (this.propertyCache.has(id)
        ? of(this.propertyCache.get(id) as Property)
        : this.agentService.getProperty(id).pipe(
            catchError(() => of({ id, title: `Property #${id}` } as Property))
          )
      ).pipe(map((p: Property) => (this.propertyCache.set(id, p), p)))
    );

    const users$ = userIds.map(id =>
      (this.buyerCache.has(id)
        ? of(this.buyerCache.get(id) as User)
        : this.agentService.getUser(id).pipe(
            catchError(() => of({ id, firstName: 'Buyer', lastName: `#${id}` } as User))
          )
      ).pipe(map((u: User) => (this.buyerCache.set(id, u), u)))
    );

    return forkJoin([...property$, ...users$]).pipe(
      map(() =>
        rows.map(r => ({
          ...r,
          propertyName: this.propertyCache.get(r.propertyId)?.title ?? `Property #${r.propertyId}`,
          buyerName:    this.getBuyerName(r.buyerId ?? r.agentUserId ?? 0),
        }))
      )
    );
  }

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  public updateOffer(id: number, status: string): void {
    this.agentService.updateOffer(id, status).subscribe(() => {
      const o = this.offers.find(x => x.id === id);
      if (o) o.status = status;
      this.offers = [...this.offers];
      this.cacheService.setOffers(this.offers);
      if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
      this.cdr.detectChanges();
    });
  }

  public clearCache(): void { this.cacheService.clearOffers(); }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  private getBuyerName(id: number): string {
    const u = this.buyerCache.get(id);
    return u ? `${u.firstName} ${u.lastName}` : `Buyer #${id}`;
  }

  public isPending(status: string): boolean {
    return (status || 'PENDING').toUpperCase() === 'PENDING';
  }

  public getStatusClass(status: string): string {
    switch ((status || 'PENDING').toUpperCase()) {
      case 'APPROVED': return 'status-accepted';
      case 'REJECTED': return 'status-rejected';
      default:         return 'status-pending';
    }
  }

  public getStatusLabel(status: string): string {
    switch ((status || 'PENDING').toUpperCase()) {
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      default:         return 'Pending';
    }
  }

  public formatPrice(n: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(n);
  }

  public get pendingOffers(): number {
    return this.offers.filter(o => this.isPending(o.status)).length;
  }
}