import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, throwError, NEVER } from 'rxjs';

import { OfferComponent } from './offer.component';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Property } from 'src/app/core/models/property.model';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeProperty = (overrides: Partial<Property> = {}): Property =>
  ({ id: 1, price: 1_000_000, ...overrides } as Property);

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('OfferComponent', () => {
  let component: OfferComponent;
  let fixture: ComponentFixture<OfferComponent>;
  let txSvc: jasmine.SpyObj<BuyerTransactionService>;
  let authSvc: jasmine.SpyObj<AuthService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    txSvc = jasmine.createSpyObj('BuyerTransactionService', [
      'getBuyerOffers',
      'makeOffer'
    ]);
    authSvc = jasmine.createSpyObj('AuthService', ['getUser']);

    // Default: getBuyerOffers returns empty array so ngOnInit doesn't throw
    txSvc.getBuyerOffers.and.returnValue(of([]) as any);

    await TestBed.configureTestingModule({
      declarations: [OfferComponent],
      imports: [FormsModule],
      providers: [
        { provide: BuyerTransactionService, useValue: txSvc },
        { provide: AuthService, useValue: authSvc }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OfferComponent);
    component = fixture.componentInstance;

    // Replace injected CDR with a spy
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    (component as any).cdr = cdr;

    fixture.detectChanges(); // triggers ngOnInit → loadMyOffers
  });

  // ── Initial state / ngOnInit ───────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should create the component without errors', () => {
      expect(component).toBeTruthy();
    });

    it('should call loadMyOffers (getBuyerOffers) on init', () => {
      expect(txSvc.getBuyerOffers).toHaveBeenCalled();
    });

    it('should populate myOffers with the response on init', () => {
      const offers = [{ id: 1 }, { id: 2 }] as any[];
      txSvc.getBuyerOffers.and.returnValue(of(offers) as any);
      component.ngOnInit();
      expect(component.myOffers).toEqual(offers);
    });

    it('should set myOffers to [] when response is null', () => {
      txSvc.getBuyerOffers.and.returnValue(of(null as any));
      component.ngOnInit();
      expect(component.myOffers).toEqual([]);
    });

    it('should call cdr.detectChanges during initial loadMyOffers', () => {
      cdr.detectChanges.calls.reset();
      txSvc.getBuyerOffers.and.returnValue(of([]) as any);
      component.ngOnInit();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should initialise isSubmitting to false', () => {
      expect(component.isSubmitting).toBeFalse();
    });

    it('should initialise isSuccess to false', () => {
      expect(component.isSuccess).toBeFalse();
    });

    it('should initialise errorMsg to empty string', () => {
      expect(component.errorMsg).toBe('');
    });

    it('should initialise suggestions to empty array', () => {
      expect(component.suggestions).toEqual([]);
    });
  });

  // ── ngOnChanges ───────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should reset all fields and build 3 suggestions when property has a price', () => {
      component.offerAmount  = 500;
      component.message      = 'hi';
      component.errorMsg     = 'err';
      component.isSuccess    = true;
      component.isSubmitting = true;

      component.property = makeProperty({ price: 1_000_000 });
      component.ngOnChanges();

      expect(component.offerAmount).toBeNull();
      expect(component.message).toBe('');
      expect(component.errorMsg).toBe('');
      expect(component.isSuccess).toBeFalse();
      expect(component.isSubmitting).toBeFalse();
      expect(component.suggestions).toEqual([900_000, 950_000, 1_000_000]);
    });

    it('should compute suggestions as 90%, 95%, 100% of the listing price', () => {
      component.property = makeProperty({ price: 2_000_000 });
      component.ngOnChanges();
      expect(component.suggestions).toEqual([1_800_000, 1_900_000, 2_000_000]);
    });

    it('should round suggestion values (Math.round)', () => {
      // price = 333 → 90% = 299.7 → 300; 95% = 316.35 → 316; 100% = 333
      component.property = makeProperty({ price: 333 });
      component.ngOnChanges();
      expect(component.suggestions).toEqual([300, 316, 333]);
    });

    it('should set suggestions to [] when price is 0', () => {
      component.property = makeProperty({ price: 0 });
      component.ngOnChanges();
      expect(component.suggestions).toEqual([]);
    });

    it('should set suggestions to [] when price is undefined/falsy', () => {
      component.property = makeProperty({ price: undefined as any });
      component.ngOnChanges();
      expect(component.suggestions).toEqual([]);
    });

    it('should do nothing (not throw) when property is null', () => {
      component.property = null;
      expect(() => component.ngOnChanges()).not.toThrow();
    });

    it('should NOT change suggestions when property is null', () => {
      component.suggestions = [1, 2, 3];
      component.property = null;
      component.ngOnChanges();
      expect(component.suggestions).toEqual([1, 2, 3]); // unchanged
    });
  });

  // ── diffPct getter ────────────────────────────────────────────────────────

  describe('diffPct getter', () => {
    it('should return 0 when offerAmount is null', () => {
      component.offerAmount = null;
      component.property    = makeProperty({ price: 1_000_000 });
      expect(component.diffPct).toBe(0);
    });

    it('should return 0 when offerAmount is 0 (falsy)', () => {
      component.offerAmount = 0;
      component.property    = makeProperty({ price: 1_000_000 });
      expect(component.diffPct).toBe(0);
    });

    it('should return 0 when property is null', () => {
      component.offerAmount = 900_000;
      component.property    = null;
      expect(component.diffPct).toBe(0);
    });

    it('should return 0 when property.price is 0', () => {
      component.offerAmount = 900_000;
      component.property    = makeProperty({ price: 0 });
      expect(component.diffPct).toBe(0);
    });

    it('should return a negative % when offer is below listing price', () => {
      component.offerAmount = 900_000;
      component.property    = makeProperty({ price: 1_000_000 });
      expect(component.diffPct).toBe(-10);
    });

    it('should return 0 when offer equals listing price', () => {
      component.offerAmount = 1_000_000;
      component.property    = makeProperty({ price: 1_000_000 });
      expect(component.diffPct).toBe(0);
    });

    it('should return a positive % when offer is above listing price', () => {
      component.offerAmount = 1_100_000;
      component.property    = makeProperty({ price: 1_000_000 });
      expect(component.diffPct).toBe(10);
    });

    it('should round the result (Math.round)', () => {
      // 1_005_000 / 1_000_000 - 1 = 0.005 → 0.5% → rounds to 1
      component.offerAmount = 1_005_000;
      component.property    = makeProperty({ price: 1_000_000 });
      expect(component.diffPct).toBe(1);
    });
  });

  // ── diffAbove getter ──────────────────────────────────────────────────────

  describe('diffAbove getter', () => {
    it('should be true when diffPct is 0 (offer equals price)', () => {
      component.offerAmount = 1_000_000;
      component.property    = makeProperty({ price: 1_000_000 });
      expect(component.diffAbove).toBeTrue();
    });

    it('should be true when diffPct is positive (offer above price)', () => {
      component.offerAmount = 1_100_000;
      component.property    = makeProperty({ price: 1_000_000 });
      expect(component.diffAbove).toBeTrue();
    });

    it('should be false when diffPct is negative (offer below price)', () => {
      component.offerAmount = 900_000;
      component.property    = makeProperty({ price: 1_000_000 });
      expect(component.diffAbove).toBeFalse();
    });
  });

  // ── setSuggestion ─────────────────────────────────────────────────────────

  describe('setSuggestion', () => {
    it('should set offerAmount to the given value', () => {
      component.setSuggestion(950_000);
      expect(component.offerAmount).toBe(950_000);
    });

    it('should overwrite any prior offerAmount', () => {
      component.offerAmount = 800_000;
      component.setSuggestion(1_000_000);
      expect(component.offerAmount).toBe(1_000_000);
    });
  });

  // ── close ─────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('should emit the closed event', () => {
      const spy = spyOn(component.closed, 'emit');
      component.close();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── proceedToPayment ──────────────────────────────────────────────────────

  describe('proceedToPayment', () => {
    it('should emit the closed event', () => {
      const spy = spyOn(component.closed, 'emit');
      component.proceedToPayment();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── loadMyOffers ──────────────────────────────────────────────────────────

  describe('loadMyOffers', () => {
    it('should update myOffers and call detectChanges on success', () => {
      const offers = [{ id: 10 }] as any[];
      txSvc.getBuyerOffers.and.returnValue(of(offers) as any);
      component.loadMyOffers();
      expect(component.myOffers).toEqual(offers);
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should default myOffers to [] when response is null', () => {
      txSvc.getBuyerOffers.and.returnValue(of(null as any));
      component.loadMyOffers();
      expect(component.myOffers).toEqual([]);
    });

    it('should log the error to console.error on failure', () => {
      const consoleSpy = spyOn(console, 'error');
      txSvc.getBuyerOffers.and.returnValue(throwError(() => new Error('fail')));
      component.loadMyOffers();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should NOT call cdr.detectChanges when getBuyerOffers errors', () => {
      spyOn(console, 'error');
      txSvc.getBuyerOffers.and.returnValue(throwError(() => new Error('fail')));
      cdr.detectChanges.calls.reset();
      component.loadMyOffers();
      expect(cdr.detectChanges).not.toHaveBeenCalled();
    });

    it('should replace any prior myOffers with fresh data', () => {
      component.myOffers = [{ id: 1 }] as any[];
      txSvc.getBuyerOffers.and.returnValue(of([{ id: 2 }, { id: 3 }]) as any);
      component.loadMyOffers();
      expect(component.myOffers).toEqual([{ id: 2 }, { id: 3 }] as any[]);
    });
  });

  // ── submit – guard clauses ────────────────────────────────────────────────

  describe('submit – validation guards', () => {
    it('should set errorMsg and not call makeOffer when property is null', () => {
      component.property    = null;
      component.offerAmount = 500_000;
      component.submit();
      expect(component.errorMsg).toBe('Please enter a valid offer amount.');
      expect(txSvc.makeOffer).not.toHaveBeenCalled();
    });

    it('should set errorMsg when offerAmount is null', () => {
      component.property    = makeProperty();
      component.offerAmount = null;
      component.submit();
      expect(component.errorMsg).toBe('Please enter a valid offer amount.');
      expect(txSvc.makeOffer).not.toHaveBeenCalled();
    });

    it('should set errorMsg when offerAmount is 0', () => {
      component.property    = makeProperty();
      component.offerAmount = 0;
      component.submit();
      expect(component.errorMsg).toBe('Please enter a valid offer amount.');
      expect(txSvc.makeOffer).not.toHaveBeenCalled();
    });

    it('should set errorMsg when offerAmount is negative', () => {
      component.property    = makeProperty();
      component.offerAmount = -1;
      component.submit();
      expect(component.errorMsg).toBe('Please enter a valid offer amount.');
      expect(txSvc.makeOffer).not.toHaveBeenCalled();
    });

    it('should set errorMsg when property.id is 0 (falsy)', () => {
      component.property    = makeProperty({ id: 0 as any });
      component.offerAmount = 500_000;
      component.submit();
      expect(component.errorMsg).toBe('Please enter a valid offer amount.');
      expect(txSvc.makeOffer).not.toHaveBeenCalled();
    });

    it('should not reach isSubmitting=true when validation fails', () => {
      component.property    = null;
      component.offerAmount = 500_000;
      component.submit();
      expect(component.isSubmitting).toBeFalse();
    });
  });

  // ── submit – intermediate state ───────────────────────────────────────────

  describe('submit – intermediate state before HTTP response', () => {
    it('should set isSubmitting=true and clear errorMsg before the HTTP call', () => {
      component.property    = makeProperty();
      component.offerAmount = 950_000;
      component.errorMsg    = 'old error';

      // Never-resolving observable lets us inspect state before subscribe fires
      txSvc.makeOffer.and.returnValue(NEVER as any);

      component.submit();

      expect(component.isSubmitting).toBeTrue();
      expect(component.errorMsg).toBe('');
    });
  });

  // ── submit – success path ─────────────────────────────────────────────────

  describe('submit – success', () => {
    beforeEach(() => {
      component.property    = makeProperty();
      component.offerAmount = 950_000;
    });

    it('should call makeOffer with the correct payload', () => {
      txSvc.makeOffer.and.returnValue(of({ id: 1 }) as any);
      component.message = 'Interested!';
      component.submit();
      expect(txSvc.makeOffer).toHaveBeenCalledWith({
        propertyId:  1,
        offerAmount: 950_000,
        message:     'Interested!'
      });
    });

    it('should emit offerMade with res.id when present', () => {
      txSvc.makeOffer.and.returnValue(of({ id: 42 }) as any);
      const spy = spyOn(component.offerMade, 'emit');
      component.submit();
      expect(spy).toHaveBeenCalledWith({ offerId: 42, offerAmount: 950_000 });
    });

    it('should emit offerMade with res.offerId when res.id is absent', () => {
      txSvc.makeOffer.and.returnValue(of({ offerId: 99 }) as any);
      const spy = spyOn(component.offerMade, 'emit');
      component.submit();
      expect(spy).toHaveBeenCalledWith({ offerId: 99, offerAmount: 950_000 });
    });

    it('should default offerId to 0 when both res.id and res.offerId are absent', () => {
      txSvc.makeOffer.and.returnValue(of({}) as any);
      const spy = spyOn(component.offerMade, 'emit');
      component.submit();
      expect(spy).toHaveBeenCalledWith({ offerId: 0, offerAmount: 950_000 });
    });

    it('should set isSuccess to true and clear isSubmitting', () => {
      txSvc.makeOffer.and.returnValue(of({ id: 1 }) as any);
      component.submit();
      expect(component.isSuccess).toBeTrue();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should refresh offers by calling getBuyerOffers after success', () => {
      txSvc.makeOffer.and.returnValue(of({ id: 1 }) as any);
      txSvc.getBuyerOffers.and.returnValue(of([{ id: 77 }]) as any);
      component.submit();
      expect(txSvc.getBuyerOffers).toHaveBeenCalled();
    });

    it('should call cdr.detectChanges after success', () => {
      txSvc.makeOffer.and.returnValue(of({ id: 1 }) as any);
      txSvc.getBuyerOffers.and.returnValue(of([]) as any);
      cdr.detectChanges.calls.reset();
      component.submit();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should handle a null response without throwing', () => {
      txSvc.makeOffer.and.returnValue(of(null) as any);
      const spy = spyOn(component.offerMade, 'emit');
      expect(() => component.submit()).not.toThrow();
      expect(spy).toHaveBeenCalledWith({ offerId: 0, offerAmount: 950_000 });
    });
  });

  // ── submit – error path ───────────────────────────────────────────────────

  describe('submit – error', () => {
    beforeEach(() => {
      component.property    = makeProperty();
      component.offerAmount = 950_000;
    });

    it('should use err.error.message when available', () => {
      txSvc.makeOffer.and.returnValue(
        throwError(() => ({ error: { message: 'Offer rejected' } }))
      );
      component.submit();
      expect(component.errorMsg).toBe('Offer rejected');
    });

    it('should fall back to err.error.title when message is absent', () => {
      txSvc.makeOffer.and.returnValue(
        throwError(() => ({ error: { title: 'Bad Request' } }))
      );
      component.submit();
      expect(component.errorMsg).toBe('Bad Request');
    });

    it('should use generic message when both message and title are absent', () => {
      txSvc.makeOffer.and.returnValue(throwError(() => ({ error: {} })));
      component.submit();
      expect(component.errorMsg).toBe('Failed to submit offer. Please try again.');
    });

    it('should use generic message when err.error is absent', () => {
      txSvc.makeOffer.and.returnValue(throwError(() => ({})));
      component.submit();
      expect(component.errorMsg).toBe('Failed to submit offer. Please try again.');
    });

    it('should clear isSubmitting on error', () => {
      txSvc.makeOffer.and.returnValue(throwError(() => ({})));
      component.submit();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should call cdr.detectChanges on error', () => {
      txSvc.makeOffer.and.returnValue(throwError(() => ({})));
      cdr.detectChanges.calls.reset();
      component.submit();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should NOT set isSuccess to true on error', () => {
      txSvc.makeOffer.and.returnValue(throwError(() => ({})));
      component.submit();
      expect(component.isSuccess).toBeFalse();
    });

    it('should NOT emit offerMade on error', () => {
      txSvc.makeOffer.and.returnValue(throwError(() => ({})));
      const spy = spyOn(component.offerMade, 'emit');
      component.submit();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── formatPrice ───────────────────────────────────────────────────────────

  describe('formatPrice', () => {
    it('should format 10 lakh as Indian rupee string', () => {
      const result = component.formatPrice(1_000_000);
      expect(result).toContain('10,00,000');
    });

    it('should format 0 correctly', () => {
      const result = component.formatPrice(0);
      expect(result).toContain('0');
    });

    it('should include the INR currency symbol (₹)', () => {
      const result = component.formatPrice(1_000);
      expect(result).toMatch(/[₹\u20B9]|INR/);
    });

    it('should have no decimal places (maximumFractionDigits: 0)', () => {
      const result = component.formatPrice(1234.99);
      expect(result).not.toContain('.');
    });

    it('should format 1 crore using Indian numbering', () => {
      const result = component.formatPrice(10_000_000);
      expect(result).toContain('1,00,00,000');
    });
  });
});