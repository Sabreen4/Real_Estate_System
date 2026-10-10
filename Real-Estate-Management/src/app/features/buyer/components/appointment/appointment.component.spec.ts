import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { of, throwError } from 'rxjs';

import { AppointmentComponent } from './appointment.component';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Property } from 'src/app/core/models/property.model';

const mockProperty = {
  id: 'prop-123',
  title: 'Test Property',
  price: 5000000,
} as unknown as Property;

function makeTxSvc(overrides: Partial<{
  getBookedSlots: jasmine.Spy;
  bookAppointment: jasmine.Spy;
}> = {}) {
  return {
    getBookedSlots: overrides.getBookedSlots ?? jasmine.createSpy('getBookedSlots').and.returnValue(of([])),
    bookAppointment: overrides.bookAppointment ?? jasmine.createSpy('bookAppointment').and.returnValue(of({})),
  };
}

describe('AppointmentComponent', () => {
  let fixture: ComponentFixture<AppointmentComponent>;
  let component: AppointmentComponent;
  let txSvc: ReturnType<typeof makeTxSvc>;
  let cdrDetectChangesSpy: jasmine.Spy;

  beforeEach(async () => {
    txSvc = makeTxSvc();

    await TestBed.configureTestingModule({
      declarations: [AppointmentComponent],
      schemas: [NO_ERRORS_SCHEMA], // ✅ suppresses NG0304 for <app-date-picker> and <app-time-picker>
      providers: [
        { provide: BuyerTransactionService, useValue: txSvc },
        { provide: AuthService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentComponent);
    component = fixture.componentInstance;

    cdrDetectChangesSpy = spyOn(
      (component as any).cdr as ChangeDetectorRef,
      'detectChanges'
    );
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should create without error', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  // ── ngOnChanges ───────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should reset state and load slots when property is set', () => {
      const loadSpy = spyOn<any>(component, 'loadBookedSlots');
      component.property = mockProperty;
      component.scheduledDate = '2030-01-01';
      component.scheduledTime = '10:00';
      component.selectedQuickTime = '10:00';
      component.errorMsg = 'old error';
      component.isSuccess = true;
      component.isSubmitting = true;
      component.bookedSlots = ['2030-01-01T10:00'];

      component.ngOnChanges();

      expect(component.scheduledDate).toBe('');
      expect(component.scheduledTime).toBe('');
      expect(component.selectedQuickTime).toBe('');
      expect(component.errorMsg).toBe('');
      expect(component.isSuccess).toBeFalse();
      expect(component.isSubmitting).toBeFalse();
      expect(component.bookedSlots).toEqual([]);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should do nothing when property is null', () => {
      const loadSpy = spyOn<any>(component, 'loadBookedSlots');
      component.property = null;
      component.ngOnChanges();
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  // ── loadBookedSlots ───────────────────────────────────────────────────────

  describe('loadBookedSlots (private)', () => {
    it('should skip when property has no id', () => {
      component.property = { ...mockProperty, id: undefined as any };
      (component as any).loadBookedSlots();
      expect(txSvc.getBookedSlots).not.toHaveBeenCalled();
    });

    it('should populate bookedSlots on success', () => {
      const slots = ['2026-06-10T09:00', '2026-06-10T10:00'];
      txSvc.getBookedSlots.and.returnValue(of(slots));
      component.property = mockProperty;

      (component as any).loadBookedSlots();

      expect(component.bookedSlots).toEqual(slots);
      expect(component.loadingSlots).toBeFalse();
      expect(cdrDetectChangesSpy).toHaveBeenCalled();
    });

    it('should set loadingSlots = false on error', () => {
      txSvc.getBookedSlots.and.returnValue(throwError(() => new Error('Network error')));
      component.property = mockProperty;

      (component as any).loadBookedSlots();

      expect(component.loadingSlots).toBeFalse();
    });

    it('should set loadingSlots = true before the observable resolves', () => {
      const subject = new Subject<string[]>();
      txSvc.getBookedSlots.and.returnValue(subject.asObservable());
      component.property = mockProperty;

      (component as any).loadBookedSlots();

      expect(component.loadingSlots).toBeTrue();
      subject.next([]);
      subject.complete();
      expect(component.loadingSlots).toBeFalse();
    });
  });

  // ── isSlotBooked ──────────────────────────────────────────────────────────

  describe('isSlotBooked', () => {
    beforeEach(() => {
      component.bookedSlots = ['2026-06-10T09:00', '2026-06-10T10:00:00'];
    });

    it('should return true for a booked slot', () => {
      expect(component.isSlotBooked('2026-06-10', '09:00')).toBeTrue();
    });

    it('should return false for an available slot', () => {
      expect(component.isSlotBooked('2026-06-10', '11:00')).toBeFalse();
    });

    it('should return false when date is empty', () => {
      expect(component.isSlotBooked('', '09:00')).toBeFalse();
    });

    it('should return false when time is empty', () => {
      expect(component.isSlotBooked('2026-06-10', '')).toBeFalse();
    });
  });

  // ── isDateFullyBooked ─────────────────────────────────────────────────────

  describe('isDateFullyBooked', () => {
    it('should return false for an empty date', () => {
      expect(component.isDateFullyBooked('')).toBeFalse();
    });

    it('should return true when all quickTimes are booked', () => {
      component.quickTimes = ['09:00', '10:00'];
      component.bookedSlots = ['2026-06-10T09:00', '2026-06-10T10:00'];
      expect(component.isDateFullyBooked('2026-06-10')).toBeTrue();
    });

    it('should return false when at least one slot is free', () => {
      component.quickTimes = ['09:00', '10:00'];
      component.bookedSlots = ['2026-06-10T09:00'];
      expect(component.isDateFullyBooked('2026-06-10')).toBeFalse();
    });
  });

  // ── setQuickTime ──────────────────────────────────────────────────────────

  describe('setQuickTime', () => {
    it('should set the quick time and scheduledTime when slot is free', () => {
      component.scheduledDate = '2026-06-10';
      component.bookedSlots = [];
      component.setQuickTime('09:00');
      expect(component.selectedQuickTime).toBe('09:00');
      expect(component.scheduledTime).toBe('09:00');
    });

    it('should NOT set the time when slot is already booked', () => {
      component.scheduledDate = '2026-06-10';
      component.bookedSlots = ['2026-06-10T09:00'];
      component.selectedQuickTime = '';
      component.scheduledTime = '';
      component.setQuickTime('09:00');
      expect(component.selectedQuickTime).toBe('');
      expect(component.scheduledTime).toBe('');
    });
  });

  // ── onDateChange ──────────────────────────────────────────────────────────

  describe('onDateChange', () => {
    it('should update scheduledDate', () => {
      component.onDateChange('2026-07-01');
      expect(component.scheduledDate).toBe('2026-07-01');
    });

    it('should clear time if the current time is booked on the new date', () => {
      component.scheduledTime = '09:00';
      component.selectedQuickTime = '09:00';
      component.bookedSlots = ['2026-07-01T09:00'];
      component.onDateChange('2026-07-01');
      expect(component.scheduledTime).toBe('');
      expect(component.selectedQuickTime).toBe('');
    });

    it('should keep time if the current time is NOT booked on the new date', () => {
      component.scheduledTime = '11:00';
      component.selectedQuickTime = '11:00';
      component.bookedSlots = ['2026-07-01T09:00'];
      component.onDateChange('2026-07-01');
      expect(component.scheduledTime).toBe('11:00');
      expect(component.selectedQuickTime).toBe('11:00');
    });

    it('should not clear time when scheduledTime is empty', () => {
      component.scheduledTime = '';
      component.bookedSlots = ['2026-07-01T09:00'];
      component.onDateChange('2026-07-01');
      expect(component.scheduledTime).toBe('');
    });
  });

  // ── getMinDate ────────────────────────────────────────────────────────────

  describe('getMinDate', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(component.getMinDate()).toBe(today);
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

  // ── onDone ────────────────────────────────────────────────────────────────

  describe('onDone', () => {
    it('should emit both booked and closed events', () => {
      const bookedSpy = spyOn(component.booked, 'emit');
      const closedSpy = spyOn(component.closed, 'emit');
      component.onDone();
      expect(bookedSpy).toHaveBeenCalled();
      expect(closedSpy).toHaveBeenCalled();
    });
  });

  // ── book ──────────────────────────────────────────────────────────────────

  describe('book', () => {
    beforeEach(() => {
      component.property = mockProperty;
      component.scheduledDate = '2026-06-10';
      component.scheduledTime = '09:00';
    });

    it('should set errorMsg and return early when property is null', () => {
      component.property = null;
      component.book();
      expect(component.errorMsg).toBeTruthy();
      expect(txSvc.bookAppointment).not.toHaveBeenCalled();
    });

    it('should set errorMsg and return early when date is missing', () => {
      component.scheduledDate = '';
      component.book();
      expect(component.errorMsg).toBeTruthy();
      expect(txSvc.bookAppointment).not.toHaveBeenCalled();
    });

    it('should set errorMsg and return early when time is missing', () => {
      component.scheduledTime = '';
      component.book();
      expect(component.errorMsg).toBeTruthy();
      expect(txSvc.bookAppointment).not.toHaveBeenCalled();
    });

    it('should call bookAppointment with correct ISO date on success', () => {
      txSvc.bookAppointment.and.returnValue(of({}));
      component.book();
      expect(txSvc.bookAppointment).toHaveBeenCalledWith({
        propertyId: 'prop-123',
        visitDate: new Date('2026-06-10T09:00:00').toISOString(),
      });
    });

    it('should set isSuccess = true and show success toast on success', () => {
      const toastSpy = spyOn(component, 'showToast');
      txSvc.bookAppointment.and.returnValue(of({}));
      component.book();
      expect(component.isSuccess).toBeTrue();
      expect(component.isSubmitting).toBeFalse();
      expect(toastSpy).toHaveBeenCalledWith('success', jasmine.any(String));
    });

    it('should show generic error message on non-409 failure', () => {
      const error = { status: 500, error: { message: 'Server error' } };
      txSvc.bookAppointment.and.returnValue(throwError(() => error));
      const toastSpy = spyOn(component, 'showToast');
      component.book();
      expect(component.errorMsg).toBe('Server error');
      expect(toastSpy).toHaveBeenCalledWith('error', 'Server error');
      expect(component.isSubmitting).toBeFalse();
    });

    it('should use fallback message when error has no message field', () => {
      const error = { status: 500 };
      txSvc.bookAppointment.and.returnValue(throwError(() => error));
      component.book();
      expect(component.errorMsg).toBe('Failed to book. Please try again.');
    });

    it('should handle 409 conflict: refresh slots and clear time', () => {
      const loadSpy = spyOn<any>(component, 'loadBookedSlots');
      const error = { status: 409 };
      txSvc.bookAppointment.and.returnValue(throwError(() => error));
      component.selectedQuickTime = '09:00';
      component.book();
      expect(component.errorMsg).toBe('That slot was just taken. Please pick another time.');
      expect(loadSpy).toHaveBeenCalled();
      expect(component.scheduledTime).toBe('');
      expect(component.selectedQuickTime).toBe('');
    });

    it('should set isSubmitting = true before the call resolves', () => {
      const subject = new Subject<any>();
      txSvc.bookAppointment.and.returnValue(subject.asObservable());
      component.book();
      expect(component.isSubmitting).toBeTrue();
      subject.next({});
      subject.complete();
      expect(component.isSubmitting).toBeFalse();
    });
  });

  // ── formatDate ────────────────────────────────────────────────────────────

  describe('formatDate', () => {
    it('should return empty string for empty input', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should return a non-empty formatted string for a valid date', () => {
      const result = component.formatDate('2026-06-10');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ── formatPrice ───────────────────────────────────────────────────────────

  describe('formatPrice', () => {
    it('should format price in INR currency', () => {
      const result = component.formatPrice(5000000);
      expect(result).toContain('50,00,000');
    });
  });

  // ── showToast / dismissToast ──────────────────────────────────────────────

  describe('showToast & dismissToast', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should add a toast to the list', () => {
      component.showToast('success', 'Hello!');
      expect(component.toasts.length).toBe(1);
      expect(component.toasts[0].type).toBe('success');
      expect(component.toasts[0].message).toBe('Hello!');
    });

    it('should auto-dismiss the toast after the default duration (4000ms)', () => {
      component.showToast('success', 'Auto-dismiss me');
      expect(component.toasts.length).toBe(1);
      jasmine.clock().tick(4001);
      expect(component.toasts.length).toBe(0);
    });

    it('should auto-dismiss the toast after a custom duration', () => {
      component.showToast('error', 'Custom duration', 2000);
      jasmine.clock().tick(2001);
      expect(component.toasts.length).toBe(0);
    });

    it('should dismiss a specific toast via dismissToast()', () => {
      component.showToast('success', 'First');
      component.showToast('error', 'Second');
      expect(component.toasts.length).toBe(2);

      component.dismissToast(component.toasts[0]);
      expect(component.toasts.length).toBe(1);
      expect(component.toasts[0].message).toBe('Second');
    });

    it('should handle dismissing a toast that no longer exists gracefully', () => {
      component.showToast('success', 'Only one');
      const toast = { ...component.toasts[0] };
      component.dismissToast(toast);
      expect(() => component.dismissToast(toast)).not.toThrow();
      expect(component.toasts.length).toBe(0);
    });

    it('should assign incrementing unique ids to toasts', () => {
      component.showToast('success', 'A');
      component.showToast('error', 'B');
      const ids = component.toasts.map(t => t.id);
      expect(ids[0]).toBeLessThan(ids[1]);
    });
  });
});