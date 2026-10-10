import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';

import { AgentAppointmentsComponent } from './agent-appointments.component';
import { AuthService }   from 'src/app/core/services/auth.service';
import { AgentService }  from 'src/app/core/services/agent.service';
import { CacheService }  from 'src/app/core/services/cache.service';

// ── Typed partial helpers so every of(...) satisfies its Observable<T> ──────
const appt = (...items: object[]) => of(items as any);
const usr  = (id: number, firstName: string, lastName: string) =>
               of({ id, firstName, lastName, email: '', phone: '' } as any);

describe('AgentAppointmentsComponent', () => {
  let component: AgentAppointmentsComponent;
  let fixture:   ComponentFixture<AgentAppointmentsComponent>;
  let agentSpy:  jasmine.SpyObj<AgentService>;
  let cacheSpy:  jasmine.SpyObj<CacheService>;

  beforeEach(async () => {
    agentSpy = jasmine.createSpyObj('AgentService', [
      'getAppointments', 'getUser', 'updateAppointment'
    ]);
    cacheSpy = jasmine.createSpyObj('CacheService', [
      'getAppointments', 'setAppointments', 'clearAppointments'
    ]);

    // Defaults: no cache, empty list, valid user
    cacheSpy.getAppointments.and.returnValue(null);
    cacheSpy.setAppointments.and.stub();
    cacheSpy.clearAppointments.and.stub();

    agentSpy.getAppointments.and.returnValue(of([] as any));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', 'Smith'));
    agentSpy.updateAppointment.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      declarations: [AgentAppointmentsComponent],
      schemas:      [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService,  useValue: {}       },
        { provide: AgentService, useValue: agentSpy },
        { provide: CacheService, useValue: cacheSpy },
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(AgentAppointmentsComponent);
    component = fixture.componentInstance;
    // Grab the real CDR instance to avoid detectChanges/markForCheck errors
    const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    (component as any).cdr = cdr;
    // Do NOT call fixture.detectChanges() here — each test controls ngOnInit
  });

  /* ─── Creation ──────────────────────────────────────────────────────── */

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* ─── ngOnInit — cache MISS → calls loadAppointments ───────────────── */

  it('ngOnInit should call loadAppointments when cache is null', () => {
    cacheSpy.getAppointments.and.returnValue(null);
    spyOn(component, 'loadAppointments');
    component.ngOnInit();
    expect(component.loadAppointments).toHaveBeenCalled();
  });

  /* ─── ngOnInit — cache HIT → uses cached data ───────────────────────── */

  it('ngOnInit should use cached appointments when available', fakeAsync(() => {
    const cached: any[] = [{ id: 1, buyerId: 10, status: 'PENDING', visitDate: '2024-06-01' }];
    cacheSpy.getAppointments.and.returnValue(cached);
    agentSpy.getAppointments.and.returnValue(of([] as any)); // background returns empty

    component.ngOnInit();

    expect(component.appointments).toEqual(cached);
    expect(component.isLoading).toBeFalse();

    tick(0); // flush setTimeout → refreshInBackground
  }));

  /* ─── ngOnInit — cache HIT then background refresh enriches ─────────── */

  it('ngOnInit cache HIT should trigger background refresh and update cache', fakeAsync(() => {
    const cached: any[] = [{ id: 1, buyerId: 10, status: 'PENDING', visitDate: '2024-06-01' }];
    cacheSpy.getAppointments.and.returnValue(cached);
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 10, status: 'APPROVED', visitDate: '2024-06-01' }
    ));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', 'Smith'));

    component.ngOnInit();
    tick(0); // flush setTimeout → refreshInBackground fires + observables resolve

    expect(agentSpy.getAppointments).toHaveBeenCalled();
    expect(cacheSpy.setAppointments).toHaveBeenCalled();
  }));

  /* ─── ngOnInit — background refresh error is swallowed silently ──────── */

  it('ngOnInit background refresh should silently swallow errors', fakeAsync(() => {
    const cached: any[] = [{ id: 1, buyerId: 10, status: 'PENDING', visitDate: '2024-06-01' }];
    cacheSpy.getAppointments.and.returnValue(cached);
    agentSpy.getAppointments.and.returnValue(throwError(() => new Error('network')));

    expect(() => {
      component.ngOnInit();
      tick(0);
    }).not.toThrow();
  }));

  /* ─── loadAppointments — success, enrich, sort ──────────────────────── */

  it('should load, enrich, and sort appointments (PENDING first)', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 10, status: 'APPROVED', visitDate: '2024-06-01' },
      { id: 2, buyerId: 10, status: 'PENDING',  visitDate: '2024-06-10' }
    ));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', 'Smith'));

    component.loadAppointments();

    expect(component.appointments.length).toBe(2);
    expect(component.appointments[0].status).toBe('PENDING');
    expect(cacheSpy.setAppointments).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  /* ─── loadAppointments — buyerName populated correctly ──────────────── */

  it('should enrich appointments with buyerName', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 10, status: 'PENDING', visitDate: '2024-06-01' }
    ));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', 'Smith'));

    component.loadAppointments();

    expect(component.appointments[0].buyerName).toBe('Alice Smith');
  });

  /* ─── loadAppointments — lastName absent (trim branch) ──────────────── */

  it('should trim buyerName when lastName is empty', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 10, status: 'PENDING', visitDate: '2024-06-01' }
    ));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', ''));

    component.loadAppointments();

    expect(component.appointments[0].buyerName).toBe('Alice');
  });

  /* ─── loadAppointments — buyerId null (filter(Boolean) branch) ──────── */

  it('should handle appointments with null buyerId gracefully', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: null, status: 'PENDING', visitDate: '2024-06-01' }
    ));

    component.loadAppointments();

    // getBuyerName(0) → cache miss → 'Buyer #0'
    expect(component.appointments[0].buyerName).toBe('Buyer #0');
    expect(agentSpy.getUser).not.toHaveBeenCalled();
  });

  /* ─── loadAppointments — empty response ─────────────────────────────── */

  it('should handle empty appointment list', () => {
    agentSpy.getAppointments.and.returnValue(of([] as any));

    component.loadAppointments();

    expect(component.appointments.length).toBe(0);
    expect(component.isLoading).toBeFalse();
  });

  /* ─── loadAppointments — error path ─────────────────────────────────── */

  it('should set errorMsg and clear isLoading on load error', () => {
    agentSpy.getAppointments.and.returnValue(throwError(() => new Error('fail')));

    component.loadAppointments();

    expect(component.errorMsg).toBe('Failed to load appointments');
    expect(component.isLoading).toBeFalse();
  });

  /* ─── loadAppointments — buyer cache hit (no second getUser call) ───── */

  it('should use buyer cache on second load without calling getUser again', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 10, status: 'PENDING', visitDate: '2024-06-01' }
    ));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', 'Smith'));

    component.loadAppointments();
    agentSpy.getUser.calls.reset();

    component.loadAppointments();

    expect(agentSpy.getUser).not.toHaveBeenCalled();
  });

  /* ─── loadAppointments — getUser error fallback ─────────────────────── */

  it('should fall back to "Buyer #id" when getUser errors', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 99, status: 'PENDING', visitDate: '2024-06-01' }
    ));
    agentSpy.getUser.and.returnValue(throwError(() => new Error('fail')));

    component.loadAppointments();

    expect(component.appointments[0].buyerName).toContain('Buyer #99');
  });

  /* ─── loadAppointments — resets currentPage to 1 ────────────────────── */

  it('should reset currentPage to 1 after loading', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 10, status: 'PENDING', visitDate: '2024-06-01' }
    ));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', 'Smith'));

    component.currentPage = 3;
    component.loadAppointments();

    expect(component.currentPage).toBe(1);
  });

  /* ─── Sort — pending first then date descending ─────────────────────── */

  it('should sort pending first then by visitDate descending', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 10, status: 'APPROVED', visitDate: '2024-01-01' },
      { id: 2, buyerId: 10, status: 'PENDING',  visitDate: '2024-06-01' }
    ));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', 'Smith'));

    component.loadAppointments();

    expect(component.appointments[0].id).toBe(2); // PENDING first
  });

  it('should sort by visitDate descending when statuses are equal', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 10, status: 'APPROVED', visitDate: '2024-01-01' },
      { id: 2, buyerId: 10, status: 'APPROVED', visitDate: '2024-06-01' }
    ));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', 'Smith'));

    component.loadAppointments();

    expect(component.appointments[0].visitDate).toBe('2024-06-01');
  });

  it('should handle missing visitDate gracefully in sort', () => {
    agentSpy.getAppointments.and.returnValue(appt(
      { id: 1, buyerId: 10, status: 'APPROVED', visitDate: null },
      { id: 2, buyerId: 10, status: 'APPROVED', visitDate: '2024-06-01' }
    ));
    agentSpy.getUser.and.returnValue(usr(10, 'Alice', 'Smith'));

    component.loadAppointments();

    expect(component.appointments[0].visitDate).toBe('2024-06-01');
  });

  /* ─── updateAppointment — success ───────────────────────────────────── */

  it('should update appointment status in-place and show success', () => {
    component.appointments = [{ id: 1, status: 'PENDING' }] as any;
    agentSpy.updateAppointment.and.returnValue(of({} as any));

    component.updateAppointment(1, 'APPROVED');

    expect(component.appointments[0].status).toBe('APPROVED');
    expect(component.successMsg).toBe('Appointment updated');
    expect(component.updatingId).toBeNull();
    expect(cacheSpy.setAppointments).toHaveBeenCalled();
  });

  /* ─── updateAppointment — item not found (if(item) false branch) ─────── */

  it('should not throw when updating a non-existent appointment id', () => {
    component.appointments = [{ id: 1, status: 'PENDING' }] as any;
    agentSpy.updateAppointment.and.returnValue(of({} as any));

    expect(() => component.updateAppointment(999, 'APPROVED')).not.toThrow();
    expect(component.updatingId).toBeNull();
  });

  /* ─── updateAppointment — currentPage clamped after re-sort ─────────── */

  it('should clamp currentPage to totalPages after update', () => {
    component.appointments = Array(5).fill(null).map((_, i) =>
      ({ id: i + 1, status: 'PENDING' } as any)
    );
    component.pageSize    = 5;
    component.currentPage = 2; // beyond totalPages=1
    agentSpy.updateAppointment.and.returnValue(of({} as any));

    component.updateAppointment(1, 'APPROVED');

    expect(component.currentPage).toBeLessThanOrEqual(component.totalPages);
  });

  /* ─── updateAppointment — error path ────────────────────────────────── */

  it('should set errorMsg and clear updatingId on update error', () => {
    component.appointments = [{ id: 1, status: 'PENDING' }] as any;
    agentSpy.updateAppointment.and.returnValue(throwError(() => new Error('fail')));

    component.updateAppointment(1, 'APPROVED');

    expect(component.errorMsg).toBe('Failed to load appointments');
    expect(component.updatingId).toBeNull();
  });

  /* ─── clearCache ─────────────────────────────────────────────────────── */

  it('clearCache should delegate to cacheService.clearAppointments', () => {
    component.clearCache();
    expect(cacheSpy.clearAppointments).toHaveBeenCalled();
  });

  /* ─── Pagination — totalPages ────────────────────────────────────────── */

  it('totalPages should be 1 when appointments is empty', () => {
    component.appointments = [];
    expect(component.totalPages).toBe(1);
  });

  it('totalPages should calculate correctly', () => {
    component.appointments = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 } as any));
    component.pageSize = 5;
    expect(component.totalPages).toBe(3);
  });

  /* ─── Pagination — pageNumbers ───────────────────────────────────────── */

  it('pageNumbers should return array 1..totalPages', () => {
    component.appointments = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 } as any));
    component.pageSize = 5;
    expect(component.pageNumbers).toEqual([1, 2, 3]);
  });

  /* ─── Pagination — pagedAppointments ────────────────────────────────── */

  it('pagedAppointments should return correct slice', () => {
    component.appointments = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 } as any));
    component.pageSize    = 5;
    component.currentPage = 2;

    expect(component.pagedAppointments.length).toBe(5);
    expect(component.pagedAppointments[0].id).toBe(6);
  });

  /* ─── Pagination — pageEnd ───────────────────────────────────────────── */

  it('pageEnd should clamp to total on a partial page', () => {
    component.appointments = Array(8).fill({} as any);
    component.pageSize    = 5;
    component.currentPage = 2;
    expect(component.pageEnd).toBe(8);
  });

  it('pageEnd should equal currentPage * pageSize on a full page', () => {
    component.appointments = Array(10).fill({} as any);
    component.pageSize    = 5;
    component.currentPage = 1;
    expect(component.pageEnd).toBe(5);
  });

  /* ─── goToPage ───────────────────────────────────────────────────────── */

  it('goToPage should navigate to a valid page', () => {
    component.appointments = Array(10).fill({} as any);
    component.pageSize = 5;
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
  });

  it('goToPage should ignore page < 1', () => {
    component.appointments = Array(10).fill({} as any);
    component.pageSize    = 5;
    component.currentPage = 1;
    component.goToPage(-1);
    expect(component.currentPage).toBe(1);
  });

  it('goToPage should ignore page > totalPages', () => {
    component.appointments = Array(10).fill({} as any);
    component.pageSize    = 5;
    component.currentPage = 1;
    component.goToPage(999);
    expect(component.currentPage).toBe(1);
  });

  /* ─── isPending ──────────────────────────────────────────────────────── */

  describe('isPending', () => {
    it('returns true for PENDING',           () => expect(component.isPending('PENDING')).toBeTrue());
    it('returns true for lowercase pending', () => expect(component.isPending('pending')).toBeTrue());
    it('returns true for empty string',      () => expect(component.isPending('')).toBeTrue());
    it('returns false for APPROVED',         () => expect(component.isPending('APPROVED')).toBeFalse());
    it('returns false for REJECTED',         () => expect(component.isPending('REJECTED')).toBeFalse());
  });

  /* ─── getStatusLabel ─────────────────────────────────────────────────── */

  describe('getStatusLabel', () => {
    it('returns Approved for APPROVED', () => expect(component.getStatusLabel('APPROVED')).toBe('Approved'));
    it('returns Rejected for REJECTED', () => expect(component.getStatusLabel('REJECTED')).toBe('Rejected'));
    it('returns Pending for PENDING',   () => expect(component.getStatusLabel('PENDING')).toBe('Pending'));
    it('returns Pending for empty',     () => expect(component.getStatusLabel('')).toBe('Pending'));
  });

  /* ─── getStatusClass ─────────────────────────────────────────────────── */

  describe('getStatusClass', () => {
    it('returns status-accepted for APPROVED', () => expect(component.getStatusClass('APPROVED')).toBe('status-accepted'));
    it('returns status-rejected for REJECTED', () => expect(component.getStatusClass('REJECTED')).toBe('status-rejected'));
    it('returns status-pending for PENDING',   () => expect(component.getStatusClass('PENDING')).toBe('status-pending'));
    it('returns status-pending for empty',     () => expect(component.getStatusClass('')).toBe('status-pending'));
  });

  /* ─── formatDate ─────────────────────────────────────────────────────── */

  describe('formatDate', () => {
    it('should return placeholder object for empty string', () => {
      const r = component.formatDate('');
      expect(r.day).toBe('--');
      expect(r.month).toBe('---');
      expect(r.weekday).toBe('---');
      expect(r.time).toBe('--:--');
    });

    it('should parse a valid date string and return real values', () => {
      const r = component.formatDate('2024-06-15T10:00:00');
      expect(r.day).toBeDefined();
      expect(r.month).not.toBe('---');
      expect(r.weekday).not.toBe('---');
      expect(r.time).not.toBe('--:--');
    });

    it('should pad single-digit day with leading zero', () => {
      const r = component.formatDate('2024-06-03T10:00:00');
      expect(r.day).toBe('03');
    });
  });

  /* ─── pendingAppointments ────────────────────────────────────────────── */

  it('pendingAppointments should count only PENDING items', () => {
    component.appointments = [
      { status: 'PENDING'  } as any,
      { status: 'APPROVED' } as any,
      { status: 'PENDING'  } as any,
    ];
    expect(component.pendingAppointments).toBe(2);
  });

  /* ─── handleError ────────────────────────────────────────────────────── */

  it('handleError should set errorMsg and clear isLoading', () => {
    component.isLoading = true;
    component.handleError();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMsg).toBe('Failed to load appointments');
  });

  /* ─── showSuccess ────────────────────────────────────────────────────── */

  it('showSuccess should set successMsg and clear it after 3 seconds', fakeAsync(() => {
    component.showSuccess('hello');
    expect(component.successMsg).toBe('hello');

    tick(3000);
    expect(component.successMsg).toBe('');
  }));
});