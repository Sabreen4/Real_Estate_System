import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { AgentService } from 'src/app/core/services/agent.service';
import { CacheService } from 'src/app/core/services/cache.service';
import { Appointment } from 'src/app/core/models/appointment.model';
import { User } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-agent-appointments',
  templateUrl: './agent-appointments.component.html',
  styleUrls: ['./agent-appointments.component.css'],
  standalone: false
})
export class AgentAppointmentsComponent implements OnInit {

  public appointments: Appointment[] = [];
  public isLoading:    boolean       = false;
  public errorMsg:     string        = '';
  public successMsg:   string        = '';
  public updatingId:   number | null = null;

  public pageSize:    number = 5;
  public currentPage: number = 1;

  private buyerCache = new Map<number, User>();

  constructor(
    private authService:  AuthService,
    private agentService: AgentService,
    private cdr:          ChangeDetectorRef,
    private cacheService: CacheService
  ) {}

  public ngOnInit(): void {
    const cached = this.cacheService.getAppointments();
    if (cached) {
      console.debug('[Cache HIT] appointments');
      this.appointments = cached;
      this.isLoading    = false;
      this.cdr.markForCheck();
      setTimeout(() => this.refreshInBackground(), 0);
    } else {
      this.loadAppointments();
    }
  }

  // ── LOAD ───────────────────────────────────────────────────────────────────
  public loadAppointments(): void {
    this.isLoading = true;
    this.agentService.getAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.enrichAppointments(data).subscribe((enriched: Appointment[]) => {
          this.appointments = enriched.sort((a, b) => this.sortAppointments(a, b));
          this.currentPage  = 1;
          this.isLoading    = false;
          this.cacheService.setAppointments(this.appointments);
          this.cdr.markForCheck();
        });
      },
      error: () => this.handleError()
    });
  }

  // ── BACKGROUND REFRESH ─────────────────────────────────────────────────────
  private refreshInBackground(): void {
    this.agentService.getAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.enrichAppointments(data).subscribe((enriched: Appointment[]) => {
          this.appointments = enriched.sort((a, b) => this.sortAppointments(a, b));
          this.cacheService.setAppointments(this.appointments);
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // ── ENRICH ─────────────────────────────────────────────────────────────────
  private enrichAppointments(rows: Appointment[]): Observable<Appointment[]> {
  if (!rows.length) return of([]);

  const userIds = [...new Set(rows.map(r => r.buyerId).filter(Boolean))] as number[];

  // Fix: if all buyerIds are null/falsy, skip forkJoin entirely
  if (!userIds.length) {
    return of(rows.map(r => ({ ...r, buyerName: this.getBuyerName(r.buyerId ?? 0) })));
  }

  const users$ = userIds.map(id =>
    (this.buyerCache.has(id)
      ? of(this.buyerCache.get(id) as User)
      : this.agentService.getUser(id).pipe(
          catchError(() => of({ id, firstName: 'Buyer', lastName: `#${id}` } as User))
        )
    ).pipe(map((u: User) => (this.buyerCache.set(id, u), u)))
  );

  return forkJoin(users$).pipe(
    map(() =>
      rows.map(r => ({
        ...r,
        buyerName: this.getBuyerName(r.buyerId ?? 0),
      }))
    )
  );
}

  private getBuyerName(id: number): string {
    const u = this.buyerCache.get(id);
    return u ? `${u.firstName} ${u.lastName || ''}`.trim() : `Buyer #${id}`;
  }

  // ── PAGINATION ─────────────────────────────────────────────────────────────
  public get totalPages(): number {
    return Math.ceil(this.appointments.length / this.pageSize) || 1;
  }

  public get pagedAppointments(): Appointment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.appointments.slice(start, start + this.pageSize);
  }

  public get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  public get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.appointments.length);
  }

  public goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.cdr.detectChanges();
  }

  private sortAppointments(a: Appointment, b: Appointment): number {
    const aPending = this.isPending(a.status) ? 0 : 1;
    const bPending = this.isPending(b.status) ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    const aTime = new Date(a.visitDate || 0).getTime();
    const bTime = new Date(b.visitDate || 0).getTime();
    return bTime - aTime;
  }

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  public updateAppointment(id: number, status: string): void {
    this.updatingId = id;
    this.agentService.updateAppointment(id, status).subscribe({
      next: () => {
        const item = this.appointments.find(x => x.id === id);
        if (item) item.status = status;
        this.appointments = [...this.appointments].sort((a, b) => this.sortAppointments(a, b));
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        this.updatingId = null;
        this.cacheService.setAppointments(this.appointments);
        this.showSuccess('Appointment updated');
      },
      error: () => {
        this.updatingId = null;
        this.handleError();
      }
    });
  }

  public clearCache(): void { this.cacheService.clearAppointments(); }

  // ── HELPERS ────────────────────────────────────────────────────────────────
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

  public formatDate(dateStr: string): { day: string; month: string; weekday: string; time: string } {
    if (!dateStr) return { day: '--', month: '---', weekday: '---', time: '--:--' };
    const d = new Date(dateStr);
    return {
      day:     d.getDate().toString().padStart(2, '0'),
      month:   d.toLocaleString('default', { month: 'short' }).toUpperCase(),
      weekday: d.toLocaleString('default', { weekday: 'short' }).toUpperCase(),
      time:    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  public get pendingAppointments(): number {
    return this.appointments.filter(a => this.isPending(a.status)).length;
  }

  public showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 3000);
  }

  public handleError(): void {
    this.isLoading = false;
    this.errorMsg  = 'Failed to load appointments';
  }
}