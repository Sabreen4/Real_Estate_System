import { Component, OnInit, OnChanges, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { BuyerTransactionService } from 'src/app/core/services/buyer-transaction.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Property } from 'src/app/core/models/property.model';
// Import the custom date picker
import { DatePickerComponent } from './date-picker.component';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.css'],
  standalone: false,
  // Add DatePickerComponent to the module that declares this component,
  // OR if converting this to standalone, add it here:
  // imports: [DatePickerComponent]
})
export class AppointmentComponent implements OnInit, OnChanges {

  @Input() property: Property | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() booked = new EventEmitter<void>();

  toasts: Toast[] = [];
  private toastCounter = 0;

  public isSubmitting: boolean = false;
  public isSuccess: boolean = false;
  public errorMsg: string = '';

  public scheduledDate: string = '';
  public scheduledTime: string = '';

  public quickTimes: string[] = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  public selectedQuickTime: string = '';
  public bookedSlots: string[] = [];      // "2026-06-10T09:00" format
  public loadingSlots: boolean = false;
  constructor(
    private txSvc: BuyerTransactionService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void { }

  ngOnChanges(): void {
    if (this.property) {
      this.scheduledDate = '';
      this.scheduledTime = '';
      this.selectedQuickTime = '';
      this.errorMsg = '';
      this.isSuccess = false;
      this.isSubmitting = false;
      this.bookedSlots = [];
      this.loadBookedSlots();   // ← load on open
    }
  }
  private loadBookedSlots(): void {
  if (!this.property?.id) return;
  this.loadingSlots = true;
  console.log('Loading slots for property:', this.property.id); // ← add
  this.txSvc.getBookedSlots(this.property.id).subscribe({
    next: (slots) => {
      this.bookedSlots = slots;
      this.loadingSlots = false;
      console.log('Booked slots received:', slots);             // ← add
      console.log('Current date:', this.scheduledDate);         // ← add
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.loadingSlots = false;
      console.error('Failed to load booked slots:', err);       // ← add
    }
  });
}
  public isSlotBooked(date: string, time: string): boolean {
    if (!date || !time) return false;
    const target = `${date}T${time}`;
    return this.bookedSlots.some(s => s.startsWith(target));
  }
  public isDateFullyBooked(date: string): boolean {
    if (!date) return false;
    return this.quickTimes.every(t => this.isSlotBooked(date, t));
  }

  public setQuickTime(t: string): void {
    if (this.isSlotBooked(this.scheduledDate, t)) return; // blocked
    this.selectedQuickTime = t;
    this.scheduledTime = t;
  }
  public onDateChange(date: string): void {
    this.scheduledDate = date;
    if (this.scheduledTime && this.isSlotBooked(date, this.scheduledTime)) {
      this.scheduledTime = '';
      this.selectedQuickTime = '';
    }
  }

  public getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  public close(): void { this.closed.emit(); }

  public book(): void {
    if (!this.property?.id || !this.scheduledDate || !this.scheduledTime) {
      this.errorMsg = 'Please select a date and time for your visit.';
      return;
    }
    this.isSubmitting = true;
    this.errorMsg = '';

    const visitDate = new Date(
      `${this.scheduledDate}T${this.scheduledTime}:00`
    ).toISOString();

    this.txSvc.bookAppointment({ propertyId: this.property.id, visitDate }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSuccess = true;
        this.showToast('success', 'Appointment booked! The agent will confirm via email.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        const is409 = err?.status === 409;
        const msg = is409
          ? 'That slot was just taken. Please pick another time.'
          : (err?.error?.message || 'Failed to book. Please try again.');
        this.errorMsg = msg;
        this.showToast('error', msg);

        if (is409) {
          // Refresh so the taken slot shows as blurred
          this.loadBookedSlots();
          this.scheduledTime = '';
          this.selectedQuickTime = '';
        }
        this.cdr.detectChanges();
      }
    });
  }
  public onDone(): void { this.booked.emit(); this.closed.emit(); }

  public formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  public formatPrice(n: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  }

  public showToast(type: 'success' | 'error', message: string, duration = 4000): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, type, message });
    this.cdr.detectChanges();
    setTimeout(() => this.dismissToastById(id), duration);
  }

  public dismissToast(t: Toast): void {
    this.dismissToastById(t.id);
  }

  private dismissToastById(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }
}