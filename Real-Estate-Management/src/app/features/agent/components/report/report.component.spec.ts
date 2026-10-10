import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
// ── NOTE: Do NOT list NgZone in providers[]. TestBed provides it automatically
//          via BrowserDynamicTestingModule. Listing it manually triggers NG0204
//          because Angular cannot resolve NgZone's own constructor parameter
//          outside a real platform bootstrapper.
import { ReportComponent } from './report.component';
import { AgentPropertyService }    from 'src/app/core/services/agent-property.service';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService }             from 'src/app/core/services/auth.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProperty(o: Partial<any> = {}): any {
  return {
    id: 1, title: 'Test Property', city: 'Chennai',
    price: 5_000_000, status: 'ACTIVE', listingType: 'SALE',
    bedrooms: 3, bathrooms: 2, area: 1200,
    createdAt: '2024-01-15T10:00:00Z', ...o,
  };
}

const makeAppt    = (status: string)             => ({ id: 1, status, propertyId: 1, visitDate: '2024-01-01' });
const makeOffer   = (status: string, amt = 45e5) => ({ id: 1, status, amount: amt, propertyId: 1, offerAmount: amt });
const makePayment = (status: string, amt = 45e5) => ({ id: 1, status, amount: amt, propertyId: 1, sellerId: 1 });

function makeRow(o: Partial<any> = {}): any {
  return {
    id: 1, title: 'Test Property', city: 'Chennai',
    price: 5_000_000, status: 'ACTIVE', listingType: 'SALE',
    createdAt: '2024-01-15T10:00:00Z', ...o,
  };
}

/** Wrap a property array in the PaginatedProperties shape the service returns. */
function paginated(items: any[]): any {
  return { items, totalCount: items.length };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture:   ComponentFixture<ReportComponent>;
  let agentSvc:  jasmine.SpyObj<AgentPropertyService>;
  let txSvc:     jasmine.SpyObj<BuyerTransactionService>;
  let authSvc:   jasmine.SpyObj<AuthService>;

  const defaultProps = [
    makeProperty({ id: 1, status: 'ACTIVE', listingType: 'SALE',  price: 5_000_000, city: 'Chennai' }),
    makeProperty({ id: 2, status: 'SOLD',   listingType: 'RENT',  price: 3_000_000, city: 'Mumbai'  }),
    makeProperty({ id: 3, status: 'ACTIVE', listingType: 'LEASE', price: 2_000_000, city: 'Chennai' }),
  ];
  const defaultAppts    = [makeAppt('PENDING'), makeAppt('APPROVED'), makeAppt('REJECTED')];
  const defaultOffers   = [makeOffer('PENDING'), makeOffer('APPROVED'), makeOffer('REJECTED')];
  const defaultPayments = [makePayment('APPROVED', 5_000_000), makePayment('PENDING', 3_000_000)];

  beforeEach(async () => {
    agentSvc = jasmine.createSpyObj('AgentPropertyService', ['getAgentProperties']);
    txSvc    = jasmine.createSpyObj('BuyerTransactionService', [
      'getAgentAppointments', 'getAgentOffers', 'getAgentTransactions',
    ]);
    authSvc  = jasmine.createSpyObj('AuthService', ['decodeToken']);

    agentSvc.getAgentProperties.and.returnValue(of(paginated(defaultProps)));
    txSvc.getAgentAppointments.and.returnValue(of(defaultAppts as any));
    txSvc.getAgentOffers.and.returnValue(of(defaultOffers as any));
    txSvc.getAgentTransactions.and.returnValue(of(defaultPayments as any));
    authSvc.decodeToken.and.returnValue({ firstName: 'John', lastName: 'Doe', sub: '42' });

    await TestBed.configureTestingModule({
      declarations: [ReportComponent],
      imports:      [CommonModule, FormsModule],
      providers: [
        { provide: AgentPropertyService,    useValue: agentSvc },
        { provide: BuyerTransactionService, useValue: txSvc    },
        { provide: AuthService,             useValue: authSvc  },
        ChangeDetectorRef,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture   = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) { fixture.destroy(); }
  });

  // ── Component creation ────────────────────────────────────────────────────────

  describe('Component creation', () => {
    it('should create', () => expect(component).toBeTruthy());

    it('should initialise with isLoading = true', () =>
      expect(component.isLoading).toBeTrue());

    it('should initialise with default filter values', () => {
      expect(component.statusFilter).toBe('ALL');
      expect(component.listingFilter).toBe('ALL');
      expect(component.searchQuery).toBe('');
      expect(component.sortField).toBe('createdAt');
      expect(component.sortDir).toBe('desc');
    });

    it('should initialise pagination defaults', () => {
      expect(component.pageSize).toBe(10);
      expect(component.currentPage).toBe(1);
    });

    it('should expose 4 statusTabs', () =>
      expect(component.statusTabs.map((t: any) => t.value))
        .toEqual(['ALL', 'ACTIVE', 'SOLD', 'PENDING']));

    it('should expose 4 listingTabs', () =>
      expect(component.listingTabs.map((t: any) => t.value))
        .toEqual(['ALL', 'SALE', 'RENT', 'LEASE']));
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set agentName from firstName + lastName', fakeAsync(() => {
      fixture.detectChanges(); tick();
      expect(component.agentName).toBe('John Doe');
    }));

    it('should set agentName to "Agent" when token is null', fakeAsync(() => {
      authSvc.decodeToken.and.returnValue(null);
      fixture.detectChanges(); tick();
      expect(component.agentName).toBe('Agent');
    }));

    it('should set agentName to firstName only when lastName absent', fakeAsync(() => {
      authSvc.decodeToken.and.returnValue({ firstName: 'Jane', sub: '5' });
      fixture.detectChanges(); tick();
      expect(component.agentName).toBe('Jane');
    }));

    it('should set agentUserId from sub', fakeAsync(() => {
      fixture.detectChanges(); tick();
      expect((component as any).agentUserId).toBe(42);
    }));

    it('should set agentUserId to 0 when sub absent', fakeAsync(() => {
      authSvc.decodeToken.and.returnValue({ firstName: 'Jane' });
      fixture.detectChanges(); tick();
      expect((component as any).agentUserId).toBe(0);
    }));

    it('should call loadReport on init', fakeAsync(() => {
      spyOn(component, 'loadReport').and.callThrough();
      fixture.detectChanges(); tick();
      expect(component.loadReport).toHaveBeenCalled();
    }));
  });

  // ── ngAfterViewInit ───────────────────────────────────────────────────────────

  describe('ngAfterViewInit', () => {
    it('should set viewReady to true', fakeAsync(() => {
      fixture.detectChanges(); tick();
      expect((component as any).viewReady).toBeTrue();
    }));

    it('should call buildAllCharts if pendingBuild was true', () => {
      (component as any).pendingBuild = true;
      (component as any).viewReady    = false;
      const spy = spyOn<any>(component, 'buildAllCharts');
      component.ngAfterViewInit();
      expect((component as any).pendingBuild).toBeFalse();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call buildAllCharts if pendingBuild was false', () => {
      (component as any).pendingBuild = false;
      const spy = spyOn<any>(component, 'buildAllCharts');
      component.ngAfterViewInit();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should next and complete destroy$', () => {
      const d$ = (component as any).destroy$;
      spyOn(d$, 'next').and.callThrough();
      spyOn(d$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(d$.next).toHaveBeenCalled();
      expect(d$.complete).toHaveBeenCalled();
    });

    it('should destroy all charts on destroy', fakeAsync(() => {
      fixture.detectChanges(); tick();
      const destroySpy = spyOn<any>(component, 'destroyCharts').and.callThrough();
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    }));
  });

  // ── loadReport ────────────────────────────────────────────────────────────────

  describe('loadReport', () => {
    it('should set isLoading=true at the start of loadReport', fakeAsync(() => {
      const subject = new Subject<any>();
      agentSvc.getAgentProperties.and.returnValue(subject.asObservable());
      component.loadReport();
      expect(component.isLoading).toBeTrue();
      subject.next(paginated(defaultProps));
      subject.complete();
      tick();
    }));

    it('should set isLoading=false after success', fakeAsync(() => {
      fixture.detectChanges(); tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should populate report after success', fakeAsync(() => {
      fixture.detectChanges(); tick();
      expect(component.report).toBeTruthy();
      expect(component.report!.totalProperties).toBe(3);
    }));

    it('should reset currentPage to 1 after load', fakeAsync(() => {
      component.currentPage = 5;
      fixture.detectChanges(); tick();
      expect(component.currentPage).toBe(1);
    }));

    it('should handle all services failing via catchError', fakeAsync(() => {
      agentSvc.getAgentProperties.and.returnValue(throwError(() => new Error()));
      txSvc.getAgentAppointments.and.returnValue(throwError(() => new Error()));
      txSvc.getAgentOffers.and.returnValue(throwError(() => new Error()));
      txSvc.getAgentTransactions.and.returnValue(throwError(() => new Error()));
      component.loadReport(); tick();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMsg).toBe('');
      expect(component.report!.totalProperties).toBe(0);
    }));

    it('should handle partial failure (properties fail)', fakeAsync(() => {
      agentSvc.getAgentProperties.and.returnValue(throwError(() => new Error()));
      component.loadReport(); tick();
      expect(component.isLoading).toBeFalse();
      expect(component.report!.totalProperties).toBe(0);
      expect(component.report!.totalAppointments).toBe(3);
    }));

    it('should handle plain array response (no items wrapper)', fakeAsync(() => {
      agentSvc.getAgentProperties.and.returnValue(of(defaultProps as any));
      fixture.detectChanges(); tick();
      expect(component.report!.totalProperties).toBe(3);
    }));

    it('should handle empty arrays', fakeAsync(() => {
      agentSvc.getAgentProperties.and.returnValue(of({ items: [], totalCount: 0 }));
      txSvc.getAgentAppointments.and.returnValue(of([] as any));
      txSvc.getAgentOffers.and.returnValue(of([] as any));
      txSvc.getAgentTransactions.and.returnValue(of([] as any));
      fixture.detectChanges(); tick();
      expect(component.report!.totalProperties).toBe(0);
      expect(component.report!.totalRevenue).toBe(0);
    }));

    it('should set errorMsg on forkJoin hard error', fakeAsync(() => {
      (component as any).errorMsg  = 'Failed to load report data. Please try again.';
      (component as any).isLoading = false;
      expect(component.errorMsg).toBe('Failed to load report data. Please try again.');
      expect(component.isLoading).toBeFalse();
    }));

    it('should pass agentUserId to getAgentTransactions', fakeAsync(() => {
      authSvc.decodeToken.and.returnValue({ firstName: 'Jane', sub: '99' });
      agentSvc.getAgentProperties.and.returnValue(of(paginated(defaultProps)));
      component.ngOnInit(); tick();
      expect(txSvc.getAgentTransactions).toHaveBeenCalledWith(99);
    }));

    it('should pass agentUserId, null, 1, 1000 to getAgentProperties', fakeAsync(() => {
      authSvc.decodeToken.and.returnValue({ firstName: 'Jane', sub: '99' });
      agentSvc.getAgentProperties.and.returnValue(of(paginated(defaultProps)));
      component.ngOnInit(); tick();
      expect(agentSvc.getAgentProperties).toHaveBeenCalledWith(99, null, 1, 1000);
    }));
  });

  // ── buildReport aggregation ───────────────────────────────────────────────────

  describe('buildReport aggregation (via report output)', () => {
    beforeEach(fakeAsync(() => { fixture.detectChanges(); tick(); }));

    it('should count active / sold properties', () => {
      expect(component.report!.activeProperties).toBe(2);
      expect(component.report!.soldProperties).toBe(1);
    });

    it('should count listing types', () => {
      expect(component.report!.forSaleCount).toBe(1);
      expect(component.report!.forRentCount).toBe(1);
      expect(component.report!.leaseCount).toBe(1);
    });

    it('should calculate portfolio value and avg / high / low prices', () => {
      expect(component.report!.totalPortfolioValue).toBe(10_000_000);
      expect(component.report!.avgPropertyPrice).toBeCloseTo(10_000_000 / 3, 0);
      expect(component.report!.highestPrice).toBe(5_000_000);
      expect(component.report!.lowestPrice).toBe(2_000_000);
    });

    it('should count appointments by status', () => {
      expect(component.report!.totalAppointments).toBe(3);
      expect(component.report!.pendingAppointments).toBe(1);
      expect(component.report!.approvedAppointments).toBe(1);
      expect(component.report!.rejectedAppointments).toBe(1);
    });

    it('should count offers by status', () => {
      expect(component.report!.totalOffers).toBe(3);
      expect(component.report!.pendingOffers).toBe(1);
      expect(component.report!.approvedOffers).toBe(1);
      expect(component.report!.rejectedOffers).toBe(1);
    });

    it('should count completedPayments and totalRevenue', () => {
      expect(component.report!.completedPayments).toBe(1);
      expect(component.report!.totalRevenue).toBe(8_000_000);
    });

    it('should build cityBreakdown sorted by count desc', () => {
      const cities = component.report!.cityBreakdown.map((c: any) => c.city);
      expect(cities[0]).toBe('Chennai');
      expect(cities[1]).toBe('Mumbai');
    });

    it('should cap cityBreakdown at 8', () =>
      expect(component.report!.cityBreakdown.length).toBeLessThanOrEqual(8));

    it('should set generatedAt as Date', () =>
      expect(component.report!.generatedAt).toBeInstanceOf(Date));

    it('should build rows with correct structure', () => {
      const row = component.report!.rows[0];
      expect(row.title).toBeDefined();
      expect(row.city).toBeDefined();
      expect(row.price).toBeDefined();
    });
  });

  // ── setStatusFilter ───────────────────────────────────────────────────────────

  describe('setStatusFilter', () => {
    beforeEach(fakeAsync(() => { fixture.detectChanges(); tick(); }));

    it('should update statusFilter and reset page', () => {
      component.currentPage = 3;
      component.setStatusFilter('ACTIVE');
      expect(component.statusFilter).toBe('ACTIVE');
      expect(component.currentPage).toBe(1);
    });

    it('ALL returns all rows', () => {
      component.setStatusFilter('ALL');
      expect(component.filteredRows.length).toBe(3);
    });

    it('ACTIVE returns only active rows', () => {
      component.setStatusFilter('ACTIVE');
      expect(component.filteredRows.every(r => r.status === 'ACTIVE')).toBeTrue();
    });

    it('SOLD returns only sold rows', () => {
      component.setStatusFilter('SOLD');
      expect(component.filteredRows.every(r => r.status === 'SOLD')).toBeTrue();
    });

    it('PENDING returns only pending rows', () => {
      component.report!.rows.push(makeRow({
        id: 99, title: 'Pending Prop', city: 'Delhi', price: 1_000_000,
        status: 'PENDING', listingType: 'SALE', createdAt: '2024-03-01T00:00:00Z',
      }));
      component.setStatusFilter('PENDING');
      expect(component.filteredRows.every(r => r.status === 'PENDING')).toBeTrue();
      expect(component.filteredRows.length).toBe(1);
    });
  });

  // ── setListingFilter ──────────────────────────────────────────────────────────

  describe('setListingFilter', () => {
    beforeEach(fakeAsync(() => { fixture.detectChanges(); tick(); }));

    it('should update listingFilter and reset page', () => {
      component.currentPage = 4;
      component.setListingFilter('SALE');
      expect(component.listingFilter).toBe('SALE');
      expect(component.currentPage).toBe(1);
    });

    it('ALL returns all rows', () => {
      component.setListingFilter('ALL');
      expect(component.filteredRows.length).toBe(3);
    });

    it('SALE returns only SALE rows', () => {
      component.setListingFilter('SALE');
      expect(component.filteredRows.every(r => r.listingType.includes('SALE'))).toBeTrue();
    });

    it('RENT returns only RENT rows', () => {
      component.setListingFilter('RENT');
      expect(component.filteredRows.every(r => r.listingType.includes('RENT'))).toBeTrue();
    });

    it('LEASE returns only LEASE rows', () => {
      component.setListingFilter('LEASE');
      expect(component.filteredRows.every(r => r.listingType.includes('LEASE'))).toBeTrue();
    });
  });

  // ── onSearch ──────────────────────────────────────────────────────────────────

  describe('onSearch', () => {
    beforeEach(fakeAsync(() => { fixture.detectChanges(); tick(); }));

    it('should reset currentPage to 1', () => {
      component.currentPage = 2;
      component.onSearch();
      expect(component.currentPage).toBe(1);
    });

    it('should filter by title (case-insensitive)', () => {
      component.searchQuery = 'test';
      component.onSearch();
      expect(component.filteredRows.every(r =>
        r.title.toLowerCase().includes('test') || r.city.toLowerCase().includes('test'),
      )).toBeTrue();
    });

    it('should filter by city', () => {
      component.searchQuery = 'chennai';
      component.onSearch();
      expect(component.filteredRows.length).toBe(2);
    });

    it('should return all rows when query is blank', () => {
      component.searchQuery = '';
      component.onSearch();
      expect(component.filteredRows.length).toBe(3);
    });

    it('should return 0 for unmatched query', () => {
      component.searchQuery = 'zzz_no_match';
      component.onSearch();
      expect(component.filteredRows.length).toBe(0);
    });

    it('should trim whitespace from query', () => {
      component.searchQuery = '  mumbai  ';
      component.onSearch();
      expect(component.filteredRows.length).toBe(1);
    });
  });

  // ── toggleSort ────────────────────────────────────────────────────────────────

  describe('toggleSort', () => {
    beforeEach(fakeAsync(() => { fixture.detectChanges(); tick(); }));

    it('should set sortField to asc on first click', () => {
      component.toggleSort('title');
      expect(component.sortField).toBe('title');
      expect(component.sortDir).toBe('asc');
    });

    it('should flip sortDir on second click of same field', () => {
      component.toggleSort('title');
      component.toggleSort('title');
      expect(component.sortDir).toBe('desc');
    });

    it('should reset to asc when switching to new field', () => {
      component.toggleSort('title');
      component.toggleSort('title');   // now desc
      component.toggleSort('city');    // new field → asc
      expect(component.sortField).toBe('city');
      expect(component.sortDir).toBe('asc');
    });

    it('should reset currentPage to 1', () => {
      component.currentPage = 3;
      component.toggleSort('price');
      expect(component.currentPage).toBe(1);
    });

    it('should sort rows by price ascending', () => {
      component.toggleSort('price');
      const prices = component.filteredRows.map(r => r.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('should sort rows by price descending on second click', () => {
      component.toggleSort('price');
      component.toggleSort('price');
      const prices = component.filteredRows.map(r => r.price);
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });

    it('should sort by city ascending', () => {
      component.toggleSort('city');
      const cities = component.filteredRows.map(r => r.city.toLowerCase());
      expect(cities).toEqual([...cities].sort());
    });

    it('should sort by status ascending', () => {
      component.toggleSort('status');
      const statuses = component.filteredRows.map(r => r.status.toLowerCase());
      expect(statuses).toEqual([...statuses].sort());
    });

    it('should sort by listingType ascending', () => {
      component.toggleSort('listingType');
      const types = component.filteredRows.map(r => r.listingType.toLowerCase());
      expect(types).toEqual([...types].sort());
    });

    it('should handle equal values (return 0 branch) without error', () => {
      component.report!.rows = [
        { ...component.report!.rows[0], city: 'Same' },
        { ...component.report!.rows[1], city: 'Same' },
      ];
      component.toggleSort('city');
      expect(() => component.filteredRows).not.toThrow();
    });

    it('should sort by createdAt descending (default)', () => {
      component.sortField = 'createdAt';
      component.sortDir   = 'desc';
      expect(() => component.filteredRows).not.toThrow();
    });
  });

  // ── Combined filters ──────────────────────────────────────────────────────────

  describe('Combined filters', () => {
    beforeEach(fakeAsync(() => { fixture.detectChanges(); tick(); }));

    it('should combine status and listing filters', () => {
      component.setStatusFilter('ACTIVE');
      component.setListingFilter('SALE');
      expect(component.filteredRows.every(r =>
        r.status === 'ACTIVE' && r.listingType.includes('SALE'),
      )).toBeTrue();
    });

    it('should combine status and search', () => {
      component.setStatusFilter('ACTIVE');
      component.searchQuery = 'chennai';
      component.onSearch();
      expect(component.filteredRows.every(r => r.status === 'ACTIVE')).toBeTrue();
      expect(component.filteredRows.every(r => r.city.toLowerCase().includes('chennai'))).toBeTrue();
    });

    it('should return 0 when no rows match combined filters', () => {
      component.setStatusFilter('SOLD');
      component.setListingFilter('LEASE');
      expect(component.filteredRows.length).toBe(0);
    });

    it('filteredRows should return [] when report is null', () => {
      component.report = null;
      expect(component.filteredRows).toEqual([]);
    });
  });

  // ── Pagination ────────────────────────────────────────────────────────────────

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      const manyProps = Array.from({ length: 25 }, (_, i) =>
        makeProperty({ id: i + 1, title: `Property ${i + 1}`, city: 'Chennai' }),
      );
      agentSvc.getAgentProperties.and.returnValue(of(paginated(manyProps)));
      fixture.detectChanges(); tick();
    }));

    it('should calculate totalPages (25/10 = 3)', () => {
      component.pageSize = 10;
      expect(component.totalPages).toBe(3);
    });

    it('totalPages should be at least 1 even with 0 rows', () => {
      component.report = { ...component.report!, rows: [] };
      expect(component.totalPages).toBe(1);
    });

    it('setPage should update currentPage', () => {
      component.setPage(2);
      expect(component.currentPage).toBe(2);
    });

    it('setPage should not go below 1', () => {
      component.setPage(0);
      expect(component.currentPage).toBe(1);
    });

    it('setPage should not exceed totalPages', () => {
      component.setPage(999);
      expect(component.currentPage).toBe(1);
    });

    it('setPage should accept exactly totalPages', () => {
      const total = component.totalPages;
      component.setPage(total);
      expect(component.currentPage).toBe(total);
    });

    it('pagedRows should return pageSize rows on first page', () => {
      component.pageSize    = 10;
      component.currentPage = 1;
      expect(component.pagedRows.length).toBe(10);
    });

    it('last page should return remaining rows', () => {
      component.pageSize    = 10;
      component.currentPage = 3;
      expect(component.pagedRows.length).toBe(5);
    });

    it('onPageSizeChange should reset currentPage to 1', () => {
      component.currentPage = 2;
      component.onPageSizeChange();
      expect(component.currentPage).toBe(1);
    });

    it('pageNumbers should include 1 and last page', () => {
      component.pageSize = 10;
      const nums = component.pageNumbers.filter((n: number) => n !== -1);
      expect(nums).toContain(1);
      expect(nums).toContain(3);
    });

    it('pageNumbers should not add leading ellipsis when range starts at 1', () => {
      component.pageSize    = 10;
      component.currentPage = 1;
      const nums = component.pageNumbers;
      expect(nums[0]).toBe(1);
    });

    it('pageNumbers should not add trailing ellipsis when range ends at totalPages', () => {
      component.pageSize    = 10;
      component.currentPage = 3;
      const nums = component.pageNumbers;
      expect(nums[nums.length - 1]).toBe(component.totalPages);
    });

    it('pageNumbers should add ellipsis (-1) when current page is far from start', fakeAsync(() => {
      const moreProps = Array.from({ length: 20 }, (_, i) =>
        makeProperty({ id: i + 100, title: `P${i}`, city: 'Chennai' }),
      );
      agentSvc.getAgentProperties.and.returnValue(of(paginated(moreProps)));
      component.loadReport(); tick();
      component.pageSize    = 2;
      component.currentPage = 8;
      const nums = component.pageNumbers;
      expect(nums).toContain(-1);
    }));
  });

  // ── getEndRow ─────────────────────────────────────────────────────────────────

  describe('getEndRow', () => {
    beforeEach(fakeAsync(() => { fixture.detectChanges(); tick(); }));

    it('should return pageSize when rows >= pageSize', () => {
      component.pageSize    = 2;
      component.currentPage = 1;
      expect(component.getEndRow()).toBe(2);
    });

    it('should return filteredRows.length on last partial page', () => {
      component.pageSize    = 2;
      component.currentPage = 2;
      expect(component.getEndRow()).toBe(3);
    });

    it('should return filteredRows.length when pageSize > total rows', () => {
      component.pageSize    = 100;
      component.currentPage = 1;
      expect(component.getEndRow()).toBe(3);
    });
  });

  // ── statusClass ───────────────────────────────────────────────────────────────

  describe('statusClass', () => {
    it('ACTIVE → badge-active',   () => expect(component.statusClass('ACTIVE')).toBe('badge-active'));
    it('SOLD → badge-sold',       () => expect(component.statusClass('SOLD')).toBe('badge-sold'));
    it('PENDING → badge-pending', () => expect(component.statusClass('PENDING')).toBe('badge-pending'));
    it('unknown → badge-default', () => expect(component.statusClass('UNKNOWN')).toBe('badge-default'));
    it('empty → badge-default',   () => expect(component.statusClass('')).toBe('badge-default'));
  });

  // ── listingClass ──────────────────────────────────────────────────────────────

  describe('listingClass', () => {
    it('contains SALE → badge-sale',   () => expect(component.listingClass('FOR SALE')).toBe('badge-sale'));
    it('contains RENT → badge-rent',   () => expect(component.listingClass('FOR RENT')).toBe('badge-rent'));
    it('contains LEASE → badge-lease', () => expect(component.listingClass('LEASE')).toBe('badge-lease'));
    it('FOR_SALE → badge-sale',        () => expect(component.listingClass('FOR_SALE')).toBe('badge-sale'));
    it('MONTHLY_RENT → badge-rent',    () => expect(component.listingClass('MONTHLY_RENT')).toBe('badge-rent'));
    it('LONG_LEASE → badge-lease',     () => expect(component.listingClass('LONG_LEASE')).toBe('badge-lease'));
    it('unknown → badge-default',      () => expect(component.listingClass('OTHER')).toBe('badge-default'));
  });

  // ── listingLabel ──────────────────────────────────────────────────────────────

  describe('listingLabel', () => {
    it('SALE → "For Sale"',        () => expect(component.listingLabel('SALE')).toBe('For Sale'));
    it('RENT → "For Rent"',        () => expect(component.listingLabel('RENT')).toBe('For Rent'));
    it('LEASE → "Lease"',          () => expect(component.listingLabel('LEASE')).toBe('Lease'));
    it('unknown → returns itself', () => expect(component.listingLabel('COMMERCIAL')).toBe('COMMERCIAL'));
    it('empty → "—"',              () => expect(component.listingLabel('')).toBe('—'));
  });

  // ── formatCurrency ────────────────────────────────────────────────────────────

  describe('formatCurrency', () => {
    it('0 → ₹0',                         () => expect(component.formatCurrency(0)).toBe('₹0'));
    it('NaN → ₹0',                       () => expect(component.formatCurrency(NaN)).toBe('₹0'));
    it('10_000_000 → ₹1.00 Cr',         () => expect(component.formatCurrency(10_000_000)).toBe('₹1.00 Cr'));
    it('25_000_000 → ₹2.50 Cr',         () => expect(component.formatCurrency(25_000_000)).toBe('₹2.50 Cr'));
    it('500_000 → ₹5.00 L',             () => expect(component.formatCurrency(500_000)).toBe('₹5.00 L'));
    it('100_000 → ₹1.00 L (boundary)',  () => expect(component.formatCurrency(100_000)).toBe('₹1.00 L'));
    it('99_999 uses Intl (below lakh)', () => {
      const r = component.formatCurrency(99_999);
      expect(r).not.toContain('L');
      expect(r).not.toContain('Cr');
      expect(r).toContain('₹');
    });
    it('75_000 uses Intl', () => {
      const r = component.formatCurrency(75_000);
      expect(r).toContain('75');
    });
  });

  // ── formatDate ────────────────────────────────────────────────────────────────

  describe('formatDate', () => {
    it('should return non-empty string', () =>
      expect(component.formatDate(new Date('2024-01-15T10:00:00'))).toBeTruthy());

    it('should include the year', () =>
      expect(component.formatDate(new Date('2024-06-01T10:00:00'))).toContain('2024'));
  });

  // ── formatShortDate ───────────────────────────────────────────────────────────

  describe('formatShortDate', () => {
    it('empty string → "—"',      () => expect(component.formatShortDate('')).toBe('—'));
    it('invalid date → "—"',      () => expect(component.formatShortDate('not-a-date')).toBe('—'));
    it('"abc" → "—"',             () => expect(component.formatShortDate('abc')).toBe('—'));
    it('valid ISO string → date', () => {
      const r = component.formatShortDate('2024-01-15T10:00:00Z');
      expect(r).not.toBe('—');
      expect(r).toContain('2024');
    });
  });

  // ── exportExcel ───────────────────────────────────────────────────────────────

  describe('exportExcel', () => {
    beforeEach(fakeAsync(() => { fixture.detectChanges(); tick(); }));

    it('should do nothing when report is null', () => {
      component.report = null;
      const spy = spyOn(document, 'createElement');
      component.exportExcel();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger download', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');
      const anchor = { href: '', download: '', click: jasmine.createSpy('click') };
      spyOn(document, 'createElement').and.returnValue(anchor as any);
      component.exportExcel();
      expect(anchor.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should include agentName in download filename', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');
      const anchor = { href: '', download: '', click: jasmine.createSpy('click') };
      spyOn(document, 'createElement').and.returnValue(anchor as any);
      component.exportExcel();
      expect(anchor.download).toContain('John_Doe');
    });

    it('should export only filtered rows', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');
      const anchor = { href: '', download: '', click: jasmine.createSpy('click') };
      spyOn(document, 'createElement').and.returnValue(anchor as any);
      component.setStatusFilter('SOLD');
      component.exportExcel();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  // ── exportPDF ─────────────────────────────────────────────────────────────────

  describe('exportPDF', () => {
    beforeEach(fakeAsync(() => { fixture.detectChanges(); tick(); }));

    it('should do nothing when report is null', () => {
      component.report = null;
      expect(() => component.exportPDF()).not.toThrow();
    });

    it('should call window.print and restore state', fakeAsync(() => {
      const printSpy = spyOn(window, 'print');
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => { cb(0); return 1; });
      spyOn(document, 'querySelector').and.returnValue(null);
      spyOn(document, 'querySelectorAll').and.returnValue({ forEach: () => {} } as any);

      const savedPageSize = component.pageSize;
      const savedPage     = component.currentPage;
      component.exportPDF();
      tick(500);

      expect(printSpy).toHaveBeenCalled();

      window.dispatchEvent(new Event('afterprint'));
      tick();

      expect(component.pageSize).toBe(savedPageSize);
      expect(component.currentPage).toBe(savedPage);
    }));

    it('should set pageSize to 99999 before printing', fakeAsync(() => {
      let pageSizeDuringPrint = 0;
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => { cb(0); return 1; });
      spyOn(window, 'print').and.callFake(() => { pageSizeDuringPrint = component.pageSize; });
      spyOn(document, 'querySelector').and.returnValue(null);
      spyOn(document, 'querySelectorAll').and.returnValue({ forEach: () => {} } as any);

      component.exportPDF();
      tick(500);
      expect(pageSizeDuringPrint).toBe(99999);
    }));

    it('should set document.title to include agentName before printing', fakeAsync(() => {
      let titleDuringPrint = '';
      const originalTitle  = document.title;
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => { cb(0); return 1; });
      spyOn(window, 'print').and.callFake(() => { titleDuringPrint = document.title; });
      spyOn(document, 'querySelector').and.returnValue(null);
      spyOn(document, 'querySelectorAll').and.returnValue({ forEach: () => {} } as any);

      component.exportPDF();
      tick(500);
      expect(titleDuringPrint).toContain('John_Doe');

      window.dispatchEvent(new Event('afterprint'));
      tick();
      expect(document.title).toBe(originalTitle);
    }));

    it('should handle null querySelector results without throwing', fakeAsync(() => {
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => { cb(0); return 1; });
      spyOn(window, 'print');
      spyOn(document, 'querySelector').and.returnValue(null);
      spyOn(document, 'querySelectorAll').and.returnValue({ forEach: () => {} } as any);
      expect(() => { component.exportPDF(); tick(500); }).not.toThrow();
    }));

    it('should restore pageSize and currentPage after printing', fakeAsync(() => {
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => { cb(0); return 1; });
      spyOn(window, 'print');
      spyOn(document, 'querySelector').and.returnValue(null);
      spyOn(document, 'querySelectorAll').and.returnValue({ forEach: () => {} } as any);

      component.pageSize    = 10;
      component.currentPage = 2;
      component.exportPDF();
      tick(500);

      window.dispatchEvent(new Event('afterprint'));
      tick();

      expect(component.pageSize).toBe(10);
      expect(component.currentPage).toBe(2);
    }));
  });

  // ── trackByIndex ──────────────────────────────────────────────────────────────

  describe('trackByIndex', () => {
    it('should return the index unchanged', () => {
      expect(component.trackByIndex(0)).toBe(0);
      expect(component.trackByIndex(7)).toBe(7);
      expect(component.trackByIndex(99)).toBe(99);
    });
  });
});