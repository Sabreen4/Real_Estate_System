import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Property } from 'src/app/core/models/property.model';

@Component({
  selector: 'app-offer-page',
  templateUrl: './offer-page.component.html',
  styleUrls: ['./offer-page.component.css'],
  standalone: false
})
export class OfferPageComponent implements OnInit {

  buyerId = 0;
  myOffers: any[] = [];
  isLoading = false;
  showPaymentModal = false;
  selectedProperty: Property | null = null;
  pendingOfferId: number | null = null;
  pendingOfferAmount: number | null = null;

  // PAGINATION
  currentPage = 1;
  pageSize = 5;

  constructor(
    private txService: BuyerTransactionService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  // ─────────────────────────────────────────────
  // localStorage KEY — unique per buyer
  // ─────────────────────────────────────────────

  private get storageKey(): string {
    return `paid_properties_buyer_${this.buyerId}`;
  }

  // READ paid IDs from localStorage
  private getPaidIds(): Set<number> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  // WRITE paid ID to localStorage
  private savePaidId(propertyId: number): void {
    try {
      const ids = this.getPaidIds();
      ids.add(propertyId);
      localStorage.setItem(this.storageKey, JSON.stringify([...ids]));
    } catch (e) {
      console.error('localStorage write failed', e);
    }
  }

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────

  ngOnInit(): void {
    const decoded = this.auth.decodeToken();
    this.buyerId = +(
      decoded?.userId ??
      decoded?.sub ??
      decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
      0
    );
    this.load();
  }

  // ─────────────────────────────────────────────
  // LOAD OFFERS
  // ─────────────────────────────────────────────

  public load(): void {
    this.isLoading = true;

    this.txService.getBuyerOffers().subscribe({
      next: (d) => {
        console.log('API returned:', d?.length, 'offers', d);

        // Read paid IDs once before mapping
        const paid = this.getPaidIds();

        this.myOffers = (d || [])
          .sort((a: any, b: any) => {
            const priority = (status: string): number => {
              switch ((status || '').toUpperCase()) {
                case 'APPROVED': return 1;
                case 'PENDING':  return 2;
                case 'REJECTED': return 3;
                default:         return 4;
              }
            };
            const statusDiff = priority(a.status) - priority(b.status);
            if (statusDiff !== 0) return statusDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .map((o: any) => {
            o.paymentStatus  = (o.paymentStatus  || '').toUpperCase();
            o.propertyStatus = (o.propertyStatus || '').toUpperCase();
            o.status         = (o.status         || '').toUpperCase();

            //  If already paid (from localStorage), always force PAID regardless of API response
            // This handles: slow backend sync, sign out + sign in, page refresh
            if (
              paid.has(o.propertyId) ||
              o.paymentStatus === 'COMPLETED' ||
              o.propertyStatus === 'SOLD'
            ) {
              o.paymentStatus  = 'COMPLETED';
              o.propertyStatus = 'SOLD';
              o.status         = 'APPROVED';
              // Also save to localStorage in case API returned it correctly this time
              this.savePaidId(o.propertyId);
            }

            return o;
          });

        if (this.currentPage > this.totalPages) {
          this.currentPage = 1;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load offers:', err);
        this.myOffers = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────

  public get totalPages(): number {
    return Math.ceil(this.myOffers.length / this.pageSize) || 1;
  }

  public get pagedOffers(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.myOffers.slice(start, start + this.pageSize);
  }

  public get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.myOffers.length);
  }

  public get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  public goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────
  // STATUS CLASS
  // ─────────────────────────────────────────────

  public getStatusClass(status: string): string {
    const value = (status || 'PENDING').toUpperCase();
    if (value === 'APPROVED') return 'ts-approved';
    if (value === 'REJECTED') return 'ts-rejected';
    return 'ts-pending';
  }

  // ─────────────────────────────────────────────
  // OPEN PAYMENT MODAL
  // ─────────────────────────────────────────────

  public openPaymentModal(o: any): void {
    const property: any = {
      id:           o.propertyId,
      title:        o.propertyTitle || 'Property',
      price:        o.offerAmount,
      imageUrl:     '',
      city:         o.city  || '',
      state:        '',
      description:  '',
      size:         0,
      propertyType: '',
      listingType:  '',
      status:       'ACTIVE',
      agentId:      o.agentId ?? 0
    };

    this.selectedProperty   = property;
    this.pendingOfferId     = o.id ?? o.offerId;
    this.pendingOfferAmount = o.offerAmount;
    this.showPaymentModal   = true;

    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────
  // CLOSE PAYMENT MODAL
  // ─────────────────────────────────────────────

  public onPaymentClosed(): void {
    this.showPaymentModal   = false;
    this.selectedProperty   = null;
    this.pendingOfferId     = null;
    this.pendingOfferAmount = null;
  }

  // ─────────────────────────────────────────────
  // PAYMENT SUCCESS
  // ─────────────────────────────────────────────

  public onPaymentSuccess(event: {
    propertyId: number;
    transactionId: string;
  }): void {

    // Save to localStorage immediately — permanent across sign out/in
    this.savePaidId(event.propertyId);

    // Instantly update UI
    this.myOffers = this.myOffers.map(o => {
      if (o.propertyId === event.propertyId) {
        return {
          ...o,
          paymentStatus:  'COMPLETED',
          propertyStatus: 'SOLD',
          status:         'APPROVED'
        };
      }
      return o;
    });

    // Close modal — Paid badge shows immediately
    this.onPaymentClosed();
    this.cdr.detectChanges();

    // Call backend mark-sold, then reload
    this.txService
      .updatePropertyStatus(event.propertyId)
      .subscribe({
        next: () => {
          setTimeout(() => this.load(), 2000);
        },
        error: (err: any) => {
          console.error('mark-sold failed:', err);
          // Even if backend fails, localStorage keeps the paid state
          setTimeout(() => this.load(), 2000);
        }
      });
  }

  // ─────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────

  public goToDashboard(): void {
    this.router.navigate(['/buyer/dashboard']);
  }
}