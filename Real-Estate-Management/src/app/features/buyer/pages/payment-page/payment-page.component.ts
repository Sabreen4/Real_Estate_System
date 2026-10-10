import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Transaction } from 'src/app/core/models/transaction.model';

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.css'],
  standalone: false
})
export class PaymentPageComponent implements OnInit {

  public buyerId:     number = 0;
  public myPayments:  Transaction[] = [];
  public isLoading:   boolean = false;

  // ── Sorting ──
  public sortField: string  = 'paymentDate';
  public sortAsc:   boolean = false;

  // ── Pagination ──
  public pageSize:    number = 5;
  public currentPage: number = 1;

  constructor(
    private txService: BuyerTransactionService,
    private auth:      AuthService,
    private router:    Router,
    private cdr:       ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const decoded = this.auth.decodeToken();
    this.buyerId = +(
      decoded?.userId ??
      decoded?.sub ??
      decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? 0
    );
    this.load();
  }

  public load(): void {
    this.isLoading   = true;
    this.currentPage = 1;

    this.txService.getBuyerPayments(this.buyerId).subscribe({
      next: (d: Transaction[]) => {
        this.myPayments = d || [];
        this.isLoading  = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.myPayments = [];
        this.isLoading  = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Sorting ──
  public setSort(field: string): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc   = false;
    }
    this.currentPage = 1;
  }

  public get sortedPayments(): Transaction[] {
    return [...this.myPayments].sort((a: Transaction, b: Transaction) => {
      let valA: string | number = a[this.sortField as keyof Transaction] as string | number;
      let valB: string | number = b[this.sortField as keyof Transaction] as string | number;

      if (this.sortField === 'paymentDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ?  1 : -1;
      return 0;
    });
  }

  // ── Pagination ──
  public get totalPages(): number {
    return Math.ceil(this.myPayments.length / this.pageSize);
  }

  public get pagedPayments(): Transaction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedPayments.slice(start, start + this.pageSize);
  }

  public get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  public goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  public get showingFrom(): number {
    return this.myPayments.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  public get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.myPayments.length);
  }

  // ── Date ──
  public getDisplayDate(dateVal: string | number | undefined): Date {
  if (!dateVal) return new Date(0);
  return new Date(dateVal);
}
  // ── Status ──
  public getStatusClass(status: string): string {
    return 'ts-approved';
  }

  public getStatusLabel(status: string): string {
    return 'PAID';
  }

  public goToOffers(): void {
    this.router.navigate(['/buyer/offer']);
  }
}