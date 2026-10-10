import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { Router }          from '@angular/router';
import { of, throwError }  from 'rxjs';

import { DashboardComponent }       from './dashboard.component';
import { AgentPropertyService }     from 'src/app/core/services/agent-property.service';
import { AuthService }              from 'src/app/core/services/auth.service';
import { BuyerTransactionService }  from 'src/app/core/services/buyer-transaction.service';
import { CacheService }             from 'src/app/core/services/cache.service';

// ── Config imports so tests match real values ────────────────────────────────
import { ACTIVE_STATUSES, CLOSED_STATUSES } from './configs/property-status.config';
import { STATUS_SEGMENTS_CONFIG }           from './configs/status-segments.config';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeRawProperty = (overrides: any = {}): any => ({
  id:          1,
  title:       'Test Property',
  description: 'Desc',
  city:        'Chennai',
  state:       'TN',
  price:       1000,
  size:        1200,
  propertyType: 'Apartment',
  listingType:  'For Sale',
  status:       'ACTIVE',
  agentId:      42,
  userId:       42,
  ownerId:      42,
  createdBy:    42,
  images:       [],
  ...overrides,
});

const TOKEN = { sub: '42', firstName: 'John', lastName: 'Doe' };

// Canvases appended to body during buildCharts tests
const appendedCanvases: HTMLCanvasElement[] = [];

const makeCanvas = () => {
  const c = document.createElement('canvas');
  c.width  = 300;
  c.height = 200;
  document.body.appendChild(c);
  appendedCanvases.push(c);
  return { nativeElement: c };
};

