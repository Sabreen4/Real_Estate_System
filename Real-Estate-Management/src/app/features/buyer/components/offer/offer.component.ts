import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';

import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Property } from 'src/app/core/models/property.model';
import { Offer } from 'src/app/core/models/offer.model';

@Component({
  selector: 'app-offer',
  templateUrl: './offer.component.html',
  styleUrls: ['./offer.component.css'],
  standalone: false
})
export class OfferComponent implements OnInit, OnChanges {

  @Input() property: Property | null = null;

  @Output() closed = new EventEmitter<void>();

  @Output() offerMade = new EventEmitter<{
    offerId: number;
    offerAmount: number;
  }>();

  public isSubmitting: boolean = false;
  public isSuccess:    boolean = false;
  public errorMsg:     string  = '';

  public offerAmount: number | null = null;
  public message:     string        = '';

  public suggestions: number[] = [];

  public myOffers: Offer[] = [];

  constructor(
    private txSvc: BuyerTransactionService,
    private auth:  AuthService,
    private cdr:   ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMyOffers();
  }

  ngOnChanges(): void {
    if (this.property) {
      this.offerAmount  = null;
      this.message      = '';
      this.errorMsg     = '';
      this.isSuccess    = false;
      this.isSubmitting = false;

      const p = this.property.price || 0;

      this.suggestions = p > 0
        ? [
            Math.round(p * 0.90),
            Math.round(p * 0.95),
            p
          ]
        : [];
    }
  }

  public get diffPct(): number {
    if (!this.offerAmount || !this.property?.price) return 0;
    return Math.round(
      ((this.offerAmount - this.property.price) / this.property.price) * 100
    );
  }

  public get diffAbove(): boolean {
    return this.diffPct >= 0;
  }

  public setSuggestion(v: number): void {
    this.offerAmount = v;
  }

  public close(): void {
    this.closed.emit();
  }

  public loadMyOffers(): void {
    this.txSvc.getBuyerOffers().subscribe({
      next: (res: Offer[]) => {
        this.myOffers = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  public submit(): void {
    if (!this.property?.id || !this.offerAmount || this.offerAmount <= 0) {
      this.errorMsg = 'Please enter a valid offer amount.';
      return;
    }

    this.isSubmitting = true;
    this.errorMsg     = '';

    this.txSvc.makeOffer({
      propertyId:  this.property.id,
      offerAmount: this.offerAmount,
      message:     this.message
    }).subscribe({
      next: (res: Offer) => {
        this.isSubmitting = false;
        this.isSuccess    = true;

        const offerId = res?.id ?? res?.offerId ?? 0;

        this.offerMade.emit({
          offerId,
          offerAmount: this.offerAmount!
        });

        this.loadMyOffers();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting  = false;
        this.errorMsg =
          err?.error?.message ||
          err?.error?.title   ||
          'Failed to submit offer. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  public proceedToPayment(): void {
    this.closed.emit();
  }

  public formatPrice(n: number): string {
    return new Intl.NumberFormat('en-IN', {
      style:                'currency',
      currency:             'INR',
      maximumFractionDigits: 0
    }).format(n);
  }
}