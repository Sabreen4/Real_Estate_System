import {Component, Input, Output, EventEmitter, OnInit, OnChanges,HostListener, ElementRef} from '@angular/core';

@Component({
  selector: 'app-time-picker',
  standalone: false,
  template: `
    <div class="tp-wrapper">

      <div class="tp-trigger" [class.tp-open]="isOpen" (click)="togglePicker($event)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span [class.tp-placeholder]="!selectedTime">
          {{ selectedTime ? formatDisplay(selectedTime) : 'Select time' }}
        </span>
        <svg class="tp-chevron" [class.tp-open]="isOpen"
             width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div class="tp-popup" *ngIf="isOpen" (click)="$event.stopPropagation()">

        <div class="tp-columns">

          <!-- Hours -->
          <div class="tp-col">
            <div class="tp-col-label">HH</div>
            <div class="tp-scroll">
              <div *ngFor="let h of hours"
                   class="tp-item"
                   [class.tp-item-active]="h === selectedHour"
                   (click)="selectHour(h)">{{ pad(h) }}</div>
            </div>
          </div>

          <div class="tp-sep">:</div>

          <!-- Minutes -->
          <div class="tp-col">
            <div class="tp-col-label">MM</div>
            <div class="tp-scroll">
              <div *ngFor="let m of minutes"
                   class="tp-item"
                   [class.tp-item-active]="m === selectedMin"
                   (click)="selectMin(m)">{{ pad(m) }}</div>
            </div>
          </div>

          <!-- AM/PM -->
          <div class="tp-col tp-col-ampm">
            <div class="tp-col-label">AM/PM</div>
            <div class="tp-ampm-wrap">
              <div class="tp-ampm" [class.tp-ampm-active]="period === 'AM'" (click)="setPeriod('AM')">AM</div>
              <div class="tp-ampm" [class.tp-ampm-active]="period === 'PM'" (click)="setPeriod('PM')">PM</div>
            </div>
          </div>

        </div>

        <div class="tp-footer">
          <button class="tp-cancel" (click)="cancel()">Cancel</button>
          <button class="tp-confirm" (click)="confirm()">Set Time</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .tp-wrapper {
      position: relative;
      width: 100%;
    }

    /* Trigger — identical to dp-trigger */
    .tp-trigger {
      display: flex; align-items: center; gap: 0.5rem;
      border: 0.09375rem solid #e5e7eb; border-radius: 0.625rem;
      padding: 0.625rem 0.75rem; font-size: 0.84375rem; color: #111827;
      background: #fafafa; cursor: pointer; transition: all 0.18s;
      font-family: inherit; width: 100%; box-sizing: border-box; user-select: none;
    }
    .tp-trigger:hover,
    .tp-trigger.tp-open {
      border-color: #6366f1; background: #fff;
      box-shadow: 0 0 0 0.1875rem rgba(99,102,241,0.12);
    }
    .tp-placeholder { color: #9ca3af; flex: 1; }
    .tp-trigger span:not(.tp-placeholder) { flex: 1; }
    .tp-chevron { transition: transform 0.2s; flex-shrink: 0; color: #9ca3af; }
    .tp-chevron.tp-open { transform: rotate(180deg); }

    /* Popup — identical positioning to dp-popup */
    .tp-popup {
     position: absolute;
  top: calc(100% + 4px);
  left: auto;     /* ← remove left alignment */
  right: 0; 
      width: 100%;
      min-width: 13rem;
      z-index: 99999;
      background: #fff;
      border-radius: 0.75rem;
      box-shadow: 0 0.75rem 2rem rgba(0,0,0,0.15), 0 0 0 0.0625rem rgba(0,0,0,0.06);
      padding: 0.625rem;
      box-sizing: border-box;
      animation: tpFadeIn 0.18s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes tpFadeIn {
      from { opacity: 0; transform: translateY(-0.25rem) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Columns */
    .tp-columns {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .tp-col {
      display: flex; flex-direction: column; align-items: center; flex: 1;
    }

    .tp-col-label {
      font-size: 0.625rem; font-weight: 700; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.04em;
      margin-bottom: 0.25rem;
    }

    .tp-sep {
      font-size: 1.25rem; font-weight: 700; color: #374151;
      padding: 0 0.125rem;
      margin-top: 1.4rem;
    }

    /* Scroll list */
    .tp-scroll {
      height: 6.5rem;
      overflow-y: auto;
      scroll-snap-type: y mandatory;
      scrollbar-width: none;
      -ms-overflow-style: none;
      width: 100%;
      border: 0.09375rem solid #f0f2f7;
      border-radius: 0.5rem;
      background: #fafafa;
    }
    .tp-scroll::-webkit-scrollbar { display: none; }

    .tp-item {
      height: 2.1875rem;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.84375rem; font-weight: 500; color: #6b7280;
      cursor: pointer;
      scroll-snap-align: start;
      transition: all 0.13s;
      font-variant-numeric: tabular-nums;
      border-radius: 0.375rem;
    }
    .tp-item:hover { color: #6366f1; background: #eef2ff; }
    .tp-item.tp-item-active {
      color: #6366f1; font-weight: 700;
      background: #eef2ff;
    }

    /* AM/PM */
    .tp-col-ampm { flex: 0 0 auto; min-width: 3.5rem; }
    .tp-ampm-wrap {
      display: flex; flex-direction: column; gap: 0.3rem;
      width: 100%;
      border: 0.09375rem solid #f0f2f7;
      border-radius: 0.5rem;
      overflow: hidden;
      height: 6.5rem;
      justify-content: center;
      padding: 0.375rem;
      box-sizing: border-box;
      background: #fafafa;
    }
    .tp-ampm {
      padding: 0.375rem 0; border-radius: 0.375rem;
      font-size: 0.78125rem; font-weight: 600; color: #9ca3af;
      cursor: pointer; transition: all 0.13s; text-align: center;
      border: 0.09375rem solid transparent;
    }
    .tp-ampm:hover { color: #6366f1; background: #eef2ff; }
    .tp-ampm.tp-ampm-active {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      box-shadow: 0 0.2rem 0.5rem rgba(99,102,241,0.4);
    }

    /* Footer */
    .tp-footer {
      display: flex; justify-content: flex-end; gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 0.0625rem solid #f0f2f7;
    }
    .tp-cancel {
      padding: 0.375rem 0.875rem; border: 0.09375rem solid #e5e7eb;
      border-radius: 0.5rem; font-size: 0.78125rem; font-weight: 600;
      color: #6b7280; background: #fff; cursor: pointer;
      transition: all 0.15s; font-family: inherit;
    }
    .tp-cancel:hover { background: #f9fafb; }
    .tp-confirm {
      padding: 0.375rem 0.875rem; border: none; border-radius: 0.5rem;
      font-size: 0.78125rem; font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; cursor: pointer; transition: opacity 0.15s;
      font-family: inherit;
      box-shadow: 0 0.2rem 0.5rem rgba(99,102,241,0.35);
    }
    .tp-confirm:hover { opacity: 0.88; }
  `]
})
export class TimePickerComponent implements OnInit, OnChanges {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  selectedTime = '';

