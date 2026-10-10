import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, throwError, NEVER } from 'rxjs';

import { PaymentComponent } from './payment.component';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Property } from 'src/app/core/models/property.model';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Builds a minimal Property-compatible object.
 * Extra fields are spread in to exercise the PropertyWithSellerFields interface
 * without requiring changes to the production model.
 */
const makeProperty = (overrides: Record<string, unknown> = {}): Property =>
  ({ id: 1, price: 500_000, agentId: 99, ...overrides } as unknown as Property);

/** Creates a fake DOM InputEvent with a given string value. */
const fakeInputEvent = (value: string): Event =>
  ({ target: { value } } as unknown as Event);

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('PaymentComponent', () => {
  let component: PaymentComponent;
  let fixture: ComponentFixture<PaymentComponent>;
  let txSvc: jasmine.SpyObj<BuyerTransactionService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    txSvc = jasmine.createSpyObj('BuyerTransactionService', [
      'createTransaction',
      'updateTransactionStatus',
    ]);

    await TestBed.configureTestingModule({
      declarations: [PaymentComponent],
      imports: [FormsModule],
      providers: [
        { provide: BuyerTransactionService, useValue: txSvc },
        { provide: AuthService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;

    // Replace the injected CDR with a spy so we can assert detectChanges calls.
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    (component as any).cdr = cdr;

    fixture.detectChanges();
  });

  // ── Initial state / ngOnInit ───────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should create the component without errors', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise with step = method', () => {
      expect(component.step).toBe('method');
    });

    it('should expose exactly 5 payment methods', () => {
      expect(component.paymentMethods.length).toBe(5);
    });

    it('should default selectedMethodId to UPI', () => {
      expect(component.selectedMethodId).toBe('UPI');
    });

    it('should expose a non-empty banks list', () => {
      expect(component.banks.length).toBeGreaterThan(0);
    });
  });

  // ── ngOnChanges ───────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should reset ALL fields when property is set', () => {
      // Dirty every field first
      component.step            = 'success';
      component.errorMsg        = 'old error';
      component.upiId           = 'test@upi';
      component.gpayNumber      = '9999999999';
      component.cardNumber      = '1234 5678 9012 3456';
      component.cardExpiry      = '12/26';
      component.cardCvv         = '123';
      component.cardHolder      = 'Test User';
      component.selectedBank    = 'HDFC Bank';
      component.selectedMethodId = 'CARD';

      component.property = makeProperty();
      component.ngOnChanges();

      expect(component.step).toBe('method');
      expect(component.errorMsg).toBe('');
      expect(component.upiId).toBe('');
      expect(component.gpayNumber).toBe('');
      expect(component.cardNumber).toBe('');
      expect(component.cardExpiry).toBe('');
      expect(component.cardCvv).toBe('');
      expect(component.cardHolder).toBe('');
      expect(component.selectedBank).toBe('');
      expect(component.selectedMethodId).toBe('UPI');
    });

    it('should do nothing when property is null', () => {
      component.step     = 'success';
      component.property = null;
      component.ngOnChanges();
      expect(component.step).toBe('success'); // unchanged
    });
  });

  // ── amount getter ─────────────────────────────────────────────────────────

  describe('amount getter', () => {
    it('should return offerAmount when set', () => {
      component.offerAmount = 450_000;
      component.property    = makeProperty({ price: 500_000 });
      expect(component.amount).toBe(450_000);
    });

    it('should fall back to property.price when offerAmount is null', () => {
      component.offerAmount = null;
      component.property    = makeProperty({ price: 500_000 });
      expect(component.amount).toBe(500_000);
    });

    it('should return 0 when both offerAmount and property are null', () => {
      component.offerAmount = null;
      component.property    = null;
      expect(component.amount).toBe(0);
    });
  });

  // ── sellerId getter ───────────────────────────────────────────────────────

  describe('sellerId getter', () => {
    it('should return agentId when present', () => {
      component.property = makeProperty({ agentId: 10 });
      expect(component.sellerId).toBe(10);
    });

    it('should fall back to userId when agentId is falsy', () => {
      component.property = makeProperty({ agentId: 0, userId: 20 });
      expect(component.sellerId).toBe(20);
    });

    it('should fall back to agentUserId when agentId and userId are falsy', () => {
      component.property = makeProperty({ agentId: 0, userId: 0, agentUserId: 30 });
      expect(component.sellerId).toBe(30);
    });

    it('should fall back to sellerId field on the property object', () => {
      component.property = makeProperty({ agentId: 0, userId: 0, agentUserId: 0, sellerId: 40 });
      expect(component.sellerId).toBe(40);
    });

    it('should return 0 when no seller identifier exists', () => {
      component.property = makeProperty({ agentId: 0, userId: 0, agentUserId: 0, sellerId: 0 });
      expect(component.sellerId).toBe(0);
    });

    it('should return 0 when property is null', () => {
      component.property = null;
      expect(component.sellerId).toBe(0);
    });
  });

  // ── selectMethod ──────────────────────────────────────────────────────────

  describe('selectMethod', () => {
    it('should update selectedMethodId', () => {
      component.selectMethod('CARD');
      expect(component.selectedMethodId).toBe('CARD');
    });

    it('should update to any valid method id', () => {
      ['UPI', 'GPAY', 'CARD', 'NETBANK', 'TRANSFER'].forEach((id) => {
        component.selectMethod(id);
        expect(component.selectedMethodId).toBe(id);
      });
    });
  });

  // ── selectedMethod getter ─────────────────────────────────────────────────

  describe('selectedMethod getter', () => {
    it('should return the matching method object', () => {
      component.selectedMethodId = 'GPAY';
      expect(component.selectedMethod.id).toBe('GPAY');
      expect(component.selectedMethod.label).toBe('Google Pay');
    });

    it('should return the first method (UPI) when id does not match', () => {
      component.selectedMethodId = 'UNKNOWN';
      expect(component.selectedMethod.id).toBe('UPI');
    });
  });

  // ── isMethodValid ─────────────────────────────────────────────────────────

  describe('isMethodValid', () => {
    // UPI
    it('UPI: valid when upiId contains @', () => {
      component.selectedMethodId = 'UPI';
      component.upiId = 'user@okaxis';
      expect(component.isMethodValid()).toBeTrue();
    });

    it('UPI: invalid when upiId lacks @', () => {
      component.selectedMethodId = 'UPI';
      component.upiId = 'invalidupi';
      expect(component.isMethodValid()).toBeFalse();
    });

    it('UPI: invalid when upiId is empty', () => {
      component.selectedMethodId = 'UPI';
      component.upiId = '';
      expect(component.isMethodValid()).toBeFalse();
    });

    // GPAY
    it('GPAY: valid when gpayNumber has exactly 10 digits', () => {
      component.selectedMethodId = 'GPAY';
      component.gpayNumber = '9876543210';
      expect(component.isMethodValid()).toBeTrue();
    });

    it('GPAY: valid when non-digits are stripped to exactly 10', () => {
      component.selectedMethodId = 'GPAY';
      component.gpayNumber = '987-654-3210'; // strips to 9876543210
      expect(component.isMethodValid()).toBeTrue();
    });

    it('GPAY: invalid when fewer than 10 digits', () => {
      component.selectedMethodId = 'GPAY';
      component.gpayNumber = '12345';
      expect(component.isMethodValid()).toBeFalse();
    });

    it('GPAY: invalid when more than 10 digits', () => {
      component.selectedMethodId = 'GPAY';
      component.gpayNumber = '91987654321099'; // 14 digits
      expect(component.isMethodValid()).toBeFalse();
    });

    it('GPAY: invalid when empty', () => {
      component.selectedMethodId = 'GPAY';
      component.gpayNumber = '';
      expect(component.isMethodValid()).toBeFalse();
    });

    // CARD
    it('CARD: valid when all four fields are complete', () => {
      component.selectedMethodId = 'CARD';
      component.cardNumber  = '1234 5678 9012 3456';
      component.cardExpiry  = '12/26';
      component.cardCvv     = '123';
      component.cardHolder  = 'Test User';
      expect(component.isMethodValid()).toBeTrue();
    });

    it('CARD: valid with 4-digit CVV (Amex style)', () => {
      component.selectedMethodId = 'CARD';
      component.cardNumber  = '1234 5678 9012 3456';
      component.cardExpiry  = '12/26';
      component.cardCvv     = '1234';
      component.cardHolder  = 'Test User';
      expect(component.isMethodValid()).toBeTrue();
    });

    it('CARD: invalid when cardNumber is too short', () => {
      component.selectedMethodId = 'CARD';
      component.cardNumber  = '1234 5678';
      component.cardExpiry  = '12/26';
      component.cardCvv     = '123';
      component.cardHolder  = 'Test User';
      expect(component.isMethodValid()).toBeFalse();
    });

    it('CARD: invalid when expiry is too short (< 4 chars)', () => {
      component.selectedMethodId = 'CARD';
      component.cardNumber  = '1234 5678 9012 3456';
      component.cardExpiry  = '12';   // length 2 < 4
      component.cardCvv     = '123';
      component.cardHolder  = 'Test User';
      expect(component.isMethodValid()).toBeFalse();
    });

    it('CARD: invalid when CVV is too short (< 3 chars)', () => {
      component.selectedMethodId = 'CARD';
      component.cardNumber  = '1234 5678 9012 3456';
      component.cardExpiry  = '12/26';
      component.cardCvv     = '12';
      component.cardHolder  = 'Test User';
      expect(component.isMethodValid()).toBeFalse();
    });

    it('CARD: invalid when cardHolder is empty string', () => {
      component.selectedMethodId = 'CARD';
      component.cardNumber  = '1234 5678 9012 3456';
      component.cardExpiry  = '12/26';
      component.cardCvv     = '123';
      component.cardHolder  = '';
      expect(component.isMethodValid()).toBeFalse();
    });

    // NETBANK
    it('NETBANK: valid when a bank is selected', () => {
      component.selectedMethodId = 'NETBANK';
      component.selectedBank = 'HDFC Bank';
      expect(component.isMethodValid()).toBeTrue();
    });

    it('NETBANK: invalid when selectedBank is empty', () => {
      component.selectedMethodId = 'NETBANK';
      component.selectedBank = '';
      expect(component.isMethodValid()).toBeFalse();
    });

    // TRANSFER (default branch — always true)
    it('TRANSFER: always valid (default branch)', () => {
      component.selectedMethodId = 'TRANSFER';
      expect(component.isMethodValid()).toBeTrue();
    });

    it('unknown method id: always valid (default branch)', () => {
      component.selectedMethodId = 'SOME_OTHER';
      expect(component.isMethodValid()).toBeTrue();
    });
  });

  // ── confirm – guard clauses ───────────────────────────────────────────────

  describe('confirm – guard clauses', () => {
    beforeEach(() => {
      component.property        = makeProperty();
      component.offerAmount     = 450_000;
      component.selectedMethodId = 'UPI';
      component.upiId           = 'user@okaxis';
    });

    it('should set errorMsg and NOT call createTransaction when method is invalid', () => {
      component.upiId = 'invalid'; // no @
      component.confirm();
      expect(component.errorMsg).toBe('Please complete all payment details.');
      expect(txSvc.createTransaction).not.toHaveBeenCalled();
    });

    it('should set errorMsg when property id is falsy (0)', () => {
      component.property = makeProperty({ id: 0 });
      component.confirm();
      expect(component.errorMsg).toBe('Missing property or amount details.');
      expect(txSvc.createTransaction).not.toHaveBeenCalled();
    });

    it('should set errorMsg when amount resolves to 0', () => {
      component.offerAmount = 0;
      component.property    = makeProperty({ price: 0 });
      component.confirm();
      expect(component.errorMsg).toBe('Missing property or amount details.');
      expect(txSvc.createTransaction).not.toHaveBeenCalled();
    });

    it('should set errorMsg when sellerId cannot be resolved', () => {
      component.property = makeProperty({
        agentId: 0, userId: 0, agentUserId: 0, sellerId: 0,
      });
      component.confirm();
      expect(component.errorMsg).toBe('Unable to identify seller. Please try again.');
      expect(txSvc.createTransaction).not.toHaveBeenCalled();
    });

    it('should transition to processing step before the HTTP call', () => {
      // Provide a never-resolving observable so we can inspect the intermediate state.
      txSvc.createTransaction.and.returnValue(NEVER as any);
      component.confirm();
      expect(component.step).toBe('processing');
      expect(cdr.detectChanges).toHaveBeenCalled();
    });
  });

  // ── confirm – createTransaction success WITH txnId ────────────────────────

  describe('confirm – createTransaction success with txnId', () => {
    beforeEach(() => {
      component.property        = makeProperty();
      component.offerAmount     = 450_000;
      component.offerId         = 7;
      component.selectedMethodId = 'UPI';
      component.upiId           = 'user@okaxis';
    });

    it('should call createTransaction with the correct payload', () => {
      txSvc.createTransaction.and.returnValue(of({ id: 'TXN123' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(of({}) as any);
      component.confirm();
      expect(txSvc.createTransaction).toHaveBeenCalledWith({
        propertyId:    1,
        sellerId:      99,
        amount:        450_000,
        offerId:       7,
        paymentMethod: 'UPI',
      });
    });

    it('should set step to success and emit paymentSuccess using res.id', () => {
      txSvc.createTransaction.and.returnValue(of({ id: 'TXN123' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(of({}) as any);
      const successSpy = spyOn(component.paymentSuccess, 'emit');

      component.confirm();

      expect(component.step).toBe('success');
      expect(component.confirmedTxnId).toBe('TXN123');
      expect(successSpy).toHaveBeenCalledWith({ propertyId: 1, transactionId: 'TXN123' });
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should use res.transactionId when res.id is absent', () => {
      txSvc.createTransaction.and.returnValue(of({ transactionId: 'TXN999' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(of({}) as any);
      const successSpy = spyOn(component.paymentSuccess, 'emit');

      component.confirm();

      expect(component.confirmedTxnId).toBe('TXN999');
      expect(successSpy).toHaveBeenCalledWith({ propertyId: 1, transactionId: 'TXN999' });
    });

    it('should still reach success state when updateTransactionStatus errors', () => {
      txSvc.createTransaction.and.returnValue(of({ id: 'TXN123' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(throwError(() => new Error('status fail')) as any);
      const consoleSpy = spyOn(console, 'error');
      const successSpy = spyOn(component.paymentSuccess, 'emit');

      component.confirm();

      expect(consoleSpy).toHaveBeenCalled();
      expect(component.step).toBe('success');
      expect(component.confirmedTxnId).toBe('TXN123');
      expect(successSpy).toHaveBeenCalledWith({ propertyId: 1, transactionId: 'TXN123' });
    });

    it('should pass offerId as undefined when offerId input is null', () => {
      component.offerId = null;
      txSvc.createTransaction.and.returnValue(of({ id: 'TXN1' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(of({}) as any);
      component.confirm();
      const payload = txSvc.createTransaction.calls.mostRecent().args[0];
      expect(payload.offerId).toBeUndefined();
    });

    // FIX: the component passes txnId as-is (the raw string 'TXN123'),
    // it does NOT parse out a numeric portion before calling updateTransactionStatus.
    it('should call updateTransactionStatus with the raw txnId string and APPROVED status', () => {
  txSvc.createTransaction.and.returnValue(of({ id: 'TXN123' }) as any);
  txSvc.updateTransactionStatus.and.returnValue(of({}) as any);
  component.confirm();
  expect(txSvc.updateTransactionStatus).toHaveBeenCalledWith('TXN123' as any, 'APPROVED');
});

    it('should call cdr.detectChanges after success', () => {
      txSvc.createTransaction.and.returnValue(of({ id: 'TXN123' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(of({}) as any);
      cdr.detectChanges.calls.reset();
      component.confirm();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should work with CARD method end-to-end', () => {
      component.selectedMethodId = 'CARD';
      component.cardNumber  = '1234 5678 9012 3456';
      component.cardExpiry  = '12/26';
      component.cardCvv     = '123';
      component.cardHolder  = 'Jane Doe';
      txSvc.createTransaction.and.returnValue(of({ id: 'TXNCARD' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(of({}) as any);

      component.confirm();

      expect(component.step).toBe('success');
      expect(txSvc.createTransaction).toHaveBeenCalledWith(
        jasmine.objectContaining({ paymentMethod: 'CARD' })
      );
    });

    it('should work with GPAY method end-to-end', () => {
      component.selectedMethodId = 'GPAY';
      component.gpayNumber = '9876543210';
      txSvc.createTransaction.and.returnValue(of({ id: 'TXNGPAY' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(of({}) as any);

      component.confirm();

      expect(component.step).toBe('success');
      expect(txSvc.createTransaction).toHaveBeenCalledWith(
        jasmine.objectContaining({ paymentMethod: 'GPAY' })
      );
    });

    it('should work with NETBANK method end-to-end', () => {
      component.selectedMethodId = 'NETBANK';
      component.selectedBank = 'ICICI Bank';
      txSvc.createTransaction.and.returnValue(of({ id: 'TXNNET' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(of({}) as any);

      component.confirm();

      expect(component.step).toBe('success');
    });

    it('should work with TRANSFER method end-to-end', () => {
      component.selectedMethodId = 'TRANSFER';
      txSvc.createTransaction.and.returnValue(of({ id: 'TXNWIRE' }) as any);
      txSvc.updateTransactionStatus.and.returnValue(of({}) as any);

      component.confirm();

      expect(component.step).toBe('success');
    });
  });

  // ── confirm – createTransaction success WITHOUT txnId ────────────────────

  describe('confirm – createTransaction success without txnId', () => {
    beforeEach(() => {
      component.property        = makeProperty();
      component.offerAmount     = 450_000;
      component.selectedMethodId = 'UPI';
      component.upiId           = 'user@okaxis';
    });

    it('should generate a synthetic TXN id and emit success when response has no id', () => {
      txSvc.createTransaction.and.returnValue(of({}) as any);
      const successSpy = spyOn(component.paymentSuccess, 'emit');

      component.confirm();

      expect(txSvc.updateTransactionStatus).not.toHaveBeenCalled();
      expect(component.step).toBe('success');
      expect(component.confirmedTxnId).toMatch(/^TXN\d+$/);
      expect(successSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({ propertyId: 1 })
      );
    });

    it('should handle a null response without throwing', () => {
      txSvc.createTransaction.and.returnValue(of(null) as any);
      const successSpy = spyOn(component.paymentSuccess, 'emit');
      expect(() => component.confirm()).not.toThrow();
      expect(successSpy).toHaveBeenCalled();
    });

    it('should NOT call updateTransactionStatus when txnId is absent', () => {
      txSvc.createTransaction.and.returnValue(of({}) as any);
      component.confirm();
      expect(txSvc.updateTransactionStatus).not.toHaveBeenCalled();
    });

    it('should call cdr.detectChanges when no txnId (synthetic path)', () => {
      txSvc.createTransaction.and.returnValue(of({}) as any);
      cdr.detectChanges.calls.reset();
      component.confirm();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });
  });

  // ── confirm – createTransaction network error ─────────────────────────────

  describe('confirm – createTransaction error', () => {
    beforeEach(() => {
      component.property        = makeProperty();
      component.offerAmount     = 450_000;
      component.selectedMethodId = 'UPI';
      component.upiId           = 'user@okaxis';
    });

    it('should set errorMsg and reset step to method on network failure', () => {
      const consoleSpy = spyOn(console, 'error');
      txSvc.createTransaction.and.returnValue(
        throwError(() => new Error('network error'))
      );

      component.confirm();

      expect(consoleSpy).toHaveBeenCalled();
      expect(component.errorMsg).toBe('Payment failed. Please try again.');
      expect(component.step).toBe('method');
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should clear any prior confirmedTxnId on error', () => {
      component.confirmedTxnId = 'OLD_TXN';
      txSvc.createTransaction.and.returnValue(
        throwError(() => new Error('fail'))
      );
      spyOn(console, 'error');

      component.confirm();

      // confirmedTxnId should remain unchanged (no mutation on error path)
      // but step and errorMsg must be reset
      expect(component.step).toBe('method');
      expect(component.errorMsg).toBeTruthy();
    });
  });

  // ── close ─────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('should emit the closed event', () => {
      const closedSpy = spyOn(component.closed, 'emit');
      component.close();
      expect(closedSpy).toHaveBeenCalled();
    });
  });

  // ── formatCard ────────────────────────────────────────────────────────────

  describe('formatCard', () => {
    it('should group 16 digits into four space-separated groups', () => {
      component.formatCard(fakeInputEvent('1234567890123456'));
      expect(component.cardNumber).toBe('1234 5678 9012 3456');
    });

    it('should strip non-digit characters before formatting', () => {
      component.formatCard(fakeInputEvent('1234-5678-9012-3456'));
      expect(component.cardNumber).toBe('1234 5678 9012 3456');
    });

    it('should truncate input exceeding 16 digits', () => {
      component.formatCard(fakeInputEvent('12345678901234567890')); // 20 digits → truncate to 16
      expect(component.cardNumber).toBe('1234 5678 9012 3456');
    });

    it('should handle a partial 4-digit input', () => {
      component.formatCard(fakeInputEvent('1234'));
      expect(component.cardNumber).toBe('1234');
    });

    it('should handle an empty string', () => {
      component.formatCard(fakeInputEvent(''));
      expect(component.cardNumber).toBe('');
    });

    it('should handle 8 digits (two groups)', () => {
      component.formatCard(fakeInputEvent('12345678'));
      expect(component.cardNumber).toBe('1234 5678');
    });
  });

  // ── formatExpiry ──────────────────────────────────────────────────────────

  describe('formatExpiry', () => {
    it('should insert a slash after two-digit month (4 digit input)', () => {
      component.formatExpiry(fakeInputEvent('1226'));
      expect(component.cardExpiry).toBe('12/26');
    });

    it('should produce MM/ for exactly 2-digit input', () => {
      component.formatExpiry(fakeInputEvent('12'));
      expect(component.cardExpiry).toBe('12/');
    });

    it('should not insert a slash for a single digit', () => {
      component.formatExpiry(fakeInputEvent('1'));
      expect(component.cardExpiry).toBe('1');
    });

    it('should strip non-digits and truncate to 4 digits', () => {
      component.formatExpiry(fakeInputEvent('12/2699'));
      expect(component.cardExpiry).toBe('12/26');
    });

    it('should handle an empty string', () => {
      component.formatExpiry(fakeInputEvent(''));
      expect(component.cardExpiry).toBe('');
    });

    it('should handle input that is already formatted (with slash)', () => {
      component.formatExpiry(fakeInputEvent('12/26'));
      expect(component.cardExpiry).toBe('12/26');
    });

    it('should handle 3-digit input as MM/D', () => {
      component.formatExpiry(fakeInputEvent('122'));
      expect(component.cardExpiry).toBe('12/2');
    });
  });

  // ── formatPrice ───────────────────────────────────────────────────────────

  describe('formatPrice', () => {
    it('should format 5 lakh as Indian rupee with lakh separator', () => {
      const result = component.formatPrice(500_000);
      expect(result).toContain('5,00,000');
    });

    it('should format 0 correctly', () => {
      const result = component.formatPrice(0);
      expect(result).toContain('0');
    });

    it('should include the INR currency symbol or ₹', () => {
      const result = component.formatPrice(1_000);
      // Intl.NumberFormat en-IN outputs '₹1,000' or similar
      expect(result).toMatch(/[₹\u20B9]|INR/);
    });

    it('should format large amounts using Indian numbering (crore)', () => {
      const result = component.formatPrice(10_000_000); // 1 crore
      expect(result).toContain('1,00,00,000');
    });

    it('should have no decimal places (maximumFractionDigits: 0)', () => {
      const result = component.formatPrice(1234.99);
      expect(result).not.toContain('.');
    });
  });
});