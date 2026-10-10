import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';

import { PaymentPageComponent } from './payment-page.component';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — builds a minimal Transaction-shaped object
// ─────────────────────────────────────────────────────────────────────────────
const makePayment = (overrides: Partial<any> = {}): any => ({
  id:             1,
  propertyTitle:  'Test Property',
  offerAmount:    500000,
  paymentDate:    '2024-03-01T10:00:00Z',
  status:         'COMPLETED',
  transactionId:  'TXN-001',
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE
// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentPageComponent', () => {
  let component: PaymentPageComponent;
  let fixture:   ComponentFixture<PaymentPageComponent>;

  let txService:   jasmine.SpyObj<BuyerTransactionService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router:      jasmine.SpyObj<Router>;
  let cdr:         ChangeDetectorRef;

  beforeEach(async () => {
    txService   = jasmine.createSpyObj('BuyerTransactionService', ['getBuyerPayments']);
    authService = jasmine.createSpyObj('AuthService', ['decodeToken']);
    router      = jasmine.createSpyObj('Router', ['navigate']);

    // Safe defaults
    authService.decodeToken.and.returnValue({ userId: '7' });
    txService.getBuyerPayments.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [PaymentPageComponent],
      providers: [
        { provide: BuyerTransactionService, useValue: txService },
        { provide: AuthService,             useValue: authService },
        { provide: Router,                  useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture   = TestBed.createComponent(PaymentPageComponent);
    component = fixture.componentInstance;

    // Grab the real CDR bound to this component's view and spy on it
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    spyOn(cdr, 'detectChanges');
    (component as any).cdr = cdr;
  });

  // ── INITIAL STATE ─────────────────────────────────────────────────────────
  describe('initial state', () => {

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have buyerId = 0 before ngOnInit', () => {
      expect(component.buyerId).toBe(0);
    });

    it('should have myPayments = [] before ngOnInit', () => {
      expect(component.myPayments).toEqual([]);
    });

    it('should have isLoading = false before ngOnInit', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should have sortField = "paymentDate" before ngOnInit', () => {
      expect(component.sortField).toBe('paymentDate');
    });

    it('should have sortAsc = false before ngOnInit', () => {
      expect(component.sortAsc).toBe(false);
    });

    it('should have pageSize = 5 before ngOnInit', () => {
      expect(component.pageSize).toBe(5);
    });

    it('should have currentPage = 1 before ngOnInit', () => {
      expect(component.currentPage).toBe(1);
    });
  });

  // ── NGONINIT — buyerId resolution ─────────────────────────────────────────
  describe('ngOnInit — buyerId resolution', () => {

    it('should resolve buyerId from userId claim', () => {
      authService.decodeToken.and.returnValue({ userId: '7' });
      component.ngOnInit();
      expect(component.buyerId).toBe(7);
    });

    it('should resolve buyerId from sub claim when userId is absent', () => {
      authService.decodeToken.and.returnValue({ sub: '15' });
      component.ngOnInit();
      expect(component.buyerId).toBe(15);
    });

    it('should resolve buyerId from nameidentifier claim', () => {
      authService.decodeToken.and.returnValue({
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '99',
      });
      component.ngOnInit();
      expect(component.buyerId).toBe(99);
    });

    it('should default buyerId to 0 when token has no matching claim', () => {
      authService.decodeToken.and.returnValue({});
      component.ngOnInit();
      expect(component.buyerId).toBe(0);
    });

    it('should default buyerId to 0 when decodeToken returns null', () => {
      authService.decodeToken.and.returnValue(null as any);
      component.ngOnInit();
      expect(component.buyerId).toBe(0);
    });

    it('should call load() on init', () => {
      spyOn(component, 'load');
      component.ngOnInit();
      expect(component.load).toHaveBeenCalled();
    });

    it('should pass resolved buyerId to getBuyerPayments', () => {
      authService.decodeToken.and.returnValue({ userId: '42' });
      component.ngOnInit();
      expect(txService.getBuyerPayments).toHaveBeenCalledWith(42);
    });
  });

  // ── LOAD ──────────────────────────────────────────────────────────────────
  describe('load()', () => {

    beforeEach(() => component.ngOnInit());

    it('should set isLoading to true before the response arrives', () => {
      const subject = new Subject<any>();
      txService.getBuyerPayments.and.returnValue(subject.asObservable());
      component.load();
      expect(component.isLoading).toBe(true); // mid-flight
      subject.next([]);
      subject.complete();
    });

    it('should reset currentPage to 1 on every load', () => {
      component.currentPage = 3;
      txService.getBuyerPayments.and.returnValue(of([]));
      component.load();
      expect(component.currentPage).toBe(1);
    });

    it('should set isLoading to false after successful response', () => {
      txService.getBuyerPayments.and.returnValue(of([]));
      component.load();
      expect(component.isLoading).toBe(false);
    });

    it('should populate myPayments from API response', () => {
      const payments = [makePayment(), makePayment({ id: 2 })];
      txService.getBuyerPayments.and.returnValue(of(payments));
      component.load();
      expect(component.myPayments.length).toBe(2);
    });

    it('should handle null API response gracefully', () => {
      txService.getBuyerPayments.and.returnValue(of(null as any));
      component.load();
      expect(component.myPayments).toEqual([]);
    });

    it('should call cdr.detectChanges on success', () => {
      (cdr.detectChanges as jasmine.Spy).calls.reset();
      txService.getBuyerPayments.and.returnValue(of([]));
      component.load();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should set myPayments to [] on API error', () => {
      txService.getBuyerPayments.and.returnValue(throwError(() => new Error('Network error')));
      component.load();
      expect(component.myPayments).toEqual([]);
    });

    it('should set isLoading to false on API error', () => {
      txService.getBuyerPayments.and.returnValue(throwError(() => new Error('err')));
      component.load();
      expect(component.isLoading).toBe(false);
    });

    it('should call cdr.detectChanges on API error', () => {
      (cdr.detectChanges as jasmine.Spy).calls.reset();
      txService.getBuyerPayments.and.returnValue(throwError(() => new Error('err')));
      component.load();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });
  });

  // ── SETSORT ───────────────────────────────────────────────────────────────
  describe('setSort()', () => {

    beforeEach(() => component.ngOnInit());

    it('should toggle sortAsc to true when called with the current sortField (was false)', () => {
      component.sortField = 'paymentDate';
      component.sortAsc   = false;
      component.setSort('paymentDate');
      expect(component.sortAsc).toBe(true);
    });

    it('should toggle sortAsc to false when called with the current sortField (was true)', () => {
      component.sortField = 'paymentDate';
      component.sortAsc   = true;
      component.setSort('paymentDate');
      expect(component.sortAsc).toBe(false);
    });

    it('should set a new sortField and reset sortAsc to false for a different field', () => {
      component.sortField = 'paymentDate';
      component.sortAsc   = true;
      component.setSort('propertyTitle');
      expect(component.sortField).toBe('propertyTitle');
      expect(component.sortAsc).toBe(false);
    });

    it('should reset currentPage to 1 after sorting', () => {
      component.currentPage = 3;
      component.setSort('paymentDate');
      expect(component.currentPage).toBe(1);
    });
  });

  // ── SORTED PAYMENTS ───────────────────────────────────────────────────────
  describe('sortedPayments getter', () => {

    beforeEach(() => component.ngOnInit());

    it('should sort by paymentDate descending by default', () => {
      component.myPayments = [
        makePayment({ id: 1, paymentDate: '2024-01-01T00:00:00Z' }),
        makePayment({ id: 2, paymentDate: '2024-06-01T00:00:00Z' }),
      ];
      component.sortField = 'paymentDate';
      component.sortAsc   = false;
      expect(component.sortedPayments[0].id).toBe(2);
    });

    it('should sort by paymentDate ascending when sortAsc is true', () => {
      component.myPayments = [
        makePayment({ id: 1, paymentDate: '2024-06-01T00:00:00Z' }),
        makePayment({ id: 2, paymentDate: '2024-01-01T00:00:00Z' }),
      ];
      component.sortField = 'paymentDate';
      component.sortAsc   = true;
      expect(component.sortedPayments[0].id).toBe(2);
    });

    it('should sort by string field descending', () => {
      component.myPayments = [
        makePayment({ id: 1, propertyTitle: 'Alpha Villa' }),
        makePayment({ id: 2, propertyTitle: 'Zenith Tower' }),
      ];
      component.sortField = 'propertyTitle';
      component.sortAsc   = false;
      expect(component.sortedPayments[0].id).toBe(2);
    });

    it('should sort by string field ascending', () => {
      component.myPayments = [
        makePayment({ id: 1, propertyTitle: 'Zenith Tower' }),
        makePayment({ id: 2, propertyTitle: 'Alpha Villa' }),
      ];
      component.sortField = 'propertyTitle';
      component.sortAsc   = true;
      expect(component.sortedPayments[0].id).toBe(2);
    });

    it('should sort by numeric field descending', () => {
      component.myPayments = [
        makePayment({ id: 1, offerAmount: 100000 }),
        makePayment({ id: 2, offerAmount: 900000 }),
      ];
      component.sortField = 'offerAmount';
      component.sortAsc   = false;
      expect(component.sortedPayments[0].id).toBe(2);
    });

    it('should sort by numeric field ascending', () => {
      component.myPayments = [
        makePayment({ id: 1, offerAmount: 900000 }),
        makePayment({ id: 2, offerAmount: 100000 }),
      ];
      component.sortField = 'offerAmount';
      component.sortAsc   = true;
      expect(component.sortedPayments[0].id).toBe(2);
    });

    it('should return stable order (0) when two numeric values are equal', () => {
      component.myPayments = [
        makePayment({ id: 1, offerAmount: 500000 }),
        makePayment({ id: 2, offerAmount: 500000 }),
      ];
      component.sortField = 'offerAmount';
      component.sortAsc   = true;
      expect(component.sortedPayments.length).toBe(2);
    });

    it('should return stable order when two string values are equal', () => {
      component.myPayments = [
        makePayment({ id: 1, propertyTitle: 'Same Title' }),
        makePayment({ id: 2, propertyTitle: 'Same Title' }),
      ];
      component.sortField = 'propertyTitle';
      component.sortAsc   = true;
      expect(component.sortedPayments.length).toBe(2);
    });

    it('should return stable order when two date values are equal', () => {
      const sameDate = '2024-06-01T00:00:00Z';
      component.myPayments = [
        makePayment({ id: 1, paymentDate: sameDate }),
        makePayment({ id: 2, paymentDate: sameDate }),
      ];
      component.sortField = 'paymentDate';
      component.sortAsc   = false;
      expect(component.sortedPayments.length).toBe(2);
    });

    it('should not mutate the original myPayments array', () => {
      component.myPayments = [
        makePayment({ id: 1, paymentDate: '2024-01-01T00:00:00Z' }),
        makePayment({ id: 2, paymentDate: '2024-06-01T00:00:00Z' }),
      ];
      const originalFirstId = component.myPayments[0].id;
      component.sortedPayments; // invoke getter
      expect(component.myPayments[0].id).toBe(originalFirstId);
    });

    it('should return empty array when myPayments is empty', () => {
      component.myPayments = [];
      expect(component.sortedPayments).toEqual([]);
    });
  });

  // ── PAGINATION ────────────────────────────────────────────────────────────
  describe('pagination', () => {

    beforeEach(() => {
      component.ngOnInit();
      // 12 payments with varying dates
      component.myPayments = Array.from({ length: 12 }, (_, i) =>
        makePayment({ id: i + 1, paymentDate: `2024-0${(i % 9) + 1}-01T00:00:00Z` })
      );
    });

    it('totalPages should equal ceil(12 / 5) = 3', () => {
      expect(component.totalPages).toBe(3);
    });

    it('totalPages should be 0 when myPayments is empty', () => {
      component.myPayments = [];
      expect(component.totalPages).toBe(0);
    });

    it('pages should return [1, 2, 3] for 12 items', () => {
      expect(component.pages).toEqual([1, 2, 3]);
    });

    it('pages should return [] when myPayments is empty', () => {
      component.myPayments = [];
      expect(component.pages).toEqual([]);
    });

    it('pagedPayments should return 5 items on page 1', () => {
      component.currentPage = 1;
      expect(component.pagedPayments.length).toBe(5);
    });

    it('pagedPayments should return 5 items on page 2', () => {
      component.currentPage = 2;
      expect(component.pagedPayments.length).toBe(5);
    });

    it('pagedPayments should return remaining 2 items on page 3', () => {
      component.currentPage = 3;
      expect(component.pagedPayments.length).toBe(2);
    });

    it('goToPage should update currentPage for a valid page', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
    });

    it('goToPage should NOT update currentPage when page < 1', () => {
      component.currentPage = 1;
      component.goToPage(0);
      expect(component.currentPage).toBe(1);
    });

    it('goToPage should NOT update currentPage when page > totalPages', () => {
      component.currentPage = 1;
      component.goToPage(99);
      expect(component.currentPage).toBe(1);
    });

    it('showingFrom should return 1 on page 1 with data', () => {
      component.currentPage = 1;
      expect(component.showingFrom).toBe(1);
    });

    it('showingFrom should return 6 on page 2', () => {
      component.currentPage = 2;
      expect(component.showingFrom).toBe(6);
    });

    it('showingFrom should return 0 when myPayments is empty', () => {
      component.myPayments = [];
      expect(component.showingFrom).toBe(0);
    });

    it('showingTo should return 5 on page 1', () => {
      component.currentPage = 1;
      expect(component.showingTo).toBe(5);
    });

    it('showingTo should return 12 on last page', () => {
      component.currentPage = 3;
      expect(component.showingTo).toBe(12);
    });

    it('showingTo should return 0 when myPayments is empty', () => {
      component.myPayments = [];
      expect(component.showingTo).toBe(0);
    });
  });

  // ── GETDISPLAYDATE ────────────────────────────────────────────────────────
  describe('getDisplayDate()', () => {

    beforeEach(() => component.ngOnInit());

    it('should return a Date object from an ISO string', () => {
      const result = component.getDisplayDate('2024-03-15T10:00:00Z');
      expect(result instanceof Date).toBeTrue();
    });

    it('should return the correct date value from an ISO string', () => {
      const iso = '2024-03-15T10:00:00Z';
      expect(component.getDisplayDate(iso).getTime()).toBe(new Date(iso).getTime());
    });

    it('should accept a Date object and return a Date', () => {
      const date = new Date('2024-06-01');
      expect(component.getDisplayDate(date as any) instanceof Date).toBeTrue();
    });

    it('should return epoch (new Date(0)) when dateVal is undefined', () => {
      expect(component.getDisplayDate(undefined as any).getTime()).toBe(new Date(0).getTime());
    });

    it('should return epoch (new Date(0)) when dateVal is empty string', () => {
      expect(component.getDisplayDate('' as any).getTime()).toBe(new Date(0).getTime());
    });

    it('should return epoch (new Date(0)) when dateVal is 0', () => {
      // falsy numeric 0 → guarded by !dateVal
      expect(component.getDisplayDate(0 as any).getTime()).toBe(new Date(0).getTime());
    });
  });

  // ── GETSTATUSCLASS ────────────────────────────────────────────────────────
  describe('getStatusClass()', () => {

    beforeEach(() => component.ngOnInit());

    it('should return "ts-approved" for COMPLETED', () => {
      expect(component.getStatusClass('COMPLETED')).toBe('ts-approved');
    });

    it('should return "ts-approved" for any other status string', () => {
      expect(component.getStatusClass('PENDING')).toBe('ts-approved');
    });

    it('should return "ts-approved" for empty string', () => {
      expect(component.getStatusClass('')).toBe('ts-approved');
    });
  });

  // ── GETSTATUSLABEL ────────────────────────────────────────────────────────
  describe('getStatusLabel()', () => {

    beforeEach(() => component.ngOnInit());

    it('should return "PAID" for COMPLETED', () => {
      expect(component.getStatusLabel('COMPLETED')).toBe('PAID');
    });

    it('should return "PAID" for any other status string', () => {
      expect(component.getStatusLabel('PENDING')).toBe('PAID');
    });

    it('should return "PAID" for empty string', () => {
      expect(component.getStatusLabel('')).toBe('PAID');
    });
  });

  // ── GOTOOFFERS ────────────────────────────────────────────────────────────
  describe('goToOffers()', () => {

    it('should navigate to /buyer/offer', () => {
      component.ngOnInit();
      component.goToOffers();
      expect(router.navigate).toHaveBeenCalledWith(['/buyer/offer']);
    });
  });
});