  hours = Array.from({ length: 12 }, (_, i) => i + 1);  // 1–12
  minutes = Array.from({ length: 60 }, (_, i) => i);       // 0–59

  selectedHour = 9;
  selectedMin = 0;
  period: 'AM' | 'PM' = 'AM';

  constructor(private el: ElementRef) { }

  ngOnInit() { this.parseValue(); }
  ngOnChanges() { this.parseValue(); }

  private parseValue() {
    if (!this.value) return;
    this.selectedTime = this.value;
    const [hStr, mStr] = this.value.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    this.period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    this.selectedHour = h;
    this.selectedMin = m;
  }

  togglePicker(e: MouseEvent) {
    e.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click')
  onDocClick() { this.isOpen = false; }

  selectHour(h: number) { this.selectedHour = h; }
  selectMin(m: number) { this.selectedMin = m; }
  setPeriod(p: 'AM' | 'PM') { this.period = p; }

  confirm() {
    let h = this.selectedHour;
    if (this.period === 'AM' && h === 12) h = 0;
    if (this.period === 'PM' && h !== 12) h += 12;
    this.selectedTime = `${this.pad(h)}:${this.pad(this.selectedMin)}`;
    this.valueChange.emit(this.selectedTime);
    this.isOpen = false;
  }

  cancel() { this.isOpen = false; }

  pad(n: number): string { return String(n).padStart(2, '0'); }

  formatDisplay(val: string): string {
    if (!val) return '';
    const [h, m] = val.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  }
}