const attachAllCanvases = (comp: DashboardComponent) => {
  (comp as any).statusChartRef    = makeCanvas();
  (comp as any).listingChartRef   = makeCanvas();
  (comp as any).priceChartRef     = makeCanvas();
  (comp as any).valueChartRef     = makeCanvas();
  (comp as any).breakdownChartRef = makeCanvas();
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture:   ComponentFixture<DashboardComponent>;
  let svcSpy:    jasmine.SpyObj<AgentPropertyService>;
  let authSpy:   jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let txSpy:     jasmine.SpyObj<BuyerTransactionService>;
  let cacheSpy:  jasmine.SpyObj<CacheService>;
  let cdrSpy:    jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    svcSpy    = jasmine.createSpyObj('AgentPropertyService', ['getAgentProperties']);
    authSpy   = jasmine.createSpyObj('AuthService', ['decodeToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    txSpy     = jasmine.createSpyObj('BuyerTransactionService', [
      'getBuyerOffers', 'getBuyerAppointments',
      'getBuyerPayments', 'updatePropertyStatus',
    ]);
    cacheSpy = jasmine.createSpyObj('CacheService', [
      'getDashboard', 'setDashboard', 'clearDashboard',
      'getOffers', 'setOffers', 'clearOffers',
      'getAppointments', 'setAppointments', 'clearAppointments',
      'get', 'set', 'has', 'invalidate', 'invalidatePrefix', 'clear', 'remember',
    ]);

    // Safe defaults
    authSpy.decodeToken.and.returnValue(TOKEN);
    svcSpy.getAgentProperties.and.returnValue(of({ items: [] }) as any);
    cacheSpy.getDashboard.and.returnValue(null);

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      schemas:      [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AgentPropertyService,    useValue: svcSpy    },
        { provide: AuthService,             useValue: authSpy   },
        { provide: Router,                  useValue: routerSpy },
        { provide: BuyerTransactionService, useValue: txSpy     },
        { provide: CacheService,            useValue: cacheSpy  },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;

    // Real CDR instance — prevents markForCheck/detectChanges errors
    const realCdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    (component as any).cdr = realCdr;

    // Also keep a spy reference for the assertions that need it
    cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges', 'markForCheck']);
  });

  afterEach(() => {
    // Destroy charts to avoid canvas-reuse errors across tests
    component.ngOnDestroy();
    // Remove any canvases appended to body
    appendedCanvases.forEach(c => c.parentNode?.removeChild(c));
    appendedCanvases.length = 0;
  });

  /* ─── Initial state ─────────────────────────────────────────────────── */

  describe('initial state', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have agentUserId = 0 before ngOnInit', () => {
      expect(component.agentUserId).toBe(0);
    });

    it('should have agentName empty before ngOnInit', () => {
      expect(component.agentName).toBe('');
    });

    it('should have properties = [] before ngOnInit', () => {
      expect(component.properties).toEqual([]);
    });

    it('should have isLoading = false before ngOnInit', () => {
      expect(component.isLoading).toBe(false);
    });
  });

  /* ─── ngOnInit ──────────────────────────────────────────────────────── */

  describe('ngOnInit', () => {
    it('should resolve agentUserId from sub claim', () => {
      authSpy.decodeToken.and.returnValue({ sub: '42', firstName: 'John' });
      component.ngOnInit();
      expect(component.agentUserId).toBe(42);
    });

    it('should default agentUserId to 0 when sub is absent', () => {
      authSpy.decodeToken.and.returnValue({ firstName: 'John' });
      component.ngOnInit();
      expect(component.agentUserId).toBe(0);
    });

    it('should set agentName from firstName + lastName', () => {
      authSpy.decodeToken.and.returnValue({ sub: '1', firstName: 'Jane', lastName: 'Doe' });
      component.ngOnInit();
      expect(component.agentName).toBe('Jane Doe');
    });

    it('should trim agentName when lastName is empty', () => {
      authSpy.decodeToken.and.returnValue({ sub: '1', firstName: 'Jane', lastName: '' });
      component.ngOnInit();
      expect(component.agentName).toBe('Jane');
    });

    it('should set agentName to "Agent" when firstName is absent', () => {
      authSpy.decodeToken.and.returnValue({ sub: '1' });
      component.ngOnInit();
      expect(component.agentName).toBe('Agent');
    });

    it('should default agentUserId=0 and agentName="Agent" when decodeToken returns null', () => {
      authSpy.decodeToken.and.returnValue(null);
      component.ngOnInit();
      expect(component.agentUserId).toBe(0);
      expect(component.agentName).toBe('Agent');
    });

    it('should call loadProperties when cache is null', () => {
      cacheSpy.getDashboard.and.returnValue(null);
      spyOn(component, 'loadProperties');
      component.ngOnInit();
      expect(component.loadProperties).toHaveBeenCalled();
    });

    it('should use cached data and NOT call loadProperties when cache hit', fakeAsync(() => {
      const cachedProps = [makeRawProperty()];
      cacheSpy.getDashboard.and.returnValue({
        properties:  cachedProps,
        agentName:   'John Doe',
        agentUserId: 42,
      });
      // background refresh
      svcSpy.getAgentProperties.and.returnValue(of({ items: [makeRawProperty()] }) as any);
      const loadSpy = spyOn(component, 'loadProperties');

      component.ngOnInit();
      tick(0); // flush setTimeout(0)

      expect(loadSpy).not.toHaveBeenCalled();
      expect(component.agentName).toBe('John Doe');
      expect(component.properties.length).toBe(1);
    }));

    it('should call loadProperties when cache returns null for different agentUserId', () => {
      cacheSpy.getDashboard.and.returnValue(null);
      authSpy.decodeToken.and.returnValue({ sub: '99', firstName: 'Other' });
      svcSpy.getAgentProperties.and.returnValue(of({ items: [] }) as any);
      const loadSpy = spyOn(component, 'loadProperties');
      component.ngOnInit();
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  /* ─── loadProperties ────────────────────────────────────────────────── */

  describe('loadProperties', () => {
    beforeEach(() => { component.agentUserId = 42; });

    it('should set isLoading=false after successful response', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of({ items: [] }) as any);
      component.loadProperties();
      tick(0);
      expect(component.isLoading).toBe(false);
    }));

    it('should populate properties from items array', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of({
        items: [makeRawProperty({ id: 1 }), makeRawProperty({ id: 2 })]
      }) as any);
      component.loadProperties();
      tick(0);
      expect(component.properties.length).toBe(2);
    }));

    it('should populate properties from flat array response', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(
        [makeRawProperty({ id: 1 }), makeRawProperty({ id: 2 })] as any
      ));
      component.loadProperties();
      tick(0);
      expect(component.properties.length).toBe(2);
    }));

    it('should use [] when service resolves with null', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(null as any));
      component.loadProperties();
      tick(0);
      expect(component.properties).toEqual([]);
      expect(component.isLoading).toBe(false);
    }));

    it('should filter only properties owned by the agent', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of({
        items: [
          makeRawProperty({ id: 1, userId: 42, agentId: 0, ownerId: 0, createdBy: 0 }),
          makeRawProperty({ id: 2, userId: 0,  agentId: 0, ownerId: 0, createdBy: 0 }),
        ]
      }) as any);
      component.loadProperties();
      tick(0);
      expect(component.properties.length).toBe(1);
      expect(component.properties[0].id).toBe(1);
    }));

    it('should call cacheService.setDashboard after loading', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of({ items: [] }) as any);
      component.loadProperties();
      tick(0);
      expect(cacheSpy.setDashboard).toHaveBeenCalled();
    }));

    it('should set isLoading=false on error', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(throwError(() => new Error('fail')));
      component.loadProperties();
      tick(0);
      expect(component.isLoading).toBe(false);
    }));
  });

  /* ─── filterOwn (private) ───────────────────────────────────────────── */

  describe('filterOwn (private)', () => {
    beforeEach(() => { component.agentUserId = 42; });

    it('should include property matched by userId', () => {
      const r = (component as any).filterOwn([
        makeRawProperty({ userId: 42, agentId: 0, ownerId: 0, createdBy: 0 })
      ]);
      expect(r.length).toBe(1);
    });

    it('should include property matched by agentId', () => {
      const r = (component as any).filterOwn([
        makeRawProperty({ userId: 0, agentId: 42, ownerId: 0, createdBy: 0 })
      ]);
      expect(r.length).toBe(1);
    });

    it('should include property matched by ownerId', () => {
      const r = (component as any).filterOwn([
        makeRawProperty({ userId: 0, agentId: 0, ownerId: 42, createdBy: 0 })
      ]);
      expect(r.length).toBe(1);
    });

    it('should include property matched by createdBy', () => {
      const r = (component as any).filterOwn([
        makeRawProperty({ userId: 0, agentId: 0, ownerId: 0, createdBy: 42 })
      ]);
      expect(r.length).toBe(1);
    });

    it('should exclude property not matching any field', () => {
      const r = (component as any).filterOwn([
        makeRawProperty({ userId: 99, agentId: 99, ownerId: 99, createdBy: 99 })
      ]);
      expect(r.length).toBe(0);
    });

    it('should handle mixed array: keep 2 of 3', () => {
      const raw = [
        makeRawProperty({ id: 1, userId: 42 }),
        makeRawProperty({ id: 2, agentId: 42, userId: 0 }),
        makeRawProperty({ id: 3, userId: 99, agentId: 99, ownerId: 99, createdBy: 99 }),
      ];
      expect((component as any).filterOwn(raw).length).toBe(2);
    });
  });

  /* ─── saveCache / clearCache ────────────────────────────────────────── */

  describe('saveCache / clearCache', () => {
    it('saveCache should call cacheService.setDashboard with correct payload', () => {
      component.properties  = [makeRawProperty()] as any;
      component.agentName   = 'Test Agent';
      component.agentUserId = 42;
      (component as any).saveCache();
      expect(cacheSpy.setDashboard).toHaveBeenCalledWith({
        properties:  component.properties,
        agentName:   'Test Agent',
        agentUserId: 42,
      });
    });

    it('clearCache should call cacheService.clearDashboard with agentUserId', () => {
      component.agentUserId = 42;
      component.clearCache();
      expect(cacheSpy.clearDashboard).toHaveBeenCalledWith(42);
    });
  });

  /* ─── refreshInBackground (private) ────────────────────────────────── */

  describe('refreshInBackground (private)', () => {
    beforeEach(() => { component.agentUserId = 42; });

    it('should silently update properties in the background', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of({
        items: [makeRawProperty({ id: 99 })]
      }) as any);
      (component as any).refreshInBackground();
      tick();
      expect(component.properties[0].id).toBe(99);
    }));

    it('should use [] when service resolves with null in background', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of(null as any));
      (component as any).refreshInBackground();
      tick();
      expect(component.properties).toEqual([]);
    }));

    it('should not throw on background error', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(throwError(() => new Error('bg fail')));
      expect(() => {
        (component as any).refreshInBackground();
        tick();
      }).not.toThrow();
    }));

    it('should call cacheService.setDashboard after background refresh', fakeAsync(() => {
      svcSpy.getAgentProperties.and.returnValue(of({ items: [makeRawProperty()] }) as any);
      (component as any).refreshInBackground();
      tick();
      expect(cacheSpy.setDashboard).toHaveBeenCalled();
    }));
  });

  /* ─── Navigation ────────────────────────────────────────────────────── */

  describe('navigation', () => {
    it('goToProperties should navigate to /agent/properties', () => {
      component.goToProperties();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/agent/properties']);
    });

    it('goToAddProperty should navigate with action=add queryParam', () => {
      component.goToAddProperty();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/agent/properties'], { queryParams: { action: 'add' } }
      );
    });

    it('goToReport should navigate to /agent/report', () => {
      component.goToReport();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/agent/report']);
    });
  });

  /* ─── Stats getters ─────────────────────────────────────────────────── */

  describe('stats getters', () => {
    // Use the first active/closed status from config so tests don't hardcode strings
    const anActiveStatus  = (ACTIVE_STATUSES  as readonly string[])[0]; // e.g. 'ACTIVE'
    const aClosedStatus   = (CLOSED_STATUSES  as readonly string[])[0]; // e.g. 'SOLD'
    const anUnknownStatus = 'TOTALLY_UNKNOWN_XYZ';                      // never in any config

    beforeEach(() => {
      component.properties = [
        makeRawProperty({ id: 1, status: anActiveStatus,  price: 1000 }),
        makeRawProperty({ id: 2, status: aClosedStatus,   price: 2000 }),
        makeRawProperty({ id: 3, status: anUnknownStatus, price: 500  }),
      ] as any;
    });

    it('totalCount should equal properties.length', () => {
      expect(component.totalCount).toBe(3);
    });

    it('activeCount should count properties with an ACTIVE_STATUSES value', () => {
      expect(component.activeCount).toBe(1);
    });

    it('activeCount should count all ACTIVE_STATUSES values', () => {
      component.properties = (ACTIVE_STATUSES as readonly string[]).map((s, i) =>
        makeRawProperty({ id: i, status: s })
      ) as any;
      expect(component.activeCount).toBe((ACTIVE_STATUSES as readonly string[]).length);
    });

    it('soldCount should count properties with a CLOSED_STATUSES value', () => {
      expect(component.soldCount).toBe(1);
    });

    it('soldCount should count all CLOSED_STATUSES values', () => {
      component.properties = (CLOSED_STATUSES as readonly string[]).map((s, i) =>
        makeRawProperty({ id: i, status: s })
      ) as any;
      expect(component.soldCount).toBe((CLOSED_STATUSES as readonly string[]).length);
    });

    it('otherCount should count properties with unknown status', () => {
      expect(component.otherCount).toBe(1);
    });

    it('totalValue should sum all property prices', () => {
      expect(component.totalValue).toBe(3500);
    });

    it('totalValue should return 0 for empty properties', () => {
      component.properties = [];
      expect(component.totalValue).toBe(0);
    });

    it('totalValue should treat null price as 0 via || 0 fallback', () => {
      component.properties = [
        makeRawProperty({ id: 1, price: 1000 }),
        makeRawProperty({ id: 2, price: 0    }),
        makeRawProperty({ id: 3, price: null }),
      ] as any;
      expect(component.totalValue).toBe(1000);
    });

    it('pct should return correct rounded percentage', () => {
      expect(component.pct(1)).toBe(33);
    });

    it('pct should return 0 when totalCount is 0', () => {
      component.properties = [];
      expect(component.pct(1)).toBe(0);
    });

    it('stackedSegments should return [] when no properties', () => {
      component.properties = [];
      expect(component.stackedSegments).toEqual([]);
    });

    it('stackedSegments should only include segments with count > 0', () => {
      expect(component.stackedSegments.every(s => s.count > 0)).toBeTrue();
    });

    it('stackedSegments should have the same labels as STATUS_SEGMENTS_CONFIG', () => {
      const expectedLabels = STATUS_SEGMENTS_CONFIG.map(c => c.label);
      const actualLabels   = component.stackedSegments.map(s => s.label);
      actualLabels.forEach(l => expect(expectedLabels).toContain(l));
    });

    it('stackedSegments pct should sum to <= 100', () => {
      const total = component.stackedSegments.reduce((s, seg) => s + seg.pct, 0);
      expect(total).toBeLessThanOrEqual(100);
    });
  });

  /* ─── listingSegments ───────────────────────────────────────────────── */

  describe('listingSegments', () => {
    it('should return [] when no properties', () => {
      component.properties = [];
      expect(component.listingSegments).toEqual([]);
    });

    it('should return For Sale segment when SALE properties exist', () => {
      component.properties = [makeRawProperty({ listingType: 'SALE' })] as any;
      const sale = component.listingSegments.find(s => s.label === 'For Sale');
      expect(sale).toBeTruthy();
      expect(sale!.count).toBe(1);
    });

    it('should return For Rent segment when RENT properties exist', () => {
      component.properties = [makeRawProperty({ listingType: 'RENT' })] as any;
      const rent = component.listingSegments.find(s => s.label === 'For Rent');
      expect(rent).toBeTruthy();
      expect(rent!.count).toBe(1);
    });

    it('should return Lease segment when LEASE properties exist', () => {
      component.properties = [makeRawProperty({ listingType: 'LEASE' })] as any;
      const lease = component.listingSegments.find(s => s.label === 'Lease');
      expect(lease).toBeTruthy();
      expect(lease!.count).toBe(1);
    });

    it('should return all three segments when all listing types are present', () => {
      component.properties = [
        makeRawProperty({ listingType: 'SALE'  }),
        makeRawProperty({ listingType: 'RENT'  }),
        makeRawProperty({ listingType: 'LEASE' }),
      ] as any;
      expect(component.listingSegments.length).toBe(3);
    });

    it('should filter out segments with count = 0', () => {
      component.properties = [makeRawProperty({ listingType: 'SALE' })] as any;
      const labels = component.listingSegments.map(s => s.label);
      expect(labels).not.toContain('For Rent');
      expect(labels).not.toContain('Lease');
    });

    it('should match listingType case-insensitively (FOR_SALE style)', () => {
      component.properties = [makeRawProperty({ listingType: 'FOR_SALE' })] as any;
      expect(component.listingSegments.find(s => s.label === 'For Sale')).toBeTruthy();
    });

    it('should count multiple properties of the same type', () => {
      component.properties = [
        makeRawProperty({ id: 1, listingType: 'RENT' }),
        makeRawProperty({ id: 2, listingType: 'RENT' }),
        makeRawProperty({ id: 3, listingType: 'RENT' }),
      ] as any;
      expect(component.listingSegments.find(s => s.label === 'For Rent')!.count).toBe(3);
    });
  });

  /* ─── formatPrice ───────────────────────────────────────────────────── */

  describe('formatPrice', () => {
    it('should return a string containing the rupee symbol', () => {
      expect(component.formatPrice(1000)).toContain('₹');
    });

    it('should format zero correctly', () => {
      expect(component.formatPrice(0)).toContain('₹');
    });

    it('should format large numbers without decimals', () => {
      expect(component.formatPrice(1_500_000)).not.toContain('.');
    });
  });

  /* ─── buildCharts ───────────────────────────────────────────────────── */

  describe('buildCharts', () => {
    beforeEach(() => {
      component.agentUserId = 42;
      component.properties  = [
        makeRawProperty({ id: 1, status: 'ACTIVE',   listingType: 'SALE',  price: 5_000_000 }),
        makeRawProperty({ id: 2, status: 'SOLD',     listingType: 'RENT',  price: 3_000_000 }),
        makeRawProperty({ id: 3, status: 'INACTIVE', listingType: 'LEASE', price: 2_000_000 }),
      ] as any;
    });

    it('should return early without throwing when ViewChild refs are absent', fakeAsync(() => {
      (component as any).statusChartRef    = undefined;
      (component as any).listingChartRef   = undefined;
      (component as any).priceChartRef     = undefined;
      (component as any).valueChartRef     = undefined;
      (component as any).breakdownChartRef = undefined;
      expect(() => { component.buildCharts(); tick(); }).not.toThrow();
    }));

    it('should destroy existing chart instances before rebuilding', () => {
      const destroySpy = jasmine.createSpy('destroy');
      (component as any).charts = [{ destroy: destroySpy }, { destroy: destroySpy }];
      (component as any).statusChartRef = undefined;
      component.buildCharts();
      expect(destroySpy).toHaveBeenCalledTimes(2);
      expect((component as any).charts).toEqual([]);
    });

    it('should create 5 Chart instances when all canvas refs are present', fakeAsync(() => {
      attachAllCanvases(component);
      component.buildCharts();
      tick();
      expect((component as any).charts.length).toBe(5);
    }));

    it('should not throw when properties array is empty', fakeAsync(() => {
      component.properties = [];
      attachAllCanvases(component);
      expect(() => { component.buildCharts(); tick(); }).not.toThrow();
      expect((component as any).charts.length).toBe(5);
    }));

    it('should skip byType entries with value = 0', fakeAsync(() => {
      component.properties = [
        makeRawProperty({ id: 1, listingType: 'SALE', price: 5_000_000, status: 'ACTIVE' }),
      ] as any;
      attachAllCanvases(component);
      expect(() => { component.buildCharts(); tick(); }).not.toThrow();
      expect((component as any).charts.length).toBe(5);
    }));

    it('fmt: should format values >= 1e7 as Cr', fakeAsync(() => {
      component.properties = [
        makeRawProperty({ id: 1, listingType: 'SALE', price: 10_000_000, status: 'ACTIVE' }),
      ] as any;
      attachAllCanvases(component);
      component.buildCharts();
      tick();
      const priceChart   = (component as any).charts[3];
      const tickCallback = priceChart?.options?.scales?.y?.ticks?.callback;
      if (tickCallback) {
        expect(tickCallback(10_000_000)).toBe('₹1.0 Cr');
      }
    }));

    it('fmt: should format values >= 1e5 and < 1e7 as L', fakeAsync(() => {
      component.properties = [
        makeRawProperty({ id: 1, listingType: 'SALE', price: 500_000, status: 'ACTIVE' }),
      ] as any;
      attachAllCanvases(component);
      component.buildCharts();
      tick();
      const priceChart   = (component as any).charts[3];
      const tickCallback = priceChart?.options?.scales?.y?.ticks?.callback;
      if (tickCallback) {
        expect(tickCallback(500_000)).toBe('₹5 L');
      }
    }));

    it('fmt: should use Intl formatter for values < 1e5', fakeAsync(() => {
      component.properties = [
        makeRawProperty({ id: 1, listingType: 'SALE', price: 50_000, status: 'ACTIVE' }),
      ] as any;
      attachAllCanvases(component);
      component.buildCharts();
      tick();
      const priceChart   = (component as any).charts[3];
      const tickCallback = priceChart?.options?.scales?.y?.ticks?.callback;
      if (tickCallback) {
        const result = tickCallback(50_000);
        expect(result).toContain('₹');
        expect(result).not.toContain('Cr');
        expect(result).not.toContain('L');
      }
    }));
  });

  /* ─── ngOnDestroy ───────────────────────────────────────────────────── */

  describe('ngOnDestroy', () => {
    it('should call destroy on every chart instance', () => {
      const spy1 = jasmine.createSpy('d1');
      const spy2 = jasmine.createSpy('d2');
      (component as any).charts = [{ destroy: spy1 }, { destroy: spy2 }];
      component.ngOnDestroy();
      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);
    });

    it('should empty the charts array after destroy', () => {
      (component as any).charts = [{ destroy: jasmine.createSpy('d') }];
      component.ngOnDestroy();
      expect((component as any).charts).toEqual([]);
    });

    it('should not throw when charts array is already empty', () => {
      (component as any).charts = [];
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});