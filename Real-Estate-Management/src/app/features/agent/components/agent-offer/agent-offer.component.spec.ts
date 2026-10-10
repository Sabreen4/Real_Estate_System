import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';

import { AgentOffersComponent } from './agent-offer.component';
import { AgentService }         from 'src/app/core/services/agent.service';
import { CacheService }         from 'src/app/core/services/cache.service';

// ── Typed partial helpers so every of(...) satisfies its Observable<T> ──────
const prop  = (id: number, title: string) => of({ id, title } as any);
const user  = (id: number, firstName: string, lastName: string) =>
                of({ id, firstName, lastName } as any);

describe('AgentOffersComponent', () => {
  let component: AgentOffersComponent;
  let fixture:   ComponentFixture<AgentOffersComponent>;
  let agentSpy:  jasmine.SpyObj<AgentService>;
  let cacheSpy:  jasmine.SpyObj<CacheService>;

  // FIX: use buyerId (not userId) — enrich() reads r.buyerId ?? r.agentUserId
  const mockOffers: any[] = [
    { id: 3, propertyId: 10, buyerId: 5,  offerAmount: 100000, status: 'PENDING'  },
    { id: 1, propertyId: 11, buyerId: 6,  offerAmount: 200000, status: 'APPROVED' },
    { id: 2, propertyId: 12, buyerId: 7,  offerAmount: 300000, status: 'REJECTED' },
  ];

  beforeEach(async () => {
    agentSpy = jasmine.createSpyObj('AgentService', [
      'getOffers', 'updateOffer', 'getProperty', 'getUser'
    ]);
    cacheSpy = jasmine.createSpyObj('CacheService', [
      'getOffers', 'setOffers', 'clearOffers'
    ]);

    // Default: no cache hit → loadOffers() path
    cacheSpy.getOffers.and.returnValue(null);
    cacheSpy.setOffers.and.stub();
    cacheSpy.clearOffers.and.stub();

    agentSpy.getOffers.and.returnValue(of([] as any));
    agentSpy.getProperty.and.returnValue(prop(10, 'House A'));
    agentSpy.getUser.and.returnValue(user(5, 'John', 'Doe'));
    agentSpy.updateOffer.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      declarations: [AgentOffersComponent],
      schemas:      [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AgentService, useValue: agentSpy },
        { provide: CacheService, useValue: cacheSpy },
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(AgentOffersComponent);
    component = fixture.componentInstance;
    // obtain the real CDR instance — avoids DI token mismatch
    const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    (component as any).cdr = cdr;

    fixture.detectChanges(); // triggers ngOnInit → loadOffers (returns [])
  });

  /* ─── Creation ──────────────────────────────────────────────────────── */

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /* ─── ngOnInit – cache MISS → loadOffers ───────────────────────────── */

  it('should call loadOffers on init when cache is empty', () => {
    cacheSpy.getOffers.and.returnValue(null);
    const spy = spyOn(component, 'loadOffers');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  /* ─── ngOnInit – cache HIT → uses cached data + background refresh ── */

  it('should use cached offers and schedule background refresh on cache hit', fakeAsync(() => {
    // FIX: use buyerId so enrich() can resolve the user
    const cached: any[] = [{ id: 1, status: 'PENDING', propertyId: 10, buyerId: 5 }];
    cacheSpy.getOffers.and.returnValue(cached);
    agentSpy.getOffers.and.returnValue(of(cached as any));
    agentSpy.getProperty.and.returnValue(prop(10, 'P'));
    agentSpy.getUser.and.returnValue(user(5, 'A', 'B'));

    component.ngOnInit();

    expect(component.offers).toEqual(cached);
    expect(component.isLoading).toBeFalse();

    tick(0); // flush the setTimeout(0) that triggers refreshInBackground

    expect(agentSpy.getOffers).toHaveBeenCalled();
  }));

  /* ─── ngOnInit – cache HIT + background refresh error (silent) ──────── */

  it('should silently swallow background refresh errors', fakeAsync(() => {
    // FIX: use buyerId
    const cached: any[] = [{ id: 1, status: 'PENDING', propertyId: 10, buyerId: 5 }];
    cacheSpy.getOffers.and.returnValue(cached);
    agentSpy.getOffers.and.returnValue(throwError(() => new Error('network')));

    expect(() => {
      component.ngOnInit();
      tick(0);
    }).not.toThrow();
  }));

  /* ─── loadOffers – empty list ───────────────────────────────────────── */

  it('should set isLoading=false after successful load with empty offers', () => {
    agentSpy.getOffers.and.returnValue(of([] as any));
    component.loadOffers();
    expect(component.isLoading).toBeFalse();
    expect(component.offers).toEqual([]);
  });

  /* ─── loadOffers – enrich + sort (pending first) ────────────────────── */

  it('should enrich and sort offers (pending first) on load', () => {
    agentSpy.getOffers.and.returnValue(of(mockOffers as any));
    agentSpy.getProperty.and.callFake((id: number) => prop(id, `Prop ${id}`));
    agentSpy.getUser.and.callFake((id: number)     => user(id, 'User', `${id}`));

    component.loadOffers();

    expect(component.offers.length).toBe(3);
    expect(component.isPending(component.offers[0].status)).toBeTrue();
  });

  /* ─── loadOffers – calls cacheService.setOffers after enrichment ────── */

  it('should call cacheService.setOffers after a successful load', () => {
    agentSpy.getOffers.and.returnValue(of(mockOffers as any));
    agentSpy.getProperty.and.callFake((id: number) => prop(id, 'P'));
    agentSpy.getUser.and.callFake((id: number)     => user(id, 'A', 'B'));

    component.loadOffers();

    expect(cacheSpy.setOffers).toHaveBeenCalled();
  });

  /* ─── Sort – two pending tie-break by id descending ─────────────────── */

  it('should sort two pending offers by id descending', () => {
    // FIX: use buyerId
    const items: any[] = [
      { id: 1, propertyId: 10, buyerId: 5, status: 'PENDING' },
      { id: 5, propertyId: 10, buyerId: 5, status: 'PENDING' },
    ];
    agentSpy.getOffers.and.returnValue(of(items as any));
    agentSpy.getProperty.and.returnValue(prop(10, 'P'));
    agentSpy.getUser.and.returnValue(user(5, 'A', 'B'));

    component.loadOffers();

    expect(component.offers[0].id).toBe(5);
  });

  /* ─── loadOffers – error path ───────────────────────────────────────── */

  it('should set isLoading=false on getOffers error', () => {
    agentSpy.getOffers.and.returnValue(throwError(() => new Error('fail')));
    component.loadOffers();
    expect(component.isLoading).toBeFalse();
  });

  /* ─── loadOffers – resets currentPage to 1 ─────────────────────────── */

  it('should reset currentPage to 1 after loading', () => {
    agentSpy.getOffers.and.returnValue(of(mockOffers as any));
    agentSpy.getProperty.and.returnValue(prop(10, 'P'));
    agentSpy.getUser.and.returnValue(user(5, 'A', 'B'));

    component.currentPage = 3;
    component.loadOffers();
    expect(component.currentPage).toBe(1);
  });

  /* ─── enrich – property cache hit ──────────────────────────────────── */

  it('should use cached property on second load without calling getProperty again', () => {
    // FIX: use buyerId
    const offers: any[] = [{ id: 1, propertyId: 10, buyerId: 5, status: 'PENDING' }];
    agentSpy.getOffers.and.returnValue(of(offers as any));
    agentSpy.getProperty.and.returnValue(prop(10, 'House A'));
    agentSpy.getUser.and.returnValue(user(5, 'John', 'Doe'));

    component.loadOffers();
    agentSpy.getProperty.calls.reset();

    component.loadOffers();
    expect(agentSpy.getProperty).not.toHaveBeenCalled();
  });

  /* ─── enrich – user cache hit ───────────────────────────────────────── */

  it('should use cached user on second load without calling getUser again', () => {
    // FIX: use buyerId
    const offers: any[] = [{ id: 1, propertyId: 10, buyerId: 5, status: 'PENDING' }];
    agentSpy.getOffers.and.returnValue(of(offers as any));
    agentSpy.getProperty.and.returnValue(prop(10, 'House A'));
    agentSpy.getUser.and.returnValue(user(5, 'John', 'Doe'));

    component.loadOffers();
    agentSpy.getUser.calls.reset();

    component.loadOffers();
    expect(agentSpy.getUser).not.toHaveBeenCalled();
  });

  /* ─── enrich – getProperty catchError fallback ──────────────────────── */

  it('should fall back to "Property #id" when getProperty errors', () => {
    // FIX: use buyerId
    const offers: any[] = [{ id: 1, propertyId: 99, buyerId: 5, status: 'PENDING' }];
    agentSpy.getOffers.and.returnValue(of(offers as any));
    agentSpy.getProperty.and.returnValue(throwError(() => new Error('not found')));
    agentSpy.getUser.and.returnValue(user(5, 'John', 'Doe'));

    component.loadOffers();

    expect(component.offers[0].propertyName).toBe('Property #99');
  });

  /* ─── enrich – getUser catchError fallback ──────────────────────────── */

  // FIX: use buyerId — enrich() reads r.buyerId ?? r.agentUserId, not r.userId
  it('should fall back to "Buyer #id" when getUser errors', () => {
    const offers: any[] = [{ id: 1, propertyId: 10, buyerId: 88, status: 'PENDING' }];
    agentSpy.getOffers.and.returnValue(of(offers as any));
    agentSpy.getProperty.and.returnValue(prop(10, 'P'));
    agentSpy.getUser.and.returnValue(throwError(() => new Error('not found')));

    component.loadOffers();

    expect(component.offers[0].buyerName).toBe('Buyer #88');
  });

  /* ─── enrich – null propertyId / buyerId (filter(Boolean) branch) ───── */

  it('should handle rows with null propertyId and buyerId gracefully', () => {
    const offers: any[] = [{ id: 1, propertyId: null, buyerId: null, status: 'PENDING' }];
    agentSpy.getOffers.and.returnValue(of(offers as any));

    expect(() => component.loadOffers()).not.toThrow();
  });

  /* ─── getBuyerName – cached user is null (falsy branch) ─────────────── */

  // FIX: use buyerId so enrich() keys the cache on 77, then getBuyerName(77)
  //      finds null → 'Buyer #77'
  it('getBuyerName should fall back to "Buyer #id" when cached user is null', () => {
    const offers: any[] = [{ id: 1, propertyId: 10, buyerId: 77, status: 'PENDING' }];
    agentSpy.getOffers.and.returnValue(of(offers as any));
    agentSpy.getProperty.and.returnValue(prop(10, 'P'));
    agentSpy.getUser.and.returnValue(of(null as any));

    component.loadOffers();

    expect(component.offers[0].buyerName).toBe('Buyer #77');
  });

  /* ─── Pagination – totalPages ───────────────────────────────────────── */

  it('totalPages should be 1 when no offers', () => {
    component.offers = [];
    expect(component.totalPages).toBe(1);
  });

  it('totalPages should calculate correctly', () => {
    component.offers   = new Array(12).fill({ status: 'PENDING' });
    component.pageSize = 5;
    expect(component.totalPages).toBe(3);
  });

  /* ─── Pagination – pagedOffers ──────────────────────────────────────── */

  it('pagedOffers should return correct slice', () => {
    component.offers      = [1, 2, 3, 4, 5, 6].map(id => ({ id })) as any;
    component.pageSize    = 5;
    component.currentPage = 2;
    expect(component.pagedOffers).toEqual([{ id: 6 }] as any);
  });

  /* ─── Pagination – pageNumbers ──────────────────────────────────────── */

  it('pageNumbers should return array 1..totalPages', () => {
    component.offers   = new Array(10).fill({}) as any;
    component.pageSize = 5;
    expect(component.pageNumbers).toEqual([1, 2]);
  });

  /* ─── Pagination – pageEnd ──────────────────────────────────────────── */

  it('pageEnd should clamp to offers.length on last partial page', () => {
    component.offers      = new Array(8).fill({}) as any;
    component.pageSize    = 5;
    component.currentPage = 2;
    expect(component.pageEnd).toBe(8);
  });

  it('pageEnd should return currentPage*pageSize on a full page', () => {
    component.offers      = new Array(10).fill({}) as any;
    component.pageSize    = 5;
    component.currentPage = 1;
    expect(component.pageEnd).toBe(5);
  });

  /* ─── goToPage ──────────────────────────────────────────────────────── */

  it('goToPage() should update currentPage for a valid page', () => {
    component.offers   = new Array(10).fill({}) as any;
    component.pageSize = 5;
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
  });

  it('goToPage() should ignore page < 1', () => {
    component.currentPage = 1;
    component.goToPage(0);
    expect(component.currentPage).toBe(1);
  });

  it('goToPage() should ignore page > totalPages', () => {
    component.offers      = new Array(5).fill({}) as any;
    component.pageSize    = 5;
    component.currentPage = 1;
    component.goToPage(99);
    expect(component.currentPage).toBe(1);
  });

  /* ─── updateOffer – offer found ─────────────────────────────────────── */

  it('should update offer status in-place when offer is found', () => {
    component.offers = [{ id: 1, status: 'PENDING' }] as any;
    agentSpy.updateOffer.and.returnValue(of({} as any));
    component.updateOffer(1, 'APPROVED');
    expect(component.offers.find((o: any) => o.id === 1)?.status).toBe('APPROVED');
  });

  /* ─── updateOffer – offer NOT found (if(o) false branch) ────────────── */

  it('should not throw when updated id does not exist in offers', () => {
    component.offers = [{ id: 1, status: 'PENDING' }] as any;
    agentSpy.updateOffer.and.returnValue(of({} as any));
    expect(() => component.updateOffer(999, 'APPROVED')).not.toThrow();
  });

  /* ─── updateOffer – currentPage clamped ─────────────────────────────── */

  it('should clamp currentPage back to totalPages after update reduces pages', () => {
    component.offers      = new Array(5).fill({ id: 1, status: 'PENDING' }) as any;
    component.pageSize    = 5;
    component.currentPage = 2; // beyond totalPages (which is 1)
    agentSpy.updateOffer.and.returnValue(of({} as any));
    component.updateOffer(1, 'APPROVED');
    expect(component.currentPage).toBeLessThanOrEqual(component.totalPages);
  });

  /* ─── updateOffer – calls cacheService.setOffers ────────────────────── */

  it('should call cacheService.setOffers after updateOffer', () => {
    component.offers = [{ id: 1, status: 'PENDING' }] as any;
    agentSpy.updateOffer.and.returnValue(of({} as any));
    cacheSpy.setOffers.calls.reset();
    component.updateOffer(1, 'APPROVED');
    expect(cacheSpy.setOffers).toHaveBeenCalled();
  });

  /* ─── clearCache ────────────────────────────────────────────────────── */

  it('clearCache() should delegate to cacheService.clearOffers', () => {
    component.clearCache();
    expect(cacheSpy.clearOffers).toHaveBeenCalled();
  });

  /* ─── isPending ─────────────────────────────────────────────────────── */

  it('isPending() should return true for PENDING and empty string', () => {
    expect(component.isPending('PENDING')).toBeTrue();
    expect(component.isPending('pending')).toBeTrue();
    expect(component.isPending('')).toBeTrue();
  });

  it('isPending() should return false for APPROVED and REJECTED', () => {
    expect(component.isPending('APPROVED')).toBeFalse();
    expect(component.isPending('REJECTED')).toBeFalse();
  });

  /* ─── getStatusClass ────────────────────────────────────────────────── */

  it('getStatusClass() should return correct class for all branches', () => {
    expect(component.getStatusClass('APPROVED')).toBe('status-accepted');
    expect(component.getStatusClass('REJECTED')).toBe('status-rejected');
    expect(component.getStatusClass('PENDING')).toBe('status-pending');
    expect(component.getStatusClass('')).toBe('status-pending');
  });

  /* ─── getStatusLabel ────────────────────────────────────────────────── */

  it('getStatusLabel() should return correct label for all branches', () => {
    expect(component.getStatusLabel('APPROVED')).toBe('Approved');
    expect(component.getStatusLabel('REJECTED')).toBe('Rejected');
    expect(component.getStatusLabel('PENDING')).toBe('Pending');
    expect(component.getStatusLabel('')).toBe('Pending');
  });

  /* ─── formatPrice ───────────────────────────────────────────────────── */

  it('formatPrice() should format as INR currency', () => {
    const result = component.formatPrice(100000);
    expect(result).toContain('1,00,000');
  });

  /* ─── pendingOffers ─────────────────────────────────────────────────── */

  it('pendingOffers should count only pending items', () => {
    component.offers = [
      { status: 'PENDING'  },
      { status: 'APPROVED' },
      { status: 'PENDING'  },
    ] as any;
    expect(component.pendingOffers).toBe(2);
  });
});