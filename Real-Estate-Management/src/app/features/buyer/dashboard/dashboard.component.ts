import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { interval, Subscription, Subject } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged, map, filter } from 'rxjs/operators';

import { PropertyService, PropertyFilters } from 'src/app/core/services/property.service';
import { AuthService }                      from 'src/app/core/services/auth.service';
import { BuyerTransactionService }          from 'src/app/core/services/buyer-transaction.service';
import { AgentPropertyService }             from 'src/app/core/services/agent-property.service';

import { Property }     from 'src/app/core/models/property.model';
import { Appointment }  from 'src/app/core/models/appointment.model';
import { Offer }        from 'src/app/core/models/offer.model';
import { Transaction }  from 'src/app/core/models/transaction.model';
import { HttpErrorResponse } from '@angular/common/http';

import { getApptStatusClass,
         getOfferStatusClass,
         getPaymentStatusClass }            from './config/buyer-status.config';
import { formatVisitDate }                  from './config/buyer-date.config';
import { PropertyApiResponse,
         processPropertyResponse,
         buildPropertyFromOffer }           from './config/buyer-property.config';

type ActiveTab = 'properties' | 'appointments' | 'offers' | 'payments';

@Component({
  selector:    'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls:   ['./dashboard.component.css'],
  standalone:  false
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── STATE ──────────────────────────────────────────────────────────────────
  public activeTab: ActiveTab = 'properties';

  public properties: Property[] = [];

  public location:     string      = '';
  public minPrice:     number|null = null;
  public maxPrice:     number|null = null;
  public selectedType: string      = '';
  public listingType:  string      = '';

  public isLoading:    boolean = false;

  public buyerName: string = '';
  public buyerId:   number = 0;

  public prefillPropertyId: number | null = null;
  public prefillAgentId:    number | null = null;

  public showAppointmentModal: boolean = false;
  public showOfferModal:       boolean = false;
  public showPaymentModal:     boolean = false;
  public showPropertyModal:    boolean = false;

  public selectedProperty: Property | null = null;

  public pendingOfferId:     number | null = null;
  public pendingOfferAmount: number | null = null;

  public myAppointments: Appointment[]  = [];
  public myOffers:       Offer[]        = [];
  public myPayments:     Transaction[]  = [];

  public isLoadingTab:     boolean                            = false;
  public cardSliderIndex:  Map<number, number>                = new Map();
  public modalSliderIndex: number                             = 0;

  public toastMsg:  string             = '';
  public toastType: 'success'|'error'  = 'success';

  private cardSliderTimers: Map<number, ReturnType<typeof setInterval>> = new Map();
  private modalSliderTimer: ReturnType<typeof setInterval> | null       = null;
  private lastParamsKey:    string       = '';
  private cachedProperties: Property[]  = [];
  private pollSub:          Subscription | null = null;
  private searchSubject =   new Subject<void>();
  private searchSub:        Subscription | null = null;

  constructor(
    private propertyService:      PropertyService,
    private auth:                 AuthService,
    private txService:            BuyerTransactionService,
    private agentPropertyService: AgentPropertyService,
    private cdr:                  ChangeDetectorRef
  ) {}

  // ── LIFECYCLE ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const decoded    = this.auth.decodeToken();
    this.buyerName   = decoded?.firstName
      ? `${decoded.firstName} ${decoded.lastName || ''}`.trim()
      : 'Buyer';
    this.buyerId     = +(
      decoded?.userId ??
      decoded?.sub ??
      decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
      0
    );

    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      map(() => JSON.stringify({
        location: this.location, selectedType: this.selectedType,
        listingType: this.listingType, minPrice: this.minPrice, maxPrice: this.maxPrice,
      })),
      distinctUntilChanged(),
      filter(() =>
        this.location.trim().length === 0 ||
        this.location.trim().length >= 3
      ),
      switchMap(() => {
        this.isLoading = true;
        this.cdr.detectChanges();
        return this.propertyService.getProperties(this.buildParams());
      })
    ).subscribe({
      next:  (res: Property[] | PropertyApiResponse) => this.handlePropertyResponse(res),
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.properties = [];
        this.isLoading  = false;
        this.cdr.detectChanges();
      }
    });

    this.loadProperties();

    setTimeout(() => {
      this.txService.getBuyerOffers().subscribe({
        next:  (d: Offer[]) => {
          this.myOffers = d || [];
          this.cdr.detectChanges();
          this.startOfferPolling();
        },
        error: () => this.startOfferPolling()
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.stopModalSlider();
    this.cardSliderTimers.forEach(t => clearInterval(t));
    document.body.style.overflow = '';
  }

  // ── CARD SLIDER ────────────────────────────────────────────────────────────

  public getCardIndex(id: number): number {
    return this.cardSliderIndex.get(id) ?? 0;
  }

  public startCardSlider(property: Property): void {
    const imgs = property.processedImages ?? [];
    if (imgs.length <= 1) return;
    this.stopCardSlider(property.id);
    const timer = setInterval(() => {
      const cur = this.cardSliderIndex.get(property.id) ?? 0;
      this.cardSliderIndex.set(property.id, (cur + 1) % imgs.length);
      this.cdr.detectChanges();
    }, 3000);
    this.cardSliderTimers.set(property.id, timer);
  }

  public stopCardSlider(id: number): void {
    const t = this.cardSliderTimers.get(id);
    if (t) { clearInterval(t); this.cardSliderTimers.delete(id); }
  }

  public cardSlideNext(property: Property, event: Event): void {
    event.stopPropagation();
    const imgs = property.processedImages ?? [];
    if (!imgs.length) return;
    const cur = this.cardSliderIndex.get(property.id) ?? 0;
    this.cardSliderIndex.set(property.id, (cur + 1) % imgs.length);
    this.cdr.detectChanges();
  }

  public cardSlidePrev(property: Property, event: Event): void {
    event.stopPropagation();
    const imgs = property.processedImages ?? [];
    if (!imgs.length) return;
    const cur = this.cardSliderIndex.get(property.id) ?? 0;
    this.cardSliderIndex.set(property.id, (cur - 1 + imgs.length) % imgs.length);
    this.cdr.detectChanges();
  }

  // ── MODAL SLIDER ───────────────────────────────────────────────────────────

  public get modalImages(): string[] {
    return this.selectedProperty?.processedImages ?? [];
  }

  public startModalSlider(property: Property): void {
    this.modalSliderIndex = 0;
    this.stopModalSlider();
    const imgs = property.processedImages ?? [];
    if (imgs.length <= 1) return;
    this.modalSliderTimer = setInterval(() => {
      this.modalSliderIndex = (this.modalSliderIndex + 1) % imgs.length;
      this.cdr.detectChanges();
    }, 3000);
  }

  public stopModalSlider(): void {
    if (this.modalSliderTimer) {
      clearInterval(this.modalSliderTimer);
      this.modalSliderTimer = null;
    }
  }

  public modalSlideNext(): void {
    const imgs = this.selectedProperty?.processedImages ?? [];
    if (!imgs.length) return;
    this.modalSliderIndex = (this.modalSliderIndex + 1) % imgs.length;
    this.cdr.detectChanges();
  }

  public modalSlidePrev(): void {
    const imgs = this.selectedProperty?.processedImages ?? [];
    if (!imgs.length) return;
    this.modalSliderIndex = (this.modalSliderIndex - 1 + imgs.length) % imgs.length;
    this.cdr.detectChanges();
  }

  public modalGoTo(i: number): void {
    this.modalSliderIndex = i;
    this.cdr.detectChanges();
  }

  // ── POLLING ────────────────────────────────────────────────────────────────

  public startOfferPolling(): void {
    this.pollSub = interval(30_000)
      .pipe(switchMap(() => this.txService.getBuyerOffers()))
      .subscribe({
        next: (offers: Offer[]) => {
          const prev    = [...this.myOffers];
          this.myOffers = offers || [];
          this.checkForStatusChanges(prev, this.myOffers);
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => console.error('Polling error:', err)
      });
  }

  private checkForStatusChanges(prev: Offer[], curr: Offer[]): void {
    curr.forEach(offer => {
      const old = prev.find(o => o.id === offer.id);
      if (old && old.status !== offer.status) this.showStatusToast(offer);
    });
  }

  private showStatusToast(offer: Offer): void {
    const approved   = offer.status?.toUpperCase() === 'APPROVED';
    this.toastType   = approved ? 'success' : 'error';
    this.toastMsg    = approved
      ? `Offer on ${offer.propertyTitle} was approved!`
      : `Offer on ${offer.propertyTitle} was rejected.`;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMsg = ''; this.cdr.detectChanges(); }, 4000);
  }

  // ── MODALS ─────────────────────────────────────────────────────────────────

  public openPropertyDetails(property: Property): void {
    this.selectedProperty  = property;
    this.showPropertyModal = true;
    document.body.style.overflow = 'hidden';
    this.startModalSlider(property);
    this.cdr.detectChanges();
  }

  public closePropertyDetails(): void {
    this.showPropertyModal = false;
    this.selectedProperty  = null;
    this.stopModalSlider();
    this.modalSliderIndex  = 0;
    document.body.style.overflow = '';
    this.cdr.detectChanges();
  }

  public bookVisitFromCard(property: Property): void {
    this.selectedProperty     = property;
    this.showAppointmentModal = true;
    this.cdr.detectChanges();
  }

  public makeOfferFromCard(property: Property): void {
    this.selectedProperty = property;
    this.showOfferModal   = true;
    this.cdr.detectChanges();
  }

  public openAppointmentModal(property: Property): void {
    this.selectedProperty     = property;
    this.showAppointmentModal = true;
    document.body.style.overflow = 'hidden';
  }

  public openOfferModal(property: Property): void {
    this.selectedProperty = property;
    this.showOfferModal   = true;
    document.body.style.overflow = 'hidden';
  }

  public openPaymentModal(property: Property, offerId: number, offerAmount: number): void {
    this.selectedProperty   = property;
    this.pendingOfferId     = offerId;
    this.pendingOfferAmount = offerAmount;
    this.showPaymentModal   = true;
  }

  public openDirectPaymentModal(property: Property): void {
    this.selectedProperty   = property;
    this.pendingOfferId     = null;
    this.pendingOfferAmount = null;
    this.showPaymentModal   = true;
  }

  // ── TAB DATA LOADERS ───────────────────────────────────────────────────────

  private setTab(tab: ActiveTab): void {
    this.activeTab = tab;
  }

  private setTabManual(tab: ActiveTab): void {
    this.prefillPropertyId = null;
    this.prefillAgentId    = null;
    this.activeTab         = tab;
    if (tab === 'appointments') this.loadMyAppointments();
    if (tab === 'offers')       this.loadMyOffers();
    if (tab === 'payments')     this.loadMyPayments();
  }

  private loadMyAppointments(): void {
    this.isLoadingTab = true;
    this.txService.getBuyerAppointments(this.buyerId).subscribe({
      next: (d: Appointment[]) => {
        this.myAppointments = d || [];
        this.isLoadingTab   = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.myAppointments = [];
        this.isLoadingTab   = false;
        this.cdr.detectChanges();
      }
    });
  }

  public loadMyOffers(): void {
    this.isLoadingTab = true;
    this.txService.getBuyerOffers().subscribe({
      next: (d: Offer[]) => {
        this.myOffers     = d || [];
        this.isLoadingTab = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.myOffers     = [];
        this.isLoadingTab = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadMyPayments(): void {
    this.isLoadingTab = true;
    this.txService.getBuyerPayments(this.buyerId).subscribe({
      next: (d: Transaction[]) => {
        this.myPayments   = d || [];
        this.isLoadingTab = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.myPayments   = [];
        this.isLoadingTab = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── PROPERTY LOAD ──────────────────────────────────────────────────────────

  public loadProperties(): void {
    const key = JSON.stringify(this.buildParams());

    if (key === this.lastParamsKey && this.cachedProperties.length > 0) {
      this.properties = this.cachedProperties;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.propertyService.getProperties(this.buildParams()).subscribe({
      next: (res: Property[] | PropertyApiResponse) => {
        this.handlePropertyResponse(res);
        this.lastParamsKey    = key;
        this.cachedProperties = [...this.properties];
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.properties = [];
        this.isLoading  = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── PAYMENT ────────────────────────────────────────────────────────────────

  public payApprovedOffer(offer: Offer): void {
    const matchedProperty   = this.properties.find(p => p.id === offer.propertyId);
    const property: Property = matchedProperty || buildPropertyFromOffer(offer);

    this.selectedProperty   = property;
    this.pendingOfferId     = offer.id ?? offer.offerId ?? null;
    this.pendingOfferAmount = offer.offerAmount;
    this.showPaymentModal   = true;
    this.cdr.detectChanges();
  }

  public onAppointmentClosed(): void {
    this.showAppointmentModal = false;
    this.selectedProperty     = null;
  }

  public onOfferClosed(): void {
    this.showOfferModal   = false;
    this.selectedProperty = null;
  }

  public onOfferMade(_event: { offerId: number; offerAmount: number }): void {
    this.showOfferModal   = false;
    this.selectedProperty = null;
    this.loadMyOffers();
  }

  public onPaymentClosed(): void {
    this.showPaymentModal   = false;
    this.selectedProperty   = null;
    this.pendingOfferId     = null;
    this.pendingOfferAmount = null;
  }

  public onPaymentComplete(_event: void): void {
    this.onPaymentClosed();
  }

  public onPaymentSuccess(event: { propertyId: number; transactionId: string }): void {
    this.properties       = this.properties.filter(p => p.id !== event.propertyId);
    this.cdr.detectChanges();
    this.lastParamsKey    = '';
    this.cachedProperties = [];

    this.txService.updatePropertyStatus(event.propertyId).subscribe({
      next:  () => this.loadProperties(),
      error: (err: HttpErrorResponse) => {
        console.error('mark-sold failed:', err);
        this.loadProperties();
      }
    });
  }

  // ── SEARCH ─────────────────────────────────────────────────────────────────

  public onSearch(filters: PropertyFilters): void {
    this.location     = filters.city            || '';
    this.selectedType = filters.propertyTypeId  || '';
    this.listingType  = filters.listingTypeId   || '';
    this.minPrice     = filters.minPrice        ?? null;
    this.maxPrice     = filters.maxPrice        ?? null;
    this.searchSubject.next();
  }

  public onClear(): void {
    this.location     = '';
    this.minPrice     = null;
    this.maxPrice     = null;
    this.selectedType = '';
    this.listingType  = '';
    this.lastParamsKey    = '';
    this.cachedProperties = [];
    this.loadProperties();
  }

  // ── TEMPLATE DELEGATES (config functions) ──────────────────────────────────

  public formatVisitDate   = formatVisitDate;
  public getApptStatusClass    = getApptStatusClass;
  public getOfferStatusClass   = getOfferStatusClass;
  public getPaymentStatusClass = getPaymentStatusClass;

  // ── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private buildParams(): PropertyFilters {
    const params: PropertyFilters = {};

    if (this.location?.trim()) {
      params.city = this.location.trim()
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }

    if (this.selectedType) params.propertyTypeId = this.selectedType;
    if (this.listingType)  params.listingTypeId  = this.listingType;

    const minVal = Number(this.minPrice);
    const maxVal = Number(this.maxPrice);

    if (this.minPrice !== null && !isNaN(minVal) && minVal > 0) params.minPrice = minVal;
    if (this.maxPrice !== null && !isNaN(maxVal) && maxVal > 0) params.maxPrice = maxVal;

    return params;
  }

  private handlePropertyResponse(response: Property[] | PropertyApiResponse): void {
    this.properties = processPropertyResponse(response);
    this.isLoading  = false;
    this.cdr.detectChanges();
  }
}