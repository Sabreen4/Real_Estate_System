import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { OfferPageComponent } from './offer-page.component';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — builds a minimal Transaction-shaped object
// ─────────────────────────────────────────────────────────────────────────────
const makeOffer = (overrides: Partial<any> = {}): any => ({
  id:             1,
  offerId:        1,
  propertyId:     101,
  propertyTitle:  'Test Property',
  offerAmount:    500000,
  status:         'PENDING',
  paymentStatus:  '',
  propertyStatus: '',
  city:           'Chennai',
  agentId:        42,
  createdAt:      new Date().toISOString(),
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE
// ─────────────────────────────────────────────────────────────────────────────
describe('OfferPageComponent', () => {
  let component: OfferPageComponent;
  let fixture:   ComponentFixture<OfferPageComponent>;

  let txService:   jasmine.SpyObj<BuyerTransactionService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router:      jasmine.SpyObj<Router>;
  let cdr:         ChangeDetectorRef;

  let getItemSpy: jasmine.Spy;
  let setItemSpy: jasmine.Spy;

  beforeEach(async () => {
    txService   = jasmine.createSpyObj('BuyerTransactionService', ['getBuyerOffers', 'updatePropertyStatus']);
    authService = jasmine.createSpyObj('AuthService', ['decodeToken']);
    router      = jasmine.createSpyObj('Router', ['navigate']);

    // Safe defaults
    authService.decodeToken.and.returnValue({ userId: '7' });
    txService.getBuyerOffers.and.returnValue(of([]));
    txService.updatePropertyStatus.and.returnValue(of({} as any));

    // localStorage spies — reset to empty by default
    getItemSpy = spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    setItemSpy = spyOn(Storage.prototype, 'setItem').and.stub();

    await TestBed.configureTestingModule({
      declarations: [OfferPageComponent],
      providers: [
        { provide: BuyerTransactionService, useValue: txService },
        { provide: AuthService,             useValue: authService },
        { provide: Router,                  useValue: router },
        // No ChangeDetectorRef override — use Angular's real one and spy on it
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture   = TestBed.createComponent(OfferPageComponent);
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

    it('should have default values before ngOnInit', () => {
      expect(component.buyerId).toBe(0);
      expect(component.myOffers).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.showPaymentModal).toBe(false);
      expect(component.selectedProperty).toBeNull();
      expect(component.pendingOfferId).toBeNull();
      expect(component.pendingOfferAmount).toBeNull();
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(5);
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
      authService.decodeToken.and.returnValue({ sub: '12' });
      component.ngOnInit();
      expect(component.buyerId).toBe(12);
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
  });

  // ── STORAGEKEY ────────────────────────────────────────────────────────────
  describe('storageKey (via side-effects)', () => {

    it('should use buyer-specific key when reading localStorage', () => {
      authService.decodeToken.and.returnValue({ userId: '5' });
      component.ngOnInit();
      expect(getItemSpy).toHaveBeenCalledWith('paid_properties_buyer_5');
    });
  });

  // ── GETPAIDIDS (private — via load) ──────────────────────────────────────
  describe('getPaidIds', () => {

    it('should return empty set when localStorage has no entry', () => {
      getItemSpy.and.returnValue(null);
      txService.getBuyerOffers.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.myOffers).toEqual([]);
    });

    it('should mark offer as paid when propertyId is stored in localStorage', () => {
      getItemSpy.and.returnValue(JSON.stringify([101]));
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ propertyId: 101, status: 'APPROVED', paymentStatus: '' }),
      ]));
      component.ngOnInit();
      expect(component.myOffers[0].paymentStatus).toBe('COMPLETED');
    });

    it('should not throw when localStorage.getItem throws', () => {
      getItemSpy.and.throwError('QuotaExceeded');
      txService.getBuyerOffers.and.returnValue(of([]));
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  // ── SAVEPAIDID (private — via onPaymentSuccess) ───────────────────────────
  describe('savePaidId', () => {

    beforeEach(() => component.ngOnInit());

    it('should write propertyId to localStorage on payment success', () => {
      component.myOffers = [makeOffer({ propertyId: 200 })];
      component.onPaymentSuccess({ propertyId: 200, transactionId: 'tx-1' });
      expect(setItemSpy).toHaveBeenCalled();
      const written = setItemSpy.calls.mostRecent().args[1];
      expect(JSON.parse(written)).toContain(200);
    });

    it('should merge new ID with existing IDs from localStorage', () => {
      getItemSpy.and.returnValue(JSON.stringify([101]));
      component.myOffers = [makeOffer({ propertyId: 202 })];
      component.onPaymentSuccess({ propertyId: 202, transactionId: 'tx-2' });
      const written: number[] = JSON.parse(setItemSpy.calls.mostRecent().args[1]);
      expect(written).toContain(101);
      expect(written).toContain(202);
    });

    it('should not throw when localStorage.setItem throws', () => {
      setItemSpy.and.throwError('QuotaExceeded');
      spyOn(console, 'error');
      component.myOffers = [makeOffer({ propertyId: 300 })];
      expect(() =>
        component.onPaymentSuccess({ propertyId: 300, transactionId: 'tx-3' })
      ).not.toThrow();
    });

    it('should log error when localStorage.setItem throws', () => {
      setItemSpy.and.throwError('QuotaExceeded');
      const consoleSpy = spyOn(console, 'error');
      component.myOffers = [makeOffer({ propertyId: 300 })];
      component.onPaymentSuccess({ propertyId: 300, transactionId: 'tx-3' });
      expect(consoleSpy).toHaveBeenCalledWith('localStorage write failed', jasmine.any(Error));
    });
  });

  // ── LOAD ──────────────────────────────────────────────────────────────────
  describe('load()', () => {

    beforeEach(() => {
      spyOn(console, 'error');
      spyOn(console, 'log');
      authService.decodeToken.and.returnValue({ userId: '1' });
      component.ngOnInit();
      (cdr.detectChanges as jasmine.Spy).calls.reset();
    });

    it('should set isLoading to false after successful response', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should populate myOffers from API response', () => {
      txService.getBuyerOffers.and.returnValue(of([makeOffer(), makeOffer({ id: 2, propertyId: 102 })]));
      component.load();
      expect(component.myOffers.length).toBe(2);
    });

    it('should handle null API response gracefully', () => {
      txService.getBuyerOffers.and.returnValue(of(null as any));
      component.load();
      expect(component.myOffers).toEqual([]);
    });

    it('should sort: APPROVED first, PENDING second, REJECTED third, others last', () => {
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ id: 1, status: 'REJECTED', createdAt: '2024-01-01' }),
        makeOffer({ id: 2, status: 'PENDING',  createdAt: '2024-01-02' }),
        makeOffer({ id: 3, status: 'APPROVED', createdAt: '2024-01-03' }),
        makeOffer({ id: 4, status: 'UNKNOWN',  createdAt: '2024-01-04' }),
      ]));
      component.load();
      expect(component.myOffers[0].status).toBe('APPROVED');
      expect(component.myOffers[1].status).toBe('PENDING');
      expect(component.myOffers[2].status).toBe('REJECTED');
      expect(component.myOffers[3].status).toBe('UNKNOWN');
    });

    it('should sort same-status offers by createdAt descending', () => {
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ id: 1, status: 'PENDING', createdAt: '2024-01-01T00:00:00Z' }),
        makeOffer({ id: 2, status: 'PENDING', createdAt: '2024-03-01T00:00:00Z' }),
      ]));
      component.load();
      expect(component.myOffers[0].id).toBe(2);
    });

    it('should produce a stable sort when createdAt values are equal', () => {
      const sameDate = '2024-01-01T00:00:00Z';
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ id: 1, status: 'PENDING', createdAt: sameDate }),
        makeOffer({ id: 2, status: 'PENDING', createdAt: sameDate }),
      ]));
      component.load();
      expect(component.myOffers.length).toBe(2);
    });

    it('should uppercase status, paymentStatus, and propertyStatus', () => {
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ status: 'approved', paymentStatus: 'completed', propertyStatus: 'sold' }),
      ]));
      component.load();
      const o = component.myOffers[0];
      expect(o.status).toBe('APPROVED');
      expect(o.paymentStatus).toBe('COMPLETED');
      expect(o.propertyStatus).toBe('SOLD');
    });

    it('should force PAID state when propertyId is in localStorage', () => {
      getItemSpy.and.returnValue(JSON.stringify([101]));
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ propertyId: 101, status: 'APPROVED', paymentStatus: '' }),
      ]));
      component.load();
      expect(component.myOffers[0].paymentStatus).toBe('COMPLETED');
      expect(component.myOffers[0].propertyStatus).toBe('SOLD');
    });

    it('should force PAID state when API returns paymentStatus COMPLETED', () => {
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ paymentStatus: 'COMPLETED', propertyStatus: 'SOLD' }),
      ]));
      component.load();
      expect(component.myOffers[0].paymentStatus).toBe('COMPLETED');
    });

    it('should force PAID state when propertyStatus is SOLD', () => {
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ paymentStatus: '', propertyStatus: 'SOLD' }),
      ]));
      component.load();
      expect(component.myOffers[0].paymentStatus).toBe('COMPLETED');
    });

    it('should save propertyId to localStorage when offer is already paid via API', () => {
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ propertyId: 555, paymentStatus: 'COMPLETED' }),
      ]));
      setItemSpy.calls.reset();
      component.load();
      expect(setItemSpy).toHaveBeenCalled();
    });

    it('should not enter paid branch when offer is not paid and not in localStorage', () => {
      txService.getBuyerOffers.and.returnValue(of([
        makeOffer({ propertyId: 999, paymentStatus: '', propertyStatus: '' }),
      ]));
      component.load();
      expect(component.myOffers[0].paymentStatus).toBe('');
    });

    it('should reset currentPage to 1 when it exceeds totalPages', () => {
      component.currentPage = 99;
      txService.getBuyerOffers.and.returnValue(of([makeOffer()]));
      component.load();
      expect(component.currentPage).toBe(1);
    });

    it('should NOT reset currentPage when it is within bounds', () => {
      const offers = Array.from({ length: 6 }, (_, i) =>
        makeOffer({ id: i + 1, propertyId: 100 + i })
      );
      txService.getBuyerOffers.and.returnValue(of(offers));
      component.currentPage = 2;
      component.load();
      expect(component.currentPage).toBe(2);
    });

    it('should handle API error: set myOffers to empty array', () => {
      txService.getBuyerOffers.and.returnValue(throwError(() => new Error('Network error')));
      component.load();
      expect(component.myOffers).toEqual([]);
    });

    it('should handle API error: set isLoading to false', () => {
      txService.getBuyerOffers.and.returnValue(throwError(() => new Error('Network error')));
      component.load();
      expect(component.isLoading).toBe(false);
    });

    it('should call cdr.detectChanges on success', () => {
      txService.getBuyerOffers.and.returnValue(of([]));
      component.load();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should call cdr.detectChanges on error', () => {
      txService.getBuyerOffers.and.returnValue(throwError(() => new Error('err')));
      component.load();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should log error on API failure', () => {
      const err = new Error('Network error');
      txService.getBuyerOffers.and.returnValue(throwError(() => err));
      component.load();
      expect(console.error).toHaveBeenCalledWith('Failed to load offers:', err);
    });
  });

  // ── PAGINATION ────────────────────────────────────────────────────────────
  describe('pagination', () => {

    beforeEach(() => {
      component.ngOnInit();
      component.myOffers = Array.from({ length: 12 }, (_, i) =>
        makeOffer({ id: i + 1, propertyId: 100 + i })
      );
    });

    it('totalPages should equal ceil(12 / 5) = 3', () => {
      expect(component.totalPages).toBe(3);
    });

    it('totalPages should be 1 when myOffers is empty (|| 1 fallback)', () => {
      component.myOffers = [];
      expect(component.totalPages).toBe(1);
    });

    it('pagedOffers should return first 5 items on page 1', () => {
      component.currentPage = 1;
      expect(component.pagedOffers.length).toBe(5);
      expect(component.pagedOffers[0].id).toBe(1);
    });

    it('pagedOffers should return items 6–10 on page 2', () => {
      component.currentPage = 2;
      expect(component.pagedOffers.length).toBe(5);
      expect(component.pagedOffers[0].id).toBe(6);
    });

    it('pagedOffers should return remaining 2 items on last page', () => {
      component.currentPage = 3;
      expect(component.pagedOffers.length).toBe(2);
    });

    it('endIndex should be page*pageSize on a full page', () => {
      component.currentPage = 1;
      expect(component.endIndex).toBe(5);
    });

    it('endIndex should be total offers count on last page', () => {
      component.currentPage = 3;
      expect(component.endIndex).toBe(12);
    });

    it('pageNumbers should return [1, 2, 3] for 12 items / 5 per page', () => {
      expect(component.pageNumbers).toEqual([1, 2, 3]);
    });

    it('pageNumbers should return [1] when myOffers is empty', () => {
      component.myOffers = [];
      expect(component.pageNumbers).toEqual([1]);
    });

    it('goToPage should update currentPage and call detectChanges', () => {
      (cdr.detectChanges as jasmine.Spy).calls.reset();
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('goToPage should NOT update when page < 1', () => {
      component.currentPage = 1;
      component.goToPage(0);
      expect(component.currentPage).toBe(1);
    });

    it('goToPage should NOT update when page > totalPages', () => {
      component.currentPage = 1;
      component.goToPage(99);
      expect(component.currentPage).toBe(1);
    });
  });

  // ── GETSTATUSCLASS ────────────────────────────────────────────────────────
  describe('getStatusClass()', () => {

    it('should return ts-approved for APPROVED', () => {
      expect(component.getStatusClass('APPROVED')).toBe('ts-approved');
    });

    it('should be case-insensitive: approved → ts-approved', () => {
      expect(component.getStatusClass('approved')).toBe('ts-approved');
    });

    it('should return ts-rejected for REJECTED', () => {
      expect(component.getStatusClass('REJECTED')).toBe('ts-rejected');
    });

    it('should be case-insensitive: rejected → ts-rejected', () => {
      expect(component.getStatusClass('rejected')).toBe('ts-rejected');
    });

    it('should return ts-pending for PENDING', () => {
      expect(component.getStatusClass('PENDING')).toBe('ts-pending');
    });

    it('should return ts-pending for any unknown status', () => {
      expect(component.getStatusClass('UNKNOWN')).toBe('ts-pending');
    });

    it('should return ts-pending for empty string (falls back to PENDING)', () => {
      expect(component.getStatusClass('')).toBe('ts-pending');
    });

    it('should return ts-pending for null (falls back to PENDING)', () => {
      expect(component.getStatusClass(null as any)).toBe('ts-pending');
    });
  });

  // ── OPEN PAYMENT MODAL ────────────────────────────────────────────────────
  describe('openPaymentModal()', () => {

    const offer = makeOffer({
      id:            10,
      propertyId:    200,
      propertyTitle: 'Luxury Villa',
      offerAmount:   1000000,
      city:          'Mumbai',
      agentId:       7,
    });

    beforeEach(() => {
      component.ngOnInit();
      (cdr.detectChanges as jasmine.Spy).calls.reset();
    });

    it('should set selectedProperty.id to propertyId', () => {
      component.openPaymentModal(offer);
      expect(component.selectedProperty!.id).toBe(200);
    });

    it('should set selectedProperty.title to propertyTitle', () => {
      component.openPaymentModal(offer);
      expect(component.selectedProperty!.title).toBe('Luxury Villa');
    });

    it('should set selectedProperty.price to offerAmount', () => {
      component.openPaymentModal(offer);
      expect(component.selectedProperty!.price).toBe(1000000);
    });

    it('should set selectedProperty.city', () => {
      component.openPaymentModal(offer);
      expect((component.selectedProperty as any).city).toBe('Mumbai');
    });

    it('should set pendingOfferId from offer.id', () => {
      component.openPaymentModal(offer);
      expect(component.pendingOfferId).toBe(10);
    });

    it('should fall back to offerId when id is undefined', () => {
      component.openPaymentModal({ ...offer, id: undefined, offerId: 99 });
      expect(component.pendingOfferId).toBe(99);
    });

    it('should set pendingOfferAmount', () => {
      component.openPaymentModal(offer);
      expect(component.pendingOfferAmount).toBe(1000000);
    });

    it('should set showPaymentModal to true', () => {
      component.openPaymentModal(offer);
      expect(component.showPaymentModal).toBe(true);
    });

    it('should use default title "Property" when propertyTitle is absent', () => {
      component.openPaymentModal({ ...offer, propertyTitle: undefined });
      expect(component.selectedProperty!.title).toBe('Property');
    });

    it('should use empty string for city when city is absent', () => {
      component.openPaymentModal({ ...offer, city: undefined });
      expect((component.selectedProperty as any).city).toBe('');
    });

    it('should default agentId to 0 when agentId is absent', () => {
      component.openPaymentModal({ ...offer, agentId: undefined });
      expect((component.selectedProperty as any).agentId).toBe(0);
    });

    it('should call cdr.detectChanges', () => {
      component.openPaymentModal(offer);
      expect(cdr.detectChanges).toHaveBeenCalled();
    });
  });

  // ── ON PAYMENT CLOSED ─────────────────────────────────────────────────────
  describe('onPaymentClosed()', () => {

    beforeEach(() => {
      component.ngOnInit();
      component.showPaymentModal   = true;
      component.selectedProperty   = { id: 1, title: 'Test', price: 100 } as any;
      component.pendingOfferId     = 10;
      component.pendingOfferAmount = 500000;
    });

    it('should reset showPaymentModal to false', () => {
      component.onPaymentClosed();
      expect(component.showPaymentModal).toBe(false);
    });

    it('should reset selectedProperty to null', () => {
      component.onPaymentClosed();
      expect(component.selectedProperty).toBeNull();
    });

    it('should reset pendingOfferId to null', () => {
      component.onPaymentClosed();
      expect(component.pendingOfferId).toBeNull();
    });

    it('should reset pendingOfferAmount to null', () => {
      component.onPaymentClosed();
      expect(component.pendingOfferAmount).toBeNull();
    });
  });

  // ── ON PAYMENT SUCCESS ────────────────────────────────────────────────────
  describe('onPaymentSuccess()', () => {

    beforeEach(() => {
      component.ngOnInit();
      component.myOffers = [
        makeOffer({ propertyId: 101 }),
        makeOffer({ id: 2, propertyId: 102 }),
      ];
      component.showPaymentModal = true;
      (cdr.detectChanges as jasmine.Spy).calls.reset();
    });

    it('should update matching offer paymentStatus to COMPLETED', () => {
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      expect(component.myOffers.find((x: any) => x.propertyId === 101).paymentStatus).toBe('COMPLETED');
    });

    it('should update matching offer propertyStatus to SOLD', () => {
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      expect(component.myOffers.find((x: any) => x.propertyId === 101).propertyStatus).toBe('SOLD');
    });

    it('should update matching offer status to APPROVED', () => {
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      expect(component.myOffers.find((x: any) => x.propertyId === 101).status).toBe('APPROVED');
    });

    it('should NOT change non-matching offers', () => {
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      const unchanged = component.myOffers.find((x: any) => x.propertyId === 102);
      expect(unchanged.paymentStatus).not.toBe('COMPLETED');
    });

    it('should close the modal after payment success', () => {
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      expect(component.showPaymentModal).toBe(false);
    });

    it('should call cdr.detectChanges', () => {
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should call updatePropertyStatus with the correct propertyId', () => {
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      expect(txService.updatePropertyStatus).toHaveBeenCalledWith(101);
    });

    it('should reload after 2000ms on backend success', fakeAsync(() => {
      txService.updatePropertyStatus.and.returnValue(of({} as any));
      spyOn(component, 'load');
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      tick(2000);
      expect(component.load).toHaveBeenCalled();
    }));

    it('should still reload after 2000ms when backend mark-sold fails', fakeAsync(() => {
      txService.updatePropertyStatus.and.returnValue(throwError(() => new Error('500')));
      spyOn(component, 'load');
      spyOn(console, 'error');
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      tick(2000);
      expect(component.load).toHaveBeenCalled();
    }));

    it('should log error when backend mark-sold fails', fakeAsync(() => {
      const err = new Error('500');
      txService.updatePropertyStatus.and.returnValue(throwError(() => err));
      const consoleSpy = spyOn(console, 'error');
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      tick(2000);
      expect(consoleSpy).toHaveBeenCalledWith('mark-sold failed:', err);
    }));

    it('should NOT reload before 2000ms have elapsed', fakeAsync(() => {
      txService.updatePropertyStatus.and.returnValue(of({} as any));
      spyOn(component, 'load');
      component.onPaymentSuccess({ propertyId: 101, transactionId: 'tx-abc' });
      tick(1999);
      expect(component.load).not.toHaveBeenCalled();
      tick(1); // clean up timer
    }));
  });

  // ── GOTODASHBOARD ─────────────────────────────────────────────────────────
  describe('goToDashboard()', () => {

    it('should navigate to /buyer/dashboard', () => {
      component.ngOnInit();
      component.goToDashboard();
      expect(router.navigate).toHaveBeenCalledWith(['/buyer/dashboard']);
    });
  });
});