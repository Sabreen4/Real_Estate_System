import {
  Component, OnInit, OnChanges, Input, Output,
  EventEmitter, ChangeDetectorRef
} from '@angular/core';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Property } from 'src/app/core/models/property.model';
import { Transaction } from 'src/app/core/models/transaction.model';
import { HttpErrorResponse } from '@angular/common/http';

type PayStep = 'method' | 'processing' | 'success';


interface PropertyWithSellerFields extends Property {
  agentUserId?: number;
  sellerId?:    number;
}

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  standalone: false
})
export class PaymentComponent implements OnInit, OnChanges {

  @Input() property: Property | null = null;
  @Input() offerId: number | null = null;
  @Input() offerAmount: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<{ propertyId: number; transactionId: string }>();

  public step: PayStep = 'method';
  public errorMsg = '';
  public confirmedTxnId: string | null = null;

  public paymentMethods = [
    { id: 'UPI',      label: 'UPI',                icon: 'upi',  desc: 'PhonePe · GPay · Paytm · BHIM' },
    { id: 'GPAY',     label: 'Google Pay',          icon: 'gpay', desc: 'Pay directly via GPay UPI' },
    { id: 'CARD',     label: 'Credit / Debit Card', icon: 'card', desc: 'Visa · Mastercard · RuPay' },
    { id: 'NETBANK',  label: 'Net Banking',          icon: 'bank', desc: 'All major Indian banks' },
    { id: 'TRANSFER', label: 'Bank Transfer',        icon: 'wire', desc: 'NEFT / RTGS / IMPS' },
  ];
  public selectedMethodId: string = 'UPI';

  public upiId:        string = '';
  public gpayNumber:   string = '';
  public cardNumber:   string = '';
  public cardExpiry:   string = '';
  public cardCvv:      string = '';
  public cardHolder:   string = '';
  public selectedBank: string = '';

  public banks: string[] = [
    'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
    'Kotak Mahindra Bank', 'Yes Bank', 'Punjab National Bank', 'Bank of Baroda',
    'Canara Bank', 'Union Bank of India'
  ];

  constructor(
    private txSvc: BuyerTransactionService,
    private auth:  AuthService,
    private cdr:   ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.property) {
      this.step            = 'method';
      this.errorMsg        = '';
      this.upiId           = '';
      this.gpayNumber      = '';
      this.cardNumber      = '';
      this.cardExpiry      = '';
      this.cardCvv         = '';
      this.cardHolder      = '';
      this.selectedBank    = '';
      this.selectedMethodId = 'UPI';
    }
  }

  public get amount(): number {
    return this.offerAmount ?? this.property?.price ?? 0;
  }

  public get sellerId(): number {
    const p = this.property as PropertyWithSellerFields;
    return p?.agentId || p?.userId || p?.agentUserId || p?.sellerId || 0;
  }

  public selectMethod(id: string): void {
    this.selectedMethodId = id;
  }

  public get selectedMethod(): { id: string; label: string; icon: string; desc: string } {
    return this.paymentMethods.find(m => m.id === this.selectedMethodId) || this.paymentMethods[0];
  }

  public isMethodValid(): boolean {
    switch (this.selectedMethodId) {
      case 'UPI':     return this.upiId.includes('@');
      case 'GPAY':    return this.gpayNumber.replace(/\D/g, '').length === 10;
      case 'CARD':    return this.cardNumber.replace(/\s/g, '').length === 16
                        && this.cardExpiry.length >= 4
                        && this.cardCvv.length >= 3
                        && !!this.cardHolder;
      case 'NETBANK': return !!this.selectedBank;
      default:        return true;
    }
  }

  public confirm(): void {
    this.errorMsg = '';

    if (!this.isMethodValid()) {
      this.errorMsg = 'Please complete all payment details.';
      return;
    }

    if (!this.property?.id || !this.amount) {
      this.errorMsg = 'Missing property or amount details.';
      return;
    }

    if (!this.sellerId) {
      this.errorMsg = 'Unable to identify seller. Please try again.';
      return;
    }

    this.step = 'processing';
    this.cdr.detectChanges();

    this.txSvc.createTransaction({
      propertyId:    this.property.id,
      sellerId:      this.sellerId,
      amount:        this.amount,
      offerId:       this.offerId ?? undefined,
      paymentMethod: this.selectedMethodId
    }).subscribe({
      next: (res: Transaction) => {
        const txnId = res?.id ?? res?.transactionId;

        if (!txnId) {
          this.confirmedTxnId = 'TXN' + Date.now();
          this.step = 'success';
          this.cdr.detectChanges();
          this.paymentSuccess.emit({
            propertyId:    this.property!.id,
            transactionId: this.confirmedTxnId!
          });
          return;
        }

        this.txSvc.updateTransactionStatus(txnId, 'APPROVED').subscribe({
          next: () => {
            this.confirmedTxnId = String(txnId);
            this.step = 'success';
            this.cdr.detectChanges();
            this.paymentSuccess.emit({
              propertyId:    this.property!.id,
              transactionId: this.confirmedTxnId!
            });
          },
          error: (err: HttpErrorResponse) => {
            console.error('Status update failed:', err);
            this.confirmedTxnId = String(txnId);
            this.step = 'success';
            this.cdr.detectChanges();
            this.paymentSuccess.emit({
              propertyId:    this.property!.id,
              transactionId: this.confirmedTxnId!
            });
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Payment failed:', err);
        this.errorMsg = 'Payment failed. Please try again.';
        this.step = 'method';
        this.cdr.detectChanges();
      }
    });
  }

  public close(): void {
    this.closed.emit();
  }

  public formatCard(e: Event): void {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '').substring(0, 16);
    this.cardNumber = v.replace(/(.{4})/g, '$1 ').trim();
  }

  public formatExpiry(e: Event): void {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) {
      v = v.substring(0, 2) + '/' + v.substring(2);
    }
    this.cardExpiry = v;
  }

  public formatPrice(n: number): string {
    return new Intl.NumberFormat('en-IN', {
      style:                'currency',
      currency:             'INR',
      maximumFractionDigits: 0
    }).format(n);
  }
}