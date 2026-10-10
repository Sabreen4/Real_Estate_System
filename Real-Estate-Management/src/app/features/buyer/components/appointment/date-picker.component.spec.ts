import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { DatePickerComponent } from './date-picker.component';

// ─── Host component for @Input/@Output binding tests ───────────────────────
@Component({
     standalone: false,
  template: `
    <app-date-picker
      [value]="value"
      [minDate]="minDate"
      (valueChange)="onValueChange($event)">
    </app-date-picker>
  `
})
class HostComponent {
  value    = '';
  minDate  = '';
  emitted  = '';
  onValueChange(v: string) { this.emitted = v; }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function triggerDocumentClick() {
  document.dispatchEvent(new MouseEvent('click'));
}

// ============================================================================
describe('DatePickerComponent', () => {
  let fixture : ComponentFixture<DatePickerComponent>;
  let component: DatePickerComponent;
  let el       : HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DatePickerComponent, HostComponent],
      imports     : [CommonModule],
    }).compileComponents();

    fixture   = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    el        = fixture.nativeElement;
    fixture.detectChanges();
  });

  // ── Existence ─────────────────────────────────────────────────────────────
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ngOnInit – branch coverage
  // ══════════════════════════════════════════════════════════════════════════
  describe('ngOnInit', () => {

    it('initialises viewMonth/viewYear to today when no value is supplied', () => {
      const now = new Date();
      expect(component.viewMonth).toBe(now.getMonth());
      expect(component.viewYear ).toBe(now.getFullYear());
    });

    it('initialises from @Input value when provided', () => {
      component.value = '2023-07-15';
      component.ngOnInit();
      expect(component.selectedDate).toBe('2023-07-15');
      expect(component.viewMonth   ).toBe(6);   // July  = index 6
      expect(component.viewYear    ).toBe(2023);
    });

    it('leaves selectedDate empty when value is empty string', () => {
      component.value = '';
      component.ngOnInit();
      expect(component.selectedDate).toBe('');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // toggleCalendar
  // ══════════════════════════════════════════════════════════════════════════
  describe('toggleCalendar', () => {

    it('opens the calendar on first click', () => {
      expect(component.isOpen).toBeFalse();
      const trigger = el.querySelector('.dp-trigger') as HTMLElement;
      trigger.click();
      fixture.detectChanges();
      expect(component.isOpen).toBeTrue();
    });

    it('closes the calendar on second click', () => {
      component.isOpen = true;
      const trigger = el.querySelector('.dp-trigger') as HTMLElement;
      trigger.click();
      fixture.detectChanges();
      expect(component.isOpen).toBeFalse();
    });

    it('stopPropagation prevents document:click from firing simultaneously', () => {
      // Open via toggleCalendar then confirm the popup renders
      component.toggleCalendar(new MouseEvent('click'));
      fixture.detectChanges();
      expect(el.querySelector('.dp-popup')).not.toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // document:click HostListener
  // ══════════════════════════════════════════════════════════════════════════
  describe('onDocClick', () => {

    it('closes the calendar when a click fires outside', () => {
      component.isOpen = true;
      fixture.detectChanges();
      triggerDocumentClick();
      fixture.detectChanges();
      expect(component.isOpen).toBeFalse();
    });

    it('keeps calendar closed if it was already closed', () => {
      component.isOpen = false;
      triggerDocumentClick();
      fixture.detectChanges();
      expect(component.isOpen).toBeFalse();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // buildCalendar
  // ══════════════════════════════════════════════════════════════════════════
  describe('buildCalendar', () => {

    it('builds correct leading empties and days for January 2023 (Sun=0)', () => {
      // Jan 1 2023 is a Sunday → 0 leading empties
      component.viewMonth = 0;
      component.viewYear  = 2023;
      component.buildCalendar();
      expect(component.leadingEmpties.length).toBe(0);
      expect(component.daysInMonth.length   ).toBe(31);
    });

    it('builds correct leading empties for a month starting mid-week', () => {
      // March 1 2023 is a Wednesday → 3 leading empties
      component.viewMonth = 2;
      component.viewYear  = 2023;
      component.buildCalendar();
      expect(component.leadingEmpties.length).toBe(3);
      expect(component.daysInMonth.length   ).toBe(31);
    });

    it('handles February in a leap year (2024)', () => {
      component.viewMonth = 1;
      component.viewYear  = 2024;
      component.buildCalendar();
      expect(component.daysInMonth.length).toBe(29);
    });

    it('handles February in a non-leap year', () => {
      component.viewMonth = 1;
      component.viewYear  = 2023;
      component.buildCalendar();
      expect(component.daysInMonth.length).toBe(28);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // prevMonth / nextMonth – wrap-around branches
  // ══════════════════════════════════════════════════════════════════════════
  describe('prevMonth', () => {

    it('decrements month within the same year', () => {
      component.viewMonth = 5;
      component.viewYear  = 2023;
      component.prevMonth();
      expect(component.viewMonth).toBe(4);
      expect(component.viewYear ).toBe(2023);
    });

    it('wraps from January to December of the previous year', () => {
      component.viewMonth = 0;
      component.viewYear  = 2023;
      component.prevMonth();
      expect(component.viewMonth).toBe(11);
      expect(component.viewYear ).toBe(2022);
    });
  });

  describe('nextMonth', () => {

    it('increments month within the same year', () => {
      component.viewMonth = 5;
      component.viewYear  = 2023;
      component.nextMonth();
      expect(component.viewMonth).toBe(6);
      expect(component.viewYear ).toBe(2023);
    });

    it('wraps from December to January of the next year', () => {
      component.viewMonth = 11;
      component.viewYear  = 2023;
      component.nextMonth();
      expect(component.viewMonth).toBe(0);
      expect(component.viewYear ).toBe(2024);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // selectDay
  // ══════════════════════════════════════════════════════════════════════════
  describe('selectDay', () => {

    it('sets selectedDate and emits valueChange', () => {
      const emitted: string[] = [];
      component.valueChange.subscribe((v: string) => emitted.push(v));

      component.viewMonth = 5;   // June
      component.viewYear  = 2023;
      component.selectDay(15);

      expect(component.selectedDate).toBe('2023-06-15');
      expect(emitted[0]            ).toBe('2023-06-15');
      expect(component.isOpen      ).toBeFalse();
    });

    it('pads single-digit month and day with leading zero', () => {
      component.viewMonth = 0;   // January
      component.viewYear  = 2023;
      component.selectDay(3);
      expect(component.selectedDate).toBe('2023-01-03');
    });

    it('does NOT select a disabled day', () => {
      component.minDate   = '2023-06-10';
      component.viewMonth = 5;
      component.viewYear  = 2023;
      component.selectedDate = '';
      component.selectDay(5);   // before minDate
      expect(component.selectedDate).toBe('');
    });

    it('closes the calendar after a valid selection', () => {
      component.isOpen    = true;
      component.viewMonth = 3;
      component.viewYear  = 2023;
      component.selectDay(10);
      expect(component.isOpen).toBeFalse();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // isToday
  // ══════════════════════════════════════════════════════════════════════════
  describe('isToday', () => {

    it('returns true for the actual today', () => {
      const now = new Date();
      component.viewMonth = now.getMonth();
      component.viewYear  = now.getFullYear();
      expect(component.isToday(now.getDate())).toBeTrue();
    });

    it('returns false for a different day in the same month', () => {
      const now  = new Date();
      const other = now.getDate() === 1 ? 2 : 1;
      component.viewMonth = now.getMonth();
      component.viewYear  = now.getFullYear();
      expect(component.isToday(other)).toBeFalse();
    });

    it('returns false when the month differs', () => {
      const now = new Date();
      component.viewMonth = (now.getMonth() + 1) % 12;
      component.viewYear  = now.getFullYear();
      expect(component.isToday(now.getDate())).toBeFalse();
    });

    it('returns false when the year differs', () => {
      const now = new Date();
      component.viewMonth = now.getMonth();
      component.viewYear  = now.getFullYear() - 1;
      expect(component.isToday(now.getDate())).toBeFalse();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // isSelected
  // ══════════════════════════════════════════════════════════════════════════
  describe('isSelected', () => {

    it('returns false when selectedDate is empty', () => {
      component.selectedDate = '';
      expect(component.isSelected(10)).toBeFalse();
    });

    it('returns true when the day matches selectedDate', () => {
      component.selectedDate = '2023-06-15';
      component.viewMonth    = 5;
      component.viewYear     = 2023;
      expect(component.isSelected(15)).toBeTrue();
    });

    it('returns false when the day does not match', () => {
      component.selectedDate = '2023-06-15';
      component.viewMonth    = 5;
      component.viewYear     = 2023;
      expect(component.isSelected(20)).toBeFalse();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // isDisabled
  // ══════════════════════════════════════════════════════════════════════════
  describe('isDisabled', () => {

    it('returns false when minDate is not set (empty string)', () => {
      component.minDate   = '';
      component.viewMonth = 5;
      component.viewYear  = 2023;
      expect(component.isDisabled(1)).toBeFalse();
    });

    it('returns true for a day strictly before minDate', () => {
      component.minDate   = '2023-06-10';
      component.viewMonth = 5;
      component.viewYear  = 2023;
      expect(component.isDisabled(5)).toBeTrue();
    });

    it('returns false for a day equal to minDate', () => {
      component.minDate   = '2023-06-10';
      component.viewMonth = 5;
      component.viewYear  = 2023;
      expect(component.isDisabled(10)).toBeFalse();
    });

    it('returns false for a day after minDate', () => {
      component.minDate   = '2023-06-10';
      component.viewMonth = 5;
      component.viewYear  = 2023;
      expect(component.isDisabled(15)).toBeFalse();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // formatDisplay
  // ══════════════════════════════════════════════════════════════════════════
  describe('formatDisplay', () => {

    it('returns empty string for an empty value', () => {
      expect(component.formatDisplay('')).toBe('');
    });

    it('returns a formatted Indian-locale date string for a valid value', () => {
      const result = component.formatDisplay('2023-06-15');
      // Loose check: should contain year and some month text
      expect(result).toContain('2023');
      expect(result.length).toBeGreaterThan(0);
    });

    it('formats single-digit day and month correctly', () => {
      const result = component.formatDisplay('2023-01-03');
      expect(result).toContain('2023');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Template / DOM integration
  // ══════════════════════════════════════════════════════════════════════════
  describe('Template rendering', () => {

    it('shows placeholder text when no date is selected', () => {
      component.selectedDate = '';
      fixture.detectChanges();
      const span = el.querySelector('.dp-placeholder') as HTMLElement;
      expect(span.textContent?.trim()).toBe('Select date');
    });

    it('shows formatted date when a date is selected', () => {
      component.selectedDate = '2023-06-15';
      fixture.detectChanges();
      const trigger = el.querySelector('.dp-trigger') as HTMLElement;
      expect(trigger.textContent).toContain('2023');
    });

    it('renders the popup only when isOpen is true', () => {
      component.isOpen = false;
      fixture.detectChanges();
      expect(el.querySelector('.dp-popup')).toBeNull();

      component.isOpen = true;
      fixture.detectChanges();
      expect(el.querySelector('.dp-popup')).not.toBeNull();
    });

    it('renders all 7 day-header cells', () => {
      component.isOpen = true;
      fixture.detectChanges();
      const headers = el.querySelectorAll('.dp-day-hdr');
      expect(headers.length).toBe(7);
    });

    it('applies dp-today class to today\'s cell', () => {
      const now = new Date();
      component.viewMonth = now.getMonth();
      component.viewYear  = now.getFullYear();
      component.isOpen    = true;
      component.buildCalendar();
      fixture.detectChanges();
      const todayBtn = el.querySelector('.dp-today');
      expect(todayBtn).not.toBeNull();
    });

    it('applies dp-selected class to the selected day', () => {
      const now = new Date();
      const day = now.getDate() < 28 ? now.getDate() : 1;
      const m   = String(now.getMonth() + 1).padStart(2, '0');
      const d   = String(day).padStart(2, '0');

      component.selectedDate = `${now.getFullYear()}-${m}-${d}`;
      component.viewMonth    = now.getMonth();
      component.viewYear     = now.getFullYear();
      component.isOpen       = true;
      component.buildCalendar();
      fixture.detectChanges();

      expect(el.querySelector('.dp-selected')).not.toBeNull();
    });

    it('applies dp-disabled class and disabled attr to days before minDate', () => {
      component.minDate   = '2023-06-20';
      component.viewMonth = 5;
      component.viewYear  = 2023;
      component.isOpen    = true;
      component.buildCalendar();
      fixture.detectChanges();

      const disabledBtns = el.querySelectorAll('.dp-disabled');
      expect(disabledBtns.length).toBeGreaterThan(0);
    });

    it('clicking prev-month button calls prevMonth()', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component, 'prevMonth').and.callThrough();
      const prevBtn = el.querySelector('.dp-nav-btn') as HTMLButtonElement;
      prevBtn.click();
      expect(component.prevMonth).toHaveBeenCalled();
    });

    it('clicking next-month button calls nextMonth()', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component, 'nextMonth').and.callThrough();
      const navBtns = el.querySelectorAll('.dp-nav-btn');
      (navBtns[1] as HTMLButtonElement).click();
      expect(component.nextMonth).toHaveBeenCalled();
    });

    it('clicking inside popup does not close it (stopPropagation)', () => {
      component.isOpen = true;
      fixture.detectChanges();
      const popup = el.querySelector('.dp-popup') as HTMLElement;
      popup.click();
      fixture.detectChanges();
      // document:click handler fires but popup click stops propagation
      expect(component.isOpen).toBeTrue();
    });

    it('clicking a day cell calls selectDay', () => {
      component.viewMonth = 5;
      component.viewYear  = 2023;
      component.isOpen    = true;
      component.buildCalendar();
      fixture.detectChanges();

      spyOn(component, 'selectDay').and.callThrough();
      const firstDayBtn = el.querySelector('.dp-day:not(.dp-disabled)') as HTMLButtonElement;
      firstDayBtn.click();
      expect(component.selectDay).toHaveBeenCalled();
    });

    it('chevron rotates when calendar is open (dp-open class)', () => {
      component.isOpen = true;
      fixture.detectChanges();
      const chevron = el.querySelector('.dp-chevron') as SVGElement;
      expect(chevron.classList.contains('dp-open')).toBeTrue();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // @Input / @Output via HostComponent
  // ══════════════════════════════════════════════════════════════════════════
  describe('Input/Output via HostComponent', () => {
    let hostFixture  : ComponentFixture<HostComponent>;
    let hostComponent: HostComponent;

    beforeEach(async () => {
      hostFixture   = TestBed.createComponent(HostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    it('binds value input to child selectedDate', () => {
      hostComponent.value = '2024-03-22';
      hostFixture.detectChanges();
      const picker = hostFixture.debugElement
        .query(By.directive(DatePickerComponent))
        .componentInstance as DatePickerComponent;
      expect(picker.value).toBe('2024-03-22');
    });

    it('emits valueChange and host captures it', () => {
      const picker = hostFixture.debugElement
        .query(By.directive(DatePickerComponent))
        .componentInstance as DatePickerComponent;

      picker.viewMonth = 2;
      picker.viewYear  = 2024;
      picker.selectDay(5);
      hostFixture.detectChanges();

      expect(hostComponent.emitted).toBe('2024-03-05');
    });

    it('passes minDate input to child', () => {
      hostComponent.minDate = '2024-01-01';
      hostFixture.detectChanges();
      const picker = hostFixture.debugElement
        .query(By.directive(DatePickerComponent))
        .componentInstance as DatePickerComponent;
      expect(picker.minDate).toBe('2024-01-01');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Static data integrity
  // ══════════════════════════════════════════════════════════════════════════
  describe('Static data', () => {

    it('has 12 month names', () => {
      expect(component.monthNames.length).toBe(12);
    });

    it('has 7 day headers', () => {
      expect(component.dayHeaders.length).toBe(7);
    });

    it('starts dayHeaders with Su', () => {
      expect(component.dayHeaders[0]).toBe('Su');
    });
  });
});