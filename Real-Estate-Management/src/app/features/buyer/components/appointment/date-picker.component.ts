import {Component, Input, Output, EventEmitter, OnInit,HostListener, ElementRef} from '@angular/core';

@Component({
  selector: 'app-date-picker',
  standalone: false,
  template: `
    <div class="dp-wrapper">
      <div class="dp-trigger" (click)="toggleCalendar($event)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span [class.dp-placeholder]="!selectedDate">
          {{ selectedDate ? formatDisplay(selectedDate) : 'Select date' }}
        </span>
        <svg class="dp-chevron" [class.dp-open]="isOpen" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div class="dp-popup" *ngIf="isOpen" (click)="$event.stopPropagation()">
        <div class="dp-nav">
          <button class="dp-nav-btn" (click)="prevMonth()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="dp-month-label">{{ monthNames[viewMonth] }} {{ viewYear }}</span>
          <button class="dp-nav-btn" (click)="nextMonth()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="dp-grid">
          <span class="dp-day-hdr" *ngFor="let d of dayHeaders">{{ d }}</span>
          <span class="dp-cell dp-empty" *ngFor="let e of leadingEmpties"></span>
          <button
            *ngFor="let day of daysInMonth"
            class="dp-cell dp-day"
            [class.dp-today]="isToday(day)"
            [class.dp-selected]="isSelected(day)"
            [class.dp-disabled]="isDisabled(day)"
            [disabled]="isDisabled(day)"
            (click)="selectDay(day)">{{ day }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dp-wrapper { position: relative; width: 100%; }

    .dp-trigger {
      display: flex; align-items: center; gap: 0.5rem;
      border: 0.09375rem solid #e5e7eb; border-radius: 0.625rem;
      padding: 0.625rem 0.75rem; font-size: 0.84375rem; color: #111827;
      background: #fafafa; cursor: pointer; transition: all 0.18s;
      font-family: inherit; width: 100%; box-sizing: border-box; user-select: none;
    }
    .dp-trigger:hover {
      border-color: #6366f1; background: #fff;
      box-shadow: 0 0 0 0.1875rem rgba(99,102,241,0.12);
    }
    .dp-placeholder { color: #9ca3af; flex: 1; }
    .dp-trigger span:not(.dp-placeholder) { flex: 1; }
    .dp-chevron { transition: transform 0.2s; flex-shrink: 0; color: #9ca3af; }
    .dp-chevron.dp-open { transform: rotate(180deg); }

    .dp-popup {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      width: 100%;
      min-width: 13rem;
      z-index: 99999;
      background: #fff;
      border-radius: 0.75rem;
      box-shadow: 0 0.75rem 2rem rgba(0,0,0,0.15), 0 0 0 0.0625rem rgba(0,0,0,0.06);
      padding: 0.625rem;
      box-sizing: border-box;
      animation: dpFadeIn 0.18s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes dpFadeIn {
      from { opacity: 0; transform: translateY(-0.25rem) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dp-nav {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .dp-month-label { font-size: 0.8125rem; font-weight: 700; color: #111827; }
    .dp-nav-btn {
      width: 1.5rem; height: 1.5rem; border: none;
      background: #f3f4f6; border-radius: 0.375rem;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #6b7280; transition: all 0.15s;
    }
    .dp-nav-btn:hover { background: #e0e7ff; color: #6366f1; }

    .dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .dp-day-hdr {
      font-size: 0.625rem; font-weight: 700; color: #9ca3af;
      text-align: center; text-transform: uppercase; padding: 0.2rem 0;
    }
    .dp-cell {
      aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      border-radius: 0.375rem; font-size: 0.75rem;
    }
    .dp-empty { background: transparent; }
    .dp-day {
      border: none; background: transparent; cursor: pointer;
      color: #374151; font-weight: 500; transition: all 0.13s; font-family: inherit;
    }
    .dp-day:hover:not(:disabled) { background: #e0e7ff; color: #6366f1; }
    .dp-today { color: #6366f1; font-weight: 800; background: #eef2ff; }
    .dp-selected {
      background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
      color: #fff !important; font-weight: 700;
      box-shadow: 0 0.2rem 0.5rem rgba(99,102,241,0.4);
    }
    .dp-disabled { opacity: 0.3; cursor: not-allowed; }
  `]
})
export class DatePickerComponent implements OnInit {
  @Input() value = '';
  @Input() minDate = '';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  viewMonth = 0;
  viewYear = 0;
  selectedDate = '';

  monthNames = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  dayHeaders = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  daysInMonth: number[] = [];
  leadingEmpties: null[] = [];

  constructor(private el: ElementRef) {}

  ngOnInit() {
    const now = new Date();
    this.viewMonth = now.getMonth();
    this.viewYear  = now.getFullYear();
    if (this.value) {
      this.selectedDate = this.value;
      const d = new Date(this.value);
      this.viewMonth = d.getMonth();
      this.viewYear  = d.getFullYear();
    }
    this.buildCalendar();
  }

  toggleCalendar(e: MouseEvent) {
    e.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click')
  onDocClick() { this.isOpen = false; }

  buildCalendar() {
    const first = new Date(this.viewYear, this.viewMonth, 1);
    const days  = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    this.leadingEmpties = Array(first.getDay()).fill(null);
    this.daysInMonth    = Array.from({ length: days }, (_, i) => i + 1);
  }

  prevMonth() {
    if (this.viewMonth === 0) { this.viewMonth = 11; this.viewYear--; }
    else this.viewMonth--;
    this.buildCalendar();
  }

  nextMonth() {
    if (this.viewMonth === 11) { this.viewMonth = 0; this.viewYear++; }
    else this.viewMonth++;
    this.buildCalendar();
  }

  selectDay(day: number) {
    if (this.isDisabled(day)) return;
    const m = String(this.viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    this.selectedDate = `${this.viewYear}-${m}-${d}`;
    this.valueChange.emit(this.selectedDate);
    this.isOpen = false;
  }

  isToday(day: number): boolean {
    const t = new Date();
    return day === t.getDate() && this.viewMonth === t.getMonth() && this.viewYear === t.getFullYear();
  }

  isSelected(day: number): boolean {
    if (!this.selectedDate) return false;
    const m = String(this.viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return this.selectedDate === `${this.viewYear}-${m}-${d}`;
  }

  isDisabled(day: number): boolean {
    if (!this.minDate) return false;
    const m = String(this.viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${this.viewYear}-${m}-${d}` < this.minDate;
  }

  formatDisplay(val: string): string {
    if (!val) return '';
    const [y, m, d] = val.split('-');
    const date = new Date(+y, +m - 1, +d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}