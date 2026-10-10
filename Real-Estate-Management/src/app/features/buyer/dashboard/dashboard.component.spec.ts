import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks
} from '@angular/core/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { PropertyService } from 'src/app/core/services/property.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AgentPropertyService } from 'src/app/core/services/agent-property.service';
import { Property } from 'src/app/core/models/property.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeProperty = (overrides: any = {}): Property =>
  ({
    id: 1,
    title: 'Test Property',
    description: 'desc',
    city: 'Chennai',
    state: 'TN',
    price: 500_000,
    size: 1200,
    propertyType: 'APARTMENT',
    listingType: 'SALE',
    status: 'ACTIVE',
    agentId: 10,
    images: [],
    imageUrl: 'assets/default-house.jpg',
    ...overrides
  } as Property);

const activeApiProperty = (overrides: any = {}) => ({
  id: 1,
  title: 'Test',
  description: 'desc',
  city: 'Chennai',
  state: 'TN',
  price: 500_000,
  size: 1200,
  propertyType: 'APARTMENT',
  listingType: 'SALE',
  status: 'ACTIVE',
  agentId: 10,
  images: [],
  ...overrides
});

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let propertySvc: jasmine.SpyObj<PropertyService>;
  let authSvc: jasmine.SpyObj<AuthService>;
  let txSvc: jasmine.SpyObj<BuyerTransactionService>;
  let agentPropertySvc: jasmine.SpyObj<AgentPropertyService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    propertySvc = jasmine.createSpyObj('PropertyService', ['getProperties']);
    authSvc = jasmine.createSpyObj('AuthService', ['decodeToken']);
    txSvc = jasmine.createSpyObj('BuyerTransactionService', [
      'getBuyerOffers',
      'getBuyerAppointments',
      'getBuyerPayments',
      'updatePropertyStatus'
    ]);
    agentPropertySvc = jasmine.createSpyObj('AgentPropertyService', ['getProperties']);

    propertySvc.getProperties.and.returnValue(of([]));
    authSvc.decodeToken.and.returnValue({
      firstName: 'Jane',
      lastName: 'Doe',
      userId: '42'
    });
    txSvc.getBuyerOffers.and.returnValue(of([]));
    txSvc.getBuyerAppointments.and.returnValue(of([]));
    txSvc.getBuyerPayments.and.returnValue(of([]));
    txSvc.updatePropertyStatus.and.returnValue(of(void 0 as any));

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [FormsModule],
      providers: [
        { provide: PropertyService, useValue: propertySvc },
        { provide: AuthService, useValue: authSvc },
        { provide: BuyerTransactionService, useValue: txSvc },
        { provide: AgentPropertyService, useValue: agentPropertySvc }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;

    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    (component as any).cdr = cdr;

    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set buyerName from decoded token', () => {
      expect(component.buyerName).toBe('Jane Doe');
    });

    it('should set buyerName to Buyer when firstName absent', () => {
      authSvc.decodeToken.and.returnValue({});
      propertySvc.getProperties.and.returnValue(of([]));
      txSvc.getBuyerOffers.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.buyerName).toBe('Buyer');
    });

    it('should handle null decoded token gracefully', () => {
      authSvc.decodeToken.and.returnValue(null);
      propertySvc.getProperties.and.returnValue(of([]));
      txSvc.getBuyerOffers.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.buyerName).toBe('Buyer');
      expect(component.buyerId).toBe(0);
    });

    it('should trim buyerName when lastName is absent', () => {
      authSvc.decodeToken.and.returnValue({ firstName: 'Jane', userId: '1' });
      propertySvc.getProperties.and.returnValue(of([]));
      txSvc.getBuyerOffers.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.buyerName).toBe('Jane');
    });

    it('should derive buyerId from userId', () => {
      expect(component.buyerId).toBe(42);
    });

    it('should derive buyerId from sub when userId absent', () => {
      authSvc.decodeToken.and.returnValue({ firstName: 'A', sub: '7' });
      propertySvc.getProperties.and.returnValue(of([]));
      txSvc.getBuyerOffers.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.buyerId).toBe(7);
    });

    it('should derive buyerId from nameidentifier claim', () => {
      authSvc.decodeToken.and.returnValue({
        firstName: 'A',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '55'
      });
      propertySvc.getProperties.and.returnValue(of([]));
      txSvc.getBuyerOffers.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.buyerId).toBe(55);
    });

    it('should default buyerId to 0 when all fields absent', () => {
      authSvc.decodeToken.and.returnValue({ firstName: 'A' });
      propertySvc.getProperties.and.returnValue(of([]));
      txSvc.getBuyerOffers.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.buyerId).toBe(0);
    });

    it('should call loadProperties on init', () => {
      expect(propertySvc.getProperties).toHaveBeenCalled();
    });

    it('should populate myOffers after 1s timeout', fakeAsync(() => {
      txSvc.getBuyerOffers.and.returnValue(of([{ id: 1 }] as any));
      propertySvc.getProperties.and.returnValue(of([]));
      component.ngOnInit();
      tick(1000);
      expect(component.myOffers).toEqual([{ id: 1 }] as any);
      discardPeriodicTasks();
    }));

    it('should start offer polling even when getBuyerOffers errors in timeout', fakeAsync(() => {
      txSvc.getBuyerOffers.and.returnValue(throwError(() => new Error('fail')));
      propertySvc.getProperties.and.returnValue(of([]));
      component.ngOnInit();
      tick(1000);
      expect((component as any).pollSub).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  // ── ngOnDestroy ────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should unsubscribe pollSub and searchSub', () => {
      const pollSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      const searchSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      (component as any).pollSub = pollSub;
      (component as any).searchSub = searchSub;
      component.ngOnDestroy();
      expect(pollSub.unsubscribe).toHaveBeenCalled();
      expect(searchSub.unsubscribe).toHaveBeenCalled();
    });

    it('should stop modal slider and clear card timers', () => {
      const spy = spyOn(component, 'stopModalSlider');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should reset document body overflow', () => {
      document.body.style.overflow = 'hidden';
      component.ngOnDestroy();
      expect(document.body.style.overflow).toBe('');
    });

    it('should not throw when pollSub and searchSub are null', () => {
      (component as any).pollSub = null;
      (component as any).searchSub = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should clear all card slider timers on destroy', fakeAsync(() => {
      // Start two sliders, then destroy — no leaked intervals
      component.startCardSlider({ id: 1, processedImages: ['a', 'b'] } as any);
      component.startCardSlider({ id: 2, processedImages: ['x', 'y'] } as any);
      component.ngOnDestroy();
      tick(6000); // would have advanced both timers
      expect(component.getCardIndex(1)).toBe(0);
      expect(component.getCardIndex(2)).toBe(0);
    }));
  });

  // ── Card slider ────────────────────────────────────────────────────────────

  describe('card slider', () => {
    it('getCardIndex should return 0 for unknown id', () => {
      expect(component.getCardIndex(999)).toBe(0);
    });

    it('getCardIndex should return stored value', () => {
      component.cardSliderIndex.set(5, 2);
      expect(component.getCardIndex(5)).toBe(2);
    });

    it('startCardSlider should not start timer for single image', fakeAsync(() => {
      component.startCardSlider({ id: 1, processedImages: ['img1'] } as any);
      tick(3000);
      expect(component.cardSliderIndex.get(1)).toBeUndefined();
    }));

    it('startCardSlider should not start timer for empty images', fakeAsync(() => {
      component.startCardSlider({ id: 1, processedImages: [] } as any);
      tick(3000);
      expect(component.cardSliderIndex.get(1)).toBeUndefined();
    }));

    it('startCardSlider should advance index every 3s', fakeAsync(() => {
      component.startCardSlider({ id: 1, processedImages: ['a', 'b', 'c'] } as any);
      tick(3000);
      expect(component.getCardIndex(1)).toBe(1);
      tick(3000);
      expect(component.getCardIndex(1)).toBe(2);
      tick(3000);
      expect(component.getCardIndex(1)).toBe(0); // wraps
      component.stopCardSlider(1);
    }));

    it('startCardSlider should clear existing timer before starting new one', fakeAsync(() => {
      component.startCardSlider({ id: 1, processedImages: ['a', 'b'] } as any);
      component.startCardSlider({ id: 1, processedImages: ['a', 'b'] } as any);
      tick(3000);
      expect(component.getCardIndex(1)).toBe(1);
      component.stopCardSlider(1);
    }));

    it('startCardSlider should handle undefined processedImages gracefully', fakeAsync(() => {
      component.startCardSlider({ id: 1 } as any);
      tick(3000);
      expect(component.getCardIndex(1)).toBe(0);
    }));

    it('stopCardSlider should clear timer', fakeAsync(() => {
      component.startCardSlider({ id: 1, processedImages: ['a', 'b'] } as any);
      component.stopCardSlider(1);
      tick(3000);
      expect(component.getCardIndex(1)).toBe(0);
    }));

    it('stopCardSlider should be no-op when no timer exists', () => {
      expect(() => component.stopCardSlider(999)).not.toThrow();
    });

    it('cardSlideNext should advance index', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any;
      component.cardSliderIndex.set(1, 0);
      component.cardSlideNext({ id: 1, processedImages: ['a', 'b', 'c'] } as any, event);
      expect(component.cardSliderIndex.get(1)).toBe(1);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('cardSlideNext should wrap around', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any;
      component.cardSliderIndex.set(1, 2);
      component.cardSlideNext({ id: 1, processedImages: ['a', 'b', 'c'] } as any, event);
      expect(component.cardSliderIndex.get(1)).toBe(0);
    });

    it('cardSlideNext should do nothing with empty processedImages', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any;
      component.cardSlideNext({ id: 1, processedImages: [] } as any, event);
      expect(component.cardSliderIndex.get(1)).toBeUndefined();
    });

    it('cardSlideNext should do nothing with undefined processedImages', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any;
      component.cardSlideNext({ id: 1 } as any, event);
      expect(component.cardSliderIndex.get(1)).toBeUndefined();
    });

    it('cardSlidePrev should go backward', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any;
      component.cardSliderIndex.set(1, 2);
      component.cardSlidePrev({ id: 1, processedImages: ['a', 'b', 'c'] } as any, event);
      expect(component.cardSliderIndex.get(1)).toBe(1);
    });

    it('cardSlidePrev should wrap to last index', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any;
      component.cardSliderIndex.set(1, 0);
      component.cardSlidePrev({ id: 1, processedImages: ['a', 'b', 'c'] } as any, event);
      expect(component.cardSliderIndex.get(1)).toBe(2);
    });

    it('cardSlidePrev should do nothing with empty processedImages', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any;
      component.cardSlidePrev({ id: 1, processedImages: [] } as any, event);
      expect(component.cardSliderIndex.get(1)).toBeUndefined();
    });

    it('cardSlidePrev should do nothing with undefined processedImages', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any;
      component.cardSlidePrev({ id: 1 } as any, event);
      expect(component.cardSliderIndex.get(1)).toBeUndefined();
    });
  });

  // ── Modal slider ───────────────────────────────────────────────────────────

  describe('modal slider', () => {
    it('startModalSlider resets index to 0 and does not start timer for single image', fakeAsync(() => {
      component.modalSliderIndex = 3;
      component.startModalSlider({ processedImages: ['a'] } as any);
      expect(component.modalSliderIndex).toBe(0);
      tick(3000);
      expect(component.modalSliderIndex).toBe(0);
    }));

    it('startModalSlider does not start timer for empty images', fakeAsync(() => {
      component.modalSliderIndex = 2;
      component.startModalSlider({ processedImages: [] } as any);
      expect(component.modalSliderIndex).toBe(0);
      tick(3000);
      expect(component.modalSliderIndex).toBe(0);
    }));

    it('startModalSlider advances index every 3s', fakeAsync(() => {
      component.startModalSlider({ processedImages: ['a', 'b', 'c'] } as any);
      tick(3000);
      expect(component.modalSliderIndex).toBe(1);
      tick(3000);
      expect(component.modalSliderIndex).toBe(2);
      component.stopModalSlider();
    }));

    it('startModalSlider clears existing timer', fakeAsync(() => {
      component.startModalSlider({ processedImages: ['a', 'b'] } as any);
      component.startModalSlider({ processedImages: ['a', 'b'] } as any);
      tick(3000);
      expect(component.modalSliderIndex).toBe(1);
      component.stopModalSlider();
    }));

    it('startModalSlider should handle undefined processedImages gracefully', fakeAsync(() => {
      component.modalSliderIndex = 2;
      component.startModalSlider({} as any);
      expect(component.modalSliderIndex).toBe(0);
      tick(3000);
      expect(component.modalSliderIndex).toBe(0);
    }));

    it('stopModalSlider should clear timer', fakeAsync(() => {
      component.startModalSlider({ processedImages: ['a', 'b'] } as any);
      component.stopModalSlider();
      tick(3000);
      expect(component.modalSliderIndex).toBe(0);
    }));

    it('stopModalSlider should be no-op when no timer', () => {
      component.stopModalSlider();
      expect(component.modalSliderIndex).toBe(0);
    });

    it('modalImages should return processedImages from selectedProperty', () => {
      component.selectedProperty = { processedImages: ['a', 'b'] } as any;
      expect(component.modalImages).toEqual(['a', 'b']);
    });

    it('modalImages should return [] when selectedProperty is null', () => {
      component.selectedProperty = null;
      expect(component.modalImages).toEqual([]);
    });

    it('modalImages should return [] when processedImages is absent', () => {
      component.selectedProperty = {} as any;
      expect(component.modalImages).toEqual([]);
    });

    it('modalSlideNext should advance index', () => {
      component.selectedProperty = { processedImages: ['a', 'b', 'c'] } as any;
      component.modalSliderIndex = 0;
      component.modalSlideNext();
      expect(component.modalSliderIndex).toBe(1);
    });

    it('modalSlideNext should wrap', () => {
      component.selectedProperty = { processedImages: ['a', 'b'] } as any;
      component.modalSliderIndex = 1;
      component.modalSlideNext();
      expect(component.modalSliderIndex).toBe(0);
    });

    it('modalSlideNext should do nothing when no images', () => {
      component.selectedProperty = { processedImages: [] } as any;
      component.modalSlideNext();
      expect(component.modalSliderIndex).toBe(0);
    });

    it('modalSlideNext should do nothing when selectedProperty has no processedImages', () => {
      component.selectedProperty = {} as any;
      component.modalSlideNext();
      expect(component.modalSliderIndex).toBe(0);
    });

    it('modalSlidePrev should go backward', () => {
      component.selectedProperty = { processedImages: ['a', 'b', 'c'] } as any;
      component.modalSliderIndex = 2;
      component.modalSlidePrev();
      expect(component.modalSliderIndex).toBe(1);
    });

    it('modalSlidePrev should wrap to last', () => {
      component.selectedProperty = { processedImages: ['a', 'b', 'c'] } as any;
      component.modalSliderIndex = 0;
      component.modalSlidePrev();
      expect(component.modalSliderIndex).toBe(2);
    });

    it('modalSlidePrev should do nothing when no images', () => {
      component.selectedProperty = { processedImages: [] } as any;
      component.modalSlidePrev();
      expect(component.modalSliderIndex).toBe(0);
    });

    it('modalSlidePrev should do nothing when selectedProperty has no processedImages', () => {
      component.selectedProperty = {} as any;
      component.modalSlidePrev();
      expect(component.modalSliderIndex).toBe(0);
    });

    it('modalGoTo should set index', () => {
      component.modalGoTo(3);
      expect(component.modalSliderIndex).toBe(3);
    });
  });

  // ── startOfferPolling ──────────────────────────────────────────────────────

  describe('startOfferPolling', () => {
    it('should update myOffers on each poll tick', fakeAsync(() => {
      txSvc.getBuyerOffers.and.returnValue(of([{ id: 1, status: 'PENDING' }] as any));
      component.startOfferPolling();
      tick(30_000);
      expect(component.myOffers).toEqual([{ id: 1, status: 'PENDING' }] as any);
      discardPeriodicTasks();
    }));

    it('should handle null offers response in poll', fakeAsync(() => {
      txSvc.getBuyerOffers.and.returnValue(of(null as any));
      component.startOfferPolling();
      tick(30_000);
      expect(component.myOffers).toEqual([]);
      discardPeriodicTasks();
    }));

    it('should log error on polling failure', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');
      txSvc.getBuyerOffers.and.returnValue(throwError(() => new Error('poll fail')));
      component.startOfferPolling();
      tick(30_000);
      expect(consoleSpy).toHaveBeenCalledWith('Polling error:', jasmine.any(Error));
      discardPeriodicTasks();
    }));

    it('should show toast when offer status changes to APPROVED', fakeAsync(() => {
      component.myOffers = [{ id: 1, status: 'PENDING', propertyTitle: 'Apt' }] as any;
      txSvc.getBuyerOffers.and.returnValue(
        of([{ id: 1, status: 'APPROVED', propertyTitle: 'Apt' }] as any)
      );
      component.startOfferPolling();
      tick(30_000);
      expect(component.toastMsg).toContain('Apt');
      expect(component.toastType).toBe('success');
      tick(4000);
      expect(component.toastMsg).toBe('');
      discardPeriodicTasks();
    }));

    it('should show error toast when offer is rejected', fakeAsync(() => {
      component.myOffers = [{ id: 1, status: 'PENDING', propertyTitle: 'House' }] as any;
      txSvc.getBuyerOffers.and.returnValue(
        of([{ id: 1, status: 'REJECTED', propertyTitle: 'House' }] as any)
      );
      component.startOfferPolling();
      tick(30_000);
      expect(component.toastType).toBe('error');
      expect(component.toastMsg).toContain('rejected');
      tick(4000);
      discardPeriodicTasks();
    }));

    it('should show error toast for any non-APPROVED status change', fakeAsync(() => {
      component.myOffers = [{ id: 1, status: 'PENDING', propertyTitle: 'Villa' }] as any;
      txSvc.getBuyerOffers.and.returnValue(
        of([{ id: 1, status: 'COUNTER', propertyTitle: 'Villa' }] as any)
      );
      component.startOfferPolling();
      tick(30_000);
      expect(component.toastType).toBe('error');
      tick(4000);
      discardPeriodicTasks();
    }));

    it('should not show toast when status unchanged', fakeAsync(() => {
      component.myOffers = [{ id: 1, status: 'PENDING' }] as any;
      txSvc.getBuyerOffers.and.returnValue(of([{ id: 1, status: 'PENDING' }] as any));
      component.startOfferPolling();
      tick(30_000);
      expect(component.toastMsg).toBe('');
      discardPeriodicTasks();
    }));

    it('should not show toast for new offers not in prev list', fakeAsync(() => {
      component.myOffers = [];
      txSvc.getBuyerOffers.and.returnValue(of([{ id: 99, status: 'APPROVED' }] as any));
      component.startOfferPolling();
      tick(30_000);
      expect(component.toastMsg).toBe('');
      discardPeriodicTasks();
    }));

    // ── covers showStatusToast toast auto-clear branch ──
    it('toast should auto-clear after 4 seconds', fakeAsync(() => {
      component.myOffers = [{ id: 1, status: 'PENDING', propertyTitle: 'X' }] as any;
      txSvc.getBuyerOffers.and.returnValue(
        of([{ id: 1, status: 'APPROVED', propertyTitle: 'X' }] as any)
      );
      component.startOfferPolling();
      tick(30_000);
      expect(component.toastMsg).not.toBe('');
      tick(4000);
      expect(component.toastMsg).toBe('');
      discardPeriodicTasks();
    }));
  });

  // ── Modal open/close ───────────────────────────────────────────────────────

  describe('openPropertyDetails', () => {
    it('should open property modal and start modal slider', () => {
      const spy = spyOn(component, 'startModalSlider');
      const p = makeProperty();
      component.openPropertyDetails(p);
      expect(component.showPropertyModal).toBeTrue();
      expect(component.selectedProperty).toBe(p);
      expect(document.body.style.overflow).toBe('hidden');
      expect(spy).toHaveBeenCalledWith(p);
    });
  });

  describe('closePropertyDetails', () => {
    it('should close property modal and stop slider', () => {
      const spy = spyOn(component, 'stopModalSlider');
      component.showPropertyModal = true;
      component.selectedProperty = makeProperty();
      component.closePropertyDetails();
      expect(component.showPropertyModal).toBeFalse();
      expect(component.selectedProperty).toBeNull();
      expect(component.modalSliderIndex).toBe(0);
      expect(document.body.style.overflow).toBe('');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('bookVisitFromCard', () => {
    it('should open appointment modal', () => {
      const p = makeProperty();
      component.bookVisitFromCard(p);
      expect(component.showAppointmentModal).toBeTrue();
      expect(component.selectedProperty).toBe(p);
    });
  });

  describe('makeOfferFromCard', () => {
    it('should open offer modal', () => {
      const p = makeProperty();
      component.makeOfferFromCard(p);
      expect(component.showOfferModal).toBeTrue();
      expect(component.selectedProperty).toBe(p);
    });
  });

  describe('openAppointmentModal', () => {
    it('should open appointment modal and set overflow hidden', () => {
      const p = makeProperty();
      component.openAppointmentModal(p);
      expect(component.showAppointmentModal).toBeTrue();
      expect(component.selectedProperty).toBe(p);
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('openOfferModal', () => {
    it('should open offer modal and set overflow hidden', () => {
      const p = makeProperty();
      component.openOfferModal(p);
      expect(component.showOfferModal).toBeTrue();
      expect(component.selectedProperty).toBe(p);
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('openPaymentModal', () => {
    it('should set all payment modal fields', () => {
      const p = makeProperty();
      component.openPaymentModal(p, 5, 450_000);
      expect(component.showPaymentModal).toBeTrue();
      expect(component.pendingOfferId).toBe(5);
      expect(component.pendingOfferAmount).toBe(450_000);
      expect(component.selectedProperty).toBe(p);
    });
  });

  describe('openDirectPaymentModal', () => {
    it('should open payment modal with null offer ids', () => {
      const p = makeProperty();
      component.openDirectPaymentModal(p);
      expect(component.showPaymentModal).toBeTrue();
      expect(component.pendingOfferId).toBeNull();
      expect(component.pendingOfferAmount).toBeNull();
      expect(component.selectedProperty).toBe(p);
    });
  });

  // ── Close event handlers ───────────────────────────────────────────────────

  describe('onAppointmentClosed', () => {
    it('should close appointment modal', () => {
      component.showAppointmentModal = true;
      component.onAppointmentClosed();
      expect(component.showAppointmentModal).toBeFalse();
      expect(component.selectedProperty).toBeNull();
    });
  });

  describe('onOfferClosed', () => {
    it('should close offer modal and clear selected property', () => {
      component.showOfferModal = true;
      component.selectedProperty = makeProperty();
      component.onOfferClosed();
      expect(component.showOfferModal).toBeFalse();
      expect(component.selectedProperty).toBeNull();
    });
  });

  describe('onOfferMade', () => {
    it('should close offer modal and reload offers', () => {
      txSvc.getBuyerOffers.and.returnValue(of([{ id: 1 }] as any));
      component.showOfferModal = true;
      component.onOfferMade({ offerId: 1, offerAmount: 100 });
      expect(component.showOfferModal).toBeFalse();
      expect(component.selectedProperty).toBeNull();
      expect(txSvc.getBuyerOffers).toHaveBeenCalled();
    });
  });

  describe('onPaymentClosed', () => {
    it('should reset all payment state', () => {
      component.showPaymentModal = true;
      component.pendingOfferId = 1;
      component.pendingOfferAmount = 100;
      component.selectedProperty = makeProperty();
      component.onPaymentClosed();
      expect(component.showPaymentModal).toBeFalse();
      expect(component.pendingOfferId).toBeNull();
      expect(component.pendingOfferAmount).toBeNull();
      expect(component.selectedProperty).toBeNull();
    });
  });

  describe('onPaymentComplete', () => {
    it('should delegate to onPaymentClosed', () => {
      const spy = spyOn(component, 'onPaymentClosed');
      component.onPaymentComplete(undefined as any);
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── onPaymentSuccess ───────────────────────────────────────────────────────

  describe('onPaymentSuccess', () => {
    beforeEach(() => {
      component.properties = [makeProperty({ id: 1 }), makeProperty({ id: 2 })];
    });

    it('should remove the sold property and reload', () => {
      txSvc.updatePropertyStatus.and.returnValue(of(void 0 as any));
      propertySvc.getProperties.and.returnValue(of([]));
      component.onPaymentSuccess({ propertyId: 1, transactionId: 'TXN1' });
      expect(component.properties.find(p => p.id === 1)).toBeUndefined();
      expect(txSvc.updatePropertyStatus).toHaveBeenCalledWith(1);
      expect(propertySvc.getProperties).toHaveBeenCalled();
    });

    it('should still reload properties when updatePropertyStatus errors', () => {
      const consoleSpy = spyOn(console, 'error');
      txSvc.updatePropertyStatus.and.returnValue(throwError(() => new Error('fail')));
      propertySvc.getProperties.and.returnValue(of([]));
      component.onPaymentSuccess({ propertyId: 1, transactionId: 'TXN1' });
      expect(consoleSpy).toHaveBeenCalled();
      expect(propertySvc.getProperties).toHaveBeenCalled();
    });

    it('should clear cache so next loadProperties fetches fresh data', () => {
      txSvc.updatePropertyStatus.and.returnValue(of(void 0 as any));
      propertySvc.getProperties.and.returnValue(of([]));
      (component as any).lastParamsKey = 'something';
      (component as any).cachedProperties = [makeProperty()];
      propertySvc.getProperties.calls.reset();
      component.onPaymentSuccess({ propertyId: 1, transactionId: 'TXN1' });
      expect(propertySvc.getProperties).toHaveBeenCalled();
      expect((component as any).cachedProperties).toEqual([]);
    });
  });

  // ── loadProperties ─────────────────────────────────────────────────────────

  describe('loadProperties', () => {
    it('should fetch and map only ACTIVE properties', () => {
      propertySvc.getProperties.and.returnValue(of([
        activeApiProperty({ status: 'ACTIVE' }),
        activeApiProperty({ id: 2, status: 'INACTIVE' })
      ]));
      component.loadProperties();
      expect(component.properties.length).toBe(1);
      expect(component.properties[0].id).toBe(1);
    });

    it('should handle undefined API response gracefully', () => {
      propertySvc.getProperties.and.returnValue(of(undefined as any));
      component.loadProperties();
      expect(component.properties).toEqual([]);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle null API response gracefully', () => {
      propertySvc.getProperties.and.returnValue(of(null as any));
      component.loadProperties();
      expect(component.properties).toEqual([]);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle response wrapped in items', () => {
      propertySvc.getProperties.and.returnValue(of({ items: [activeApiProperty()] } as any));
      component.loadProperties();
      expect(component.properties.length).toBe(1);
    });

    it('should use cache when params unchanged and cache is populated', () => {
      const cached = [makeProperty()];
      (component as any).lastParamsKey = JSON.stringify(component['buildParams']());
      (component as any).cachedProperties = cached;
      propertySvc.getProperties.calls.reset();
      component.loadProperties();
      expect(propertySvc.getProperties).not.toHaveBeenCalled();
      expect(component.properties).toEqual(cached);
    });

    it('should log error and clear properties on failure', () => {
      const consoleSpy = spyOn(console, 'error');
      propertySvc.getProperties.and.returnValue(throwError(() => new Error('err')));
      component.loadProperties();
      expect(consoleSpy).toHaveBeenCalled();
      expect(component.properties).toEqual([]);
      expect(component.isLoading).toBeFalse();
    });

    it('should map base64 images correctly and filter out null ones', () => {
      propertySvc.getProperties.and.returnValue(of([
        activeApiProperty({
          images: [
            { base64: 'abc', contentType: 'image/png' },
            { base64: null }
          ]
        })
      ]));
      component.loadProperties();
      // processedImages only keeps non-null entries
      expect((component.properties[0] as any).processedImages.length).toBe(1);
      expect((component.properties[0] as any).processedImages[0])
        .toContain('data:image/png;base64,abc');
    });

    it('should default contentType to image/jpeg when absent', () => {
      propertySvc.getProperties.and.returnValue(of([
        activeApiProperty({ images: [{ base64: 'xyz' }] })
      ]));
      component.loadProperties();
      expect((component.properties[0] as any).processedImages[0])
        .toContain('data:image/jpeg;base64,xyz');
    });

    it('should use fallback imageUrl when no images', () => {
      propertySvc.getProperties.and.returnValue(of([activeApiProperty({ images: [] })]));
      component.loadProperties();
      expect((component.properties[0] as any).imageUrl).toBe('assets/default-house.jpg');
    });

    it('should use fallback imageUrl when first image has no base64', () => {
      propertySvc.getProperties.and.returnValue(of([
        activeApiProperty({ images: [{ base64: null, contentType: 'image/png' }] })
      ]));
      component.loadProperties();
      expect((component.properties[0] as any).imageUrl).toBe('assets/default-house.jpg');
    });

    it('should use imageUrl from first image base64', () => {
      propertySvc.getProperties.and.returnValue(of([
        activeApiProperty({ images: [{ base64: 'abc', contentType: 'image/png' }] })
      ]));
      component.loadProperties();
      expect((component.properties[0] as any).imageUrl)
        .toContain('data:image/png;base64,abc');
    });

    it('should use agentId from userId fallback when agentId absent', () => {
      propertySvc.getProperties.and.returnValue(of([
        activeApiProperty({ agentId: undefined, userId: 77 })
      ]));
      component.loadProperties();
      expect(component.properties[0].agentId).toBe(77);
    });

    it('should default agentId to 0 when both agentId and userId absent', () => {
      propertySvc.getProperties.and.returnValue(of([
        activeApiProperty({ agentId: undefined, userId: undefined })
      ]));
      component.loadProperties();
      expect(component.properties[0].agentId).toBe(0);
    });

    it('should produce empty processedImages array when images is null', () => {
      propertySvc.getProperties.and.returnValue(of([
        activeApiProperty({ images: null })
      ]));
      component.loadProperties();
      expect((component.properties[0] as any).processedImages).toEqual([]);
    });

    it('should update lastParamsKey and cache after successful load', () => {
      propertySvc.getProperties.and.returnValue(of([activeApiProperty()]));
      (component as any).lastParamsKey = '';
      (component as any).cachedProperties = [];
      component.loadProperties();
      expect((component as any).lastParamsKey).not.toBe('');
      expect((component as any).cachedProperties.length).toBeGreaterThan(0);
    });
  });

  // ── loadMyOffers (public) ──────────────────────────────────────────────────

  describe('loadMyOffers', () => {
    it('should populate myOffers on success', () => {
      txSvc.getBuyerOffers.and.returnValue(of([{ id: 1 }] as any));
      component.loadMyOffers();
      expect(component.myOffers).toEqual([{ id: 1 }] as any);
      expect(component.isLoadingTab).toBeFalse();
    });

    it('should default to [] when response is null', () => {
      txSvc.getBuyerOffers.and.returnValue(of(null as any));
      component.loadMyOffers();
      expect(component.myOffers).toEqual([]);
    });

    it('should clear myOffers on error', () => {
      txSvc.getBuyerOffers.and.returnValue(throwError(() => new Error('fail')));
      component.loadMyOffers();
      expect(component.myOffers).toEqual([]);
      expect(component.isLoadingTab).toBeFalse();
    });

    it('should set isLoadingTab true before subscribe and false after', () => {
      let capturedDuring = false;
      txSvc.getBuyerOffers.and.callFake(() => {
        capturedDuring = component.isLoadingTab;
        return of([]);
      });
      component.loadMyOffers();
      expect(capturedDuring).toBeTrue();
      expect(component.isLoadingTab).toBeFalse();
    });
  });

  // ── onSearch ───────────────────────────────────────────────────────────────

  describe('onSearch', () => {
    it('should update filters and trigger search pipeline', fakeAsync(() => {
      propertySvc.getProperties.and.returnValue(of([activeApiProperty()]));
      component.onSearch({
        city: 'Chennai',
        propertyTypeId: 'APARTMENT',
        listingTypeId: 'SALE',
        minPrice: 100_000,
        maxPrice: 900_000
      });
      tick(300);
      expect(component.location).toBe('Chennai');
      expect(component.selectedType).toBe('APARTMENT');
      expect(propertySvc.getProperties).toHaveBeenCalled();
    }));

    it('should not trigger search when location is 1-2 chars', fakeAsync(() => {
      propertySvc.getProperties.calls.reset();
      component.onSearch({ city: 'ab' });
      tick(300);
      expect(propertySvc.getProperties).not.toHaveBeenCalled();
    }));

    it('should trigger search when location is empty', fakeAsync(() => {
      propertySvc.getProperties.and.returnValue(of([]));
      component.onSearch({ city: '' });
      tick(300);
      expect(propertySvc.getProperties).toHaveBeenCalled();
    }));

    it('should handle search error gracefully', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');
      propertySvc.getProperties.and.returnValue(throwError(() => new Error('search fail')));
      component.onSearch({ city: 'Chennai' });
      tick(300);
      expect(consoleSpy).toHaveBeenCalled();
      expect(component.properties).toEqual([]);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle completely empty filter object gracefully', fakeAsync(() => {
      propertySvc.getProperties.and.returnValue(of([]));
      component.onSearch({});
      tick(300);
      expect(component.location).toBe('');
      expect(component.selectedType).toBe('');
      expect(component.listingType).toBe('');
      expect(component.minPrice).toBeNull();
      expect(component.maxPrice).toBeNull();
    }));

    it('should deduplicate identical consecutive searches (distinctUntilChanged)', fakeAsync(() => {
      propertySvc.getProperties.and.returnValue(of([]));
      component.onSearch({ city: 'Chennai' });
      tick(300);
      const callCount = propertySvc.getProperties.calls.count();
      component.onSearch({ city: 'Chennai' });
      tick(300);
      // distinctUntilChanged suppresses the second identical emission
      expect(propertySvc.getProperties.calls.count()).toBe(callCount);
    }));

    it('should trigger search when location has exactly 3 chars', fakeAsync(() => {
      propertySvc.getProperties.and.returnValue(of([]));
      component.onSearch({ city: 'abc' });
      tick(300);
      expect(propertySvc.getProperties).toHaveBeenCalled();
    }));
  });

  // ── onClear ────────────────────────────────────────────────────────────────

  describe('onClear', () => {
   it('should reset all filters and reload properties', () => {
  component.location = 'Chennai';
  component.minPrice = 100_000;
  component.maxPrice = 900_000;
  component.selectedType = 'APARTMENT';
  component.listingType = 'SALE';
  propertySvc.getProperties.and.returnValue(of([]));
  component.onClear();
  expect(component.location).toBe('');
  expect(component.minPrice).toBeNull();
  expect(component.maxPrice).toBeNull();
  expect(component.selectedType).toBe('');
  expect(component.listingType).toBe('');
  expect((component as any).lastParamsKey).toBe(JSON.stringify({}));
  expect((component as any).cachedProperties).toEqual([]);
  expect(propertySvc.getProperties).toHaveBeenCalled();
});
  });

  // ── payApprovedOffer ───────────────────────────────────────────────────────

  describe('payApprovedOffer', () => {
    it('should use matched property from properties list', () => {
      component.properties = [makeProperty({ id: 5, agentId: 20 })];
      component.payApprovedOffer({ id: 1, propertyId: 5, offerAmount: 400_000 } as any);
      expect(component.selectedProperty!.id).toBe(5);
      expect(component.pendingOfferId).toBe(1);
      expect(component.pendingOfferAmount).toBe(400_000);
      expect(component.showPaymentModal).toBeTrue();
    });

    it('should build synthetic property when no match found in properties', () => {
      component.properties = [];
      component.payApprovedOffer({
        id: 2,
        propertyId: 99,
        propertyTitle: 'Unknown',
        offerAmount: 300_000,
        agentId: 55
      } as any);
      expect(component.selectedProperty!.id).toBe(99);
      expect((component.selectedProperty as any).agentId).toBe(55);
    });

    it('should fall back through sellerId for agentId', () => {
      component.properties = [];
      component.payApprovedOffer({
        propertyId: 99,
        offerAmount: 100,
        sellerId: 77
      } as any);
      expect((component.selectedProperty as any).agentId).toBe(77);
    });

    it('should use agentUserId fallback when agentId and sellerId absent', () => {
      component.properties = [];
      component.payApprovedOffer({
        propertyId: 99,
        offerAmount: 100,
        agentUserId: 33
      } as any);
      expect((component.selectedProperty as any).agentId).toBe(33);
    });

    it('should default agentId to 0 when all agent fields absent', () => {
      component.properties = [];
      component.payApprovedOffer({ propertyId: 99, offerAmount: 100 } as any);
      expect((component.selectedProperty as any).agentId).toBe(0);
    });

    it('should use offer.offerId when offer.id is absent', () => {
      component.properties = [];
      component.payApprovedOffer({ offerId: 9, propertyId: 1, offerAmount: 100 } as any);
      expect(component.pendingOfferId).toBe(9);
    });

    it('should set pendingOfferId to null when both id and offerId absent', () => {
      component.properties = [];
      component.payApprovedOffer({ propertyId: 1, offerAmount: 100 } as any);
      expect(component.pendingOfferId).toBeNull();
    });

    it('should use city from offer when building synthetic property', () => {
      component.properties = [];
      component.payApprovedOffer({
        propertyId: 77,
        offerAmount: 200,
        city: 'Mumbai'
      } as any);
      expect((component.selectedProperty as any).city).toBe('Mumbai');
    });

    it('should use propertyTitle from offer when building synthetic property', () => {
      component.properties = [];
      component.payApprovedOffer({
        propertyId: 77,
        offerAmount: 200,
        propertyTitle: 'My House'
      } as any);
      expect(component.selectedProperty!.title).toBe('My House');
    });
  });

  // ── buildParams ────────────────────────────────────────────────────────────

  describe('buildParams (via loadProperties)', () => {
    it('should title-case city from location', () => {
      component.location = 'new delhi';
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.city).toBe('New Delhi');
    });

    it('should include propertyTypeId when selectedType is set', () => {
      component.selectedType = 'APARTMENT';
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.propertyTypeId).toBe('APARTMENT');
    });

    it('should include listingTypeId when listingType is set', () => {
      component.listingType = 'RENT';
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.listingTypeId).toBe('RENT');
    });

    it('should include minPrice and maxPrice when > 0', () => {
      component.minPrice = 100_000;
      component.maxPrice = 900_000;
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.minPrice).toBe(100_000);
      expect(params.maxPrice).toBe(900_000);
    });

    it('should not include minPrice / maxPrice when 0 or null', () => {
      component.minPrice = 0;
      component.maxPrice = null;
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.minPrice).toBeUndefined();
      expect(params.maxPrice).toBeUndefined();
    });

    it('should not include minPrice when value is NaN', () => {
      component.minPrice = NaN as any;
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.minPrice).toBeUndefined();
    });

    it('should not include maxPrice when value is NaN', () => {
      component.maxPrice = NaN as any;
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.maxPrice).toBeUndefined();
    });

    it('should not include city when location is empty string', () => {
      component.location = '';
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.city).toBeUndefined();
    });

    it('should not include city when location is whitespace only', () => {
      component.location = '   ';
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.city).toBeUndefined();
    });

    it('should not include minPrice when minPrice is undefined', () => {
      (component as any).minPrice = undefined;
      propertySvc.getProperties.and.returnValue(of([]));
      component.loadProperties();
      const params = propertySvc.getProperties.calls.mostRecent().args[0];
      expect(params.minPrice).toBeUndefined();
    });
  });

  // ── Status class helpers ───────────────────────────────────────────────────

  describe('getApptStatusClass', () => {
    it('returns ts-approved for APPROVED', () =>
      expect(component.getApptStatusClass('APPROVED')).toBe('ts-approved'));
    it('returns ts-rejected for REJECTED', () =>
      expect(component.getApptStatusClass('REJECTED')).toBe('ts-rejected'));
    it('returns ts-pending for PENDING', () =>
      expect(component.getApptStatusClass('PENDING')).toBe('ts-pending'));
    it('returns ts-pending for empty string', () =>
      expect(component.getApptStatusClass('')).toBe('ts-pending'));
    it('returns ts-approved for lowercase approved', () =>
      expect(component.getApptStatusClass('approved')).toBe('ts-approved'));
    it('returns ts-rejected for lowercase rejected', () =>
      expect(component.getApptStatusClass('rejected')).toBe('ts-rejected'));
    // covers: (s || 'PENDING') when s is null/undefined
    it('returns ts-pending for null input', () =>
      expect(component.getApptStatusClass(null as any)).toBe('ts-pending'));
  });

  describe('getOfferStatusClass', () => {
    it('returns ts-approved for APPROVED', () =>
      expect(component.getOfferStatusClass('APPROVED')).toBe('ts-approved'));
    it('returns ts-rejected for REJECTED', () =>
      expect(component.getOfferStatusClass('REJECTED')).toBe('ts-rejected'));
    it('returns ts-pending for other', () =>
      expect(component.getOfferStatusClass('other')).toBe('ts-pending'));
    it('returns ts-pending for empty string', () =>
      expect(component.getOfferStatusClass('')).toBe('ts-pending'));
    it('returns ts-pending for null input', () =>
      expect(component.getOfferStatusClass(null as any)).toBe('ts-pending'));
  });

  describe('getPaymentStatusClass', () => {
    it('returns ts-approved for COMPLETED', () =>
      expect(component.getPaymentStatusClass('COMPLETED')).toBe('ts-approved'));
    it('returns ts-rejected for FAILED', () =>
      expect(component.getPaymentStatusClass('FAILED')).toBe('ts-rejected'));
    it('returns ts-pending for PROCESSING', () =>
      expect(component.getPaymentStatusClass('PROCESSING')).toBe('ts-pending'));
    it('returns ts-pending for empty string', () =>
      expect(component.getPaymentStatusClass('')).toBe('ts-pending'));
    it('returns ts-approved for lowercase completed', () =>
      expect(component.getPaymentStatusClass('completed')).toBe('ts-approved'));
    it('returns ts-rejected for lowercase failed', () =>
      expect(component.getPaymentStatusClass('failed')).toBe('ts-rejected'));
  });

  // ── formatVisitDate ────────────────────────────────────────────────────────

  describe('formatVisitDate', () => {
    it('should return placeholder for empty string', () => {
      const r = component.formatVisitDate('');
      expect(r).toEqual({ day: '--', month: '---', time: '--:--' });
    });

    it('should parse a valid date string', () => {
      const r = component.formatVisitDate('2025-06-15T10:30:00');
      expect(r.day).toBe('15');
      expect(r.month).toBe('JUN');
    });

    it('should pad single-digit day with leading zero', () => {
      const r = component.formatVisitDate('2025-06-03T09:00:00');
      expect(r.day).toBe('03');
    });

    it('should return placeholder for null input', () => {
      const r = component.formatVisitDate(null as any);
      expect(r).toEqual({ day: '--', month: '---', time: '--:--' });
    });

    it('should return placeholder for undefined input', () => {
      const r = component.formatVisitDate(undefined as any);
      expect(r).toEqual({ day: '--', month: '---', time: '--:--' });
    });

    it('should return the time portion of a valid date string', () => {
      const r = component.formatVisitDate('2025-06-15T14:30:00');
      expect(r.time).toBeTruthy();
      expect(r.time).not.toBe('--:--');
    });
  });

  // ── private tab loaders ────────────────────────────────────────────────────

  describe('private tab loaders', () => {
    it('loadMyAppointments: populates myAppointments on success', () => {
      txSvc.getBuyerAppointments.and.returnValue(of([{ id: 1 }] as any));
      (component as any).loadMyAppointments();
      expect(component.myAppointments).toEqual([{ id: 1 }] as any);
      expect(component.isLoadingTab).toBeFalse();
    });

    it('loadMyAppointments: defaults to [] on null response', () => {
      txSvc.getBuyerAppointments.and.returnValue(of(null as any));
      (component as any).loadMyAppointments();
      expect(component.myAppointments).toEqual([]);
    });

    it('loadMyAppointments: clears list on error', () => {
      txSvc.getBuyerAppointments.and.returnValue(throwError(() => new Error()));
      (component as any).loadMyAppointments();
      expect(component.myAppointments).toEqual([]);
      expect(component.isLoadingTab).toBeFalse();
    });

    it('loadMyAppointments: sets isLoadingTab true before and false after', () => {
      let capturedDuring = false;
      txSvc.getBuyerAppointments.and.callFake(() => {
        capturedDuring = component.isLoadingTab;
        return of([]);
      });
      (component as any).loadMyAppointments();
      expect(capturedDuring).toBeTrue();
      expect(component.isLoadingTab).toBeFalse();
    });

    it('loadMyPayments: populates myPayments on success', () => {
      txSvc.getBuyerPayments.and.returnValue(of([{ id: 2 }] as any));
      (component as any).loadMyPayments();
      expect(component.myPayments).toEqual([{ id: 2 }] as any);
    });

    it('loadMyPayments: defaults to [] on null', () => {
      txSvc.getBuyerPayments.and.returnValue(of(null as any));
      (component as any).loadMyPayments();
      expect(component.myPayments).toEqual([]);
    });

    it('loadMyPayments: clears list on error', () => {
      txSvc.getBuyerPayments.and.returnValue(throwError(() => new Error()));
      (component as any).loadMyPayments();
      expect(component.myPayments).toEqual([]);
      expect(component.isLoadingTab).toBeFalse();
    });

    it('loadMyPayments: sets isLoadingTab true before and false after', () => {
      let capturedDuring = false;
      txSvc.getBuyerPayments.and.callFake(() => {
        capturedDuring = component.isLoadingTab;
        return of([]);
      });
      (component as any).loadMyPayments();
      expect(capturedDuring).toBeTrue();
      expect(component.isLoadingTab).toBeFalse();
    });
  });

  // ── private setTab / setTabManual ──────────────────────────────────────────

  describe('private setTab / setTabManual', () => {
    it('setTab should change activeTab', () => {
      (component as any).setTab('offers');
      expect(component.activeTab).toBe('offers');
    });

    it('setTabManual should reset prefill and set tab', () => {
      component.prefillPropertyId = 1;
      component.prefillAgentId = 2;
      txSvc.getBuyerAppointments.and.returnValue(of([]));
      (component as any).setTabManual('appointments');
      expect(component.prefillPropertyId).toBeNull();
      expect(component.activeTab).toBe('appointments');
    });

    it('setTabManual should call loadMyOffers for offers tab', () => {
      txSvc.getBuyerOffers.and.returnValue(of([]));
      (component as any).setTabManual('offers');
      expect(txSvc.getBuyerOffers).toHaveBeenCalled();
    });

    it('setTabManual should call loadMyPayments for payments tab', () => {
      txSvc.getBuyerPayments.and.returnValue(of([]));
      (component as any).setTabManual('payments');
      expect(txSvc.getBuyerPayments).toHaveBeenCalled();
    });

    it('setTabManual should not call tab loaders for properties tab', () => {
      txSvc.getBuyerOffers.calls.reset();
      txSvc.getBuyerPayments.calls.reset();
      txSvc.getBuyerAppointments.calls.reset();
      (component as any).setTabManual('properties');
      expect(txSvc.getBuyerOffers).not.toHaveBeenCalled();
      expect(txSvc.getBuyerPayments).not.toHaveBeenCalled();
      expect(txSvc.getBuyerAppointments).not.toHaveBeenCalled();
    });

    it('setTabManual should reset prefillAgentId', () => {
      component.prefillAgentId = 99;
      txSvc.getBuyerOffers.and.returnValue(of([]));
      (component as any).setTabManual('offers');
      expect(component.prefillAgentId).toBeNull();
    });
  });
});