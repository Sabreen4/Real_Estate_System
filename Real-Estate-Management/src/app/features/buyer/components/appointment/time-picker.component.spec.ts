import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { TimePickerComponent } from './time-picker.component';

// ─── Host component for @Input / @Output binding tests ──────────────────────
@Component({
     standalone: false,
  template: `
    <app-time-picker
      [value]="value"
      (valueChange)="onValueChange($event)">
    </app-time-picker>
  `
})
class HostComponent {
  value   = '';
  emitted = '';
  onValueChange(v: string) { this.emitted = v; }
}

// ─── Helper ─────────────────────────────────────────────────────────────────
function triggerDocumentClick() {
  document.dispatchEvent(new MouseEvent('click'));
}

// ============================================================================
describe('TimePickerComponent', () => {
  let fixture  : ComponentFixture<TimePickerComponent>;
  let component: TimePickerComponent;
  let el       : HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimePickerComponent, HostComponent],
      imports     : [CommonModule],
    }).compileComponents();

    fixture   = TestBed.createComponent(TimePickerComponent);
    component = fixture.componentInstance;
    el        = fixture.nativeElement;
    fixture.detectChanges();
  });

  // ── Existence ─────────────────────────────────────────────────────────────
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Static data
  // ══════════════════════════════════════════════════════════════════════════
  describe('Static data', () => {

    it('hours array runs 1–12 (length 12)', () => {
      expect(component.hours.length).toBe(12);
      expect(component.hours[0]    ).toBe(1);
      expect(component.hours[11]   ).toBe(12);
    });

    it('minutes array runs 0–59 (length 60)', () => {
      expect(component.minutes.length).toBe(60);
      expect(component.minutes[0]    ).toBe(0);
      expect(component.minutes[59]   ).toBe(59);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ngOnInit / ngOnChanges → parseValue (private, tested via public interface)
  // ══════════════════════════════════════════════════════════════════════════
  describe('parseValue (via ngOnInit / ngOnChanges)', () => {

    it('does nothing when value is empty string', () => {
      component.value = '';
      component.ngOnInit();
      expect(component.selectedTime).toBe('');
      expect(component.selectedHour).toBe(9);   // default
      expect(component.selectedMin ).toBe(0);
      expect(component.period      ).toBe('AM');
    });

    it('parses an AM time correctly (09:30)', () => {
      component.value = '09:30';
      component.ngOnInit();
      expect(component.selectedTime).toBe('09:30');
      expect(component.selectedHour).toBe(9);
      expect(component.selectedMin ).toBe(30);
      expect(component.period      ).toBe('AM');
    });

    it('parses a PM time correctly (14:45)', () => {
      component.value = '14:45';
      component.ngOnInit();
      expect(component.selectedHour).toBe(2);    // 14 % 12 = 2
      expect(component.selectedMin ).toBe(45);
      expect(component.period      ).toBe('PM');
    });

    it('parses midnight (00:00) – hour becomes 12 AM', () => {
      component.value = '00:00';
      component.ngOnInit();
      expect(component.selectedHour).toBe(12);   // 0 % 12 = 0 → 12
      expect(component.period      ).toBe('AM');
    });

    it('parses noon (12:00) – hour stays 12 PM', () => {
      component.value = '12:00';
      component.ngOnInit();
      expect(component.selectedHour).toBe(12);   // 12 % 12 = 0 → 12
      expect(component.period      ).toBe('PM');
    });

    it('ngOnChanges calls parseValue on input change', () => {
      component.value = '16:05';
      component.ngOnChanges();
      expect(component.selectedHour).toBe(4);
      expect(component.selectedMin ).toBe(5);
      expect(component.period      ).toBe('PM');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // togglePicker
  // ══════════════════════════════════════════════════════════════════════════
  describe('togglePicker', () => {

    it('opens the picker when closed', () => {
      expect(component.isOpen).toBeFalse();
      component.togglePicker(new MouseEvent('click'));
      expect(component.isOpen).toBeTrue();
    });

    it('closes the picker when open', () => {
      component.isOpen = true;
      component.togglePicker(new MouseEvent('click'));
      expect(component.isOpen).toBeFalse();
    });

    it('stopPropagation prevents document:click from interfering', () => {
      const trigger = el.querySelector('.tp-trigger') as HTMLElement;
      trigger.click();
      fixture.detectChanges();
      expect(el.querySelector('.tp-popup')).not.toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // document:click HostListener
  // ══════════════════════════════════════════════════════════════════════════
  describe('onDocClick', () => {

    it('closes the picker on outside click', () => {
      component.isOpen = true;
      triggerDocumentClick();
      fixture.detectChanges();
      expect(component.isOpen).toBeFalse();
    });

    it('keeps picker closed if already closed', () => {
      component.isOpen = false;
      triggerDocumentClick();
      expect(component.isOpen).toBeFalse();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // selectHour / selectMin / setPeriod
  // ══════════════════════════════════════════════════════════════════════════
  describe('selectHour', () => {
    it('updates selectedHour', () => {
      component.selectHour(7);
      expect(component.selectedHour).toBe(7);
    });
  });

  describe('selectMin', () => {
    it('updates selectedMin', () => {
      component.selectMin(45);
      expect(component.selectedMin).toBe(45);
    });
  });

  describe('setPeriod', () => {
    it('sets period to AM', () => {
      component.period = 'PM';
      component.setPeriod('AM');
      expect(component.period).toBe('AM');
    });

    it('sets period to PM', () => {
      component.period = 'AM';
      component.setPeriod('PM');
      expect(component.period).toBe('PM');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // confirm – all four branches of hour adjustment
  // ══════════════════════════════════════════════════════════════════════════
  describe('confirm', () => {

    it('emits correct 24h time and closes picker — AM normal (9 AM → 09:xx)', () => {
      const emitted: string[] = [];
      component.valueChange.subscribe((v: string) => emitted.push(v));

      component.selectedHour = 9;
      component.selectedMin  = 30;
      component.period       = 'AM';
      component.isOpen       = true;
      component.confirm();

      expect(component.selectedTime).toBe('09:30');
      expect(emitted[0]            ).toBe('09:30');
      expect(component.isOpen      ).toBeFalse();
    });

    it('converts 12 AM (midnight) to 00:xx', () => {
      component.selectedHour = 12;
      component.selectedMin  = 0;
      component.period       = 'AM';
      component.confirm();
      expect(component.selectedTime).toBe('00:00');
    });

    it('converts 12 PM (noon) to 12:xx — no addition', () => {
      component.selectedHour = 12;
      component.selectedMin  = 0;
      component.period       = 'PM';
      component.confirm();
      expect(component.selectedTime).toBe('12:00');
    });

    it('converts PM non-noon hour correctly (2 PM → 14:xx)', () => {
      component.selectedHour = 2;
      component.selectedMin  = 45;
      component.period       = 'PM';
      component.confirm();
      expect(component.selectedTime).toBe('14:45');
    });

    it('pads single-digit minutes with leading zero', () => {
      component.selectedHour = 1;
      component.selectedMin  = 5;
      component.period       = 'AM';
      component.confirm();
      expect(component.selectedTime).toBe('01:05');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // cancel
  // ══════════════════════════════════════════════════════════════════════════
  describe('cancel', () => {

    it('closes the picker without emitting', () => {
      const emitted: string[] = [];
      component.valueChange.subscribe((v: string) => emitted.push(v));
      component.isOpen = true;
      component.cancel();
      expect(component.isOpen).toBeFalse();
      expect(emitted.length  ).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // pad
  // ══════════════════════════════════════════════════════════════════════════
  describe('pad', () => {

    it('pads single digit with leading zero', () => {
      expect(component.pad(5)).toBe('05');
    });

    it('does not pad double-digit numbers', () => {
      expect(component.pad(12)).toBe('12');
    });

    it('handles zero', () => {
      expect(component.pad(0)).toBe('00');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // formatDisplay – all branches
  // ══════════════════════════════════════════════════════════════════════════
  describe('formatDisplay', () => {

    it('returns empty string for empty input', () => {
      expect(component.formatDisplay('')).toBe('');
    });

    it('formats an AM time correctly (09:05 → 9:05 AM)', () => {
      expect(component.formatDisplay('09:05')).toBe('9:05 AM');
    });

    it('formats a PM time correctly (14:30 → 2:30 PM)', () => {
      expect(component.formatDisplay('14:30')).toBe('2:30 PM');
    });

    it('formats midnight (00:00 → 12:00 AM)', () => {
      expect(component.formatDisplay('00:00')).toBe('12:00 AM');
    });

    it('formats noon (12:00 → 12:00 PM)', () => {
      expect(component.formatDisplay('12:00')).toBe('12:00 PM');
    });

    it('pads single-digit minutes in display (10:05 → 10:05 AM)', () => {
      expect(component.formatDisplay('10:05')).toBe('10:05 AM');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Template / DOM integration
  // ══════════════════════════════════════════════════════════════════════════
  describe('Template rendering', () => {

    it('shows placeholder when no time is selected', () => {
      component.selectedTime = '';
      fixture.detectChanges();
      const span = el.querySelector('.tp-placeholder') as HTMLElement;
      expect(span.textContent?.trim()).toBe('Select time');
    });

    it('shows formatted time when a time is selected', () => {
      component.selectedTime = '09:30';
      fixture.detectChanges();
      const trigger = el.querySelector('.tp-trigger') as HTMLElement;
      expect(trigger.textContent).toContain('AM');
    });

    it('renders popup only when isOpen is true', () => {
      component.isOpen = false;
      fixture.detectChanges();
      expect(el.querySelector('.tp-popup')).toBeNull();

      component.isOpen = true;
      fixture.detectChanges();
      expect(el.querySelector('.tp-popup')).not.toBeNull();
    });

    it('chevron has tp-open class when picker is open', () => {
      component.isOpen = true;
      fixture.detectChanges();
      expect(el.querySelector('.tp-chevron.tp-open')).not.toBeNull();
    });

    it('trigger has tp-open class when picker is open', () => {
      component.isOpen = true;
      fixture.detectChanges();
      expect(el.querySelector('.tp-trigger.tp-open')).not.toBeNull();
    });

    it('renders 12 hour items in the scroll list', () => {
      component.isOpen = true;
      fixture.detectChanges();
      const hourItems = el.querySelectorAll('.tp-col:first-child .tp-item');
      expect(hourItems.length).toBe(12);
    });

    it('renders 60 minute items in the scroll list', () => {
      component.isOpen = true;
      fixture.detectChanges();
      // Minutes col is the 3rd .tp-col (0-indexed: 0=hours, 1=sep(not col), 2=mins)
      const allCols   = el.querySelectorAll('.tp-col');
      const minuteCol = allCols[1]; // second tp-col (index 1, sep is a sibling div not tp-col)
      const minItems  = minuteCol.querySelectorAll('.tp-item');
      expect(minItems.length).toBe(60);
    });

    it('applies tp-item-active to the selected hour', () => {
      component.selectedHour = 3;
      component.isOpen = true;
      fixture.detectChanges();
      const activeItem = el.querySelector('.tp-col:first-child .tp-item-active') as HTMLElement;
      expect(activeItem).not.toBeNull();
      expect(activeItem.textContent?.trim()).toBe('03');
    });

    it('applies tp-item-active to the selected minute', () => {
      component.selectedMin = 15;
      component.isOpen = true;
      fixture.detectChanges();
      const allCols   = el.querySelectorAll('.tp-col');
      const minuteCol = allCols[1];
      const activeMin = minuteCol.querySelector('.tp-item-active') as HTMLElement;
      expect(activeMin).not.toBeNull();
      expect(activeMin.textContent?.trim()).toBe('15');
    });

    it('applies tp-ampm-active to AM when period is AM', () => {
      component.period = 'AM';
      component.isOpen = true;
      fixture.detectChanges();
      const amBtn = el.querySelectorAll('.tp-ampm')[0];
      expect(amBtn.classList.contains('tp-ampm-active')).toBeTrue();
    });

    it('applies tp-ampm-active to PM when period is PM', () => {
      component.period = 'PM';
      component.isOpen = true;
      fixture.detectChanges();
      const pmBtn = el.querySelectorAll('.tp-ampm')[1];
      expect(pmBtn.classList.contains('tp-ampm-active')).toBeTrue();
    });

    it('clicking a hour item calls selectHour', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component, 'selectHour').and.callThrough();
      const firstHour = el.querySelector('.tp-col:first-child .tp-item') as HTMLElement;
      firstHour.click();
      expect(component.selectHour).toHaveBeenCalledWith(1);
    });

    it('clicking a minute item calls selectMin', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component, 'selectMin').and.callThrough();
      const allCols   = el.querySelectorAll('.tp-col');
      const firstMin  = allCols[1].querySelector('.tp-item') as HTMLElement;
      firstMin.click();
      expect(component.selectMin).toHaveBeenCalledWith(0);
    });

    it('clicking AM button calls setPeriod(\'AM\')', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component, 'setPeriod').and.callThrough();
      (el.querySelectorAll('.tp-ampm')[0] as HTMLElement).click();
      expect(component.setPeriod).toHaveBeenCalledWith('AM');
    });

    it('clicking PM button calls setPeriod(\'PM\')', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component, 'setPeriod').and.callThrough();
      (el.querySelectorAll('.tp-ampm')[1] as HTMLElement).click();
      expect(component.setPeriod).toHaveBeenCalledWith('PM');
    });

    it('clicking Set Time button calls confirm()', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component, 'confirm').and.callThrough();
      (el.querySelector('.tp-confirm') as HTMLButtonElement).click();
      expect(component.confirm).toHaveBeenCalled();
    });

    it('clicking Cancel button calls cancel()', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component, 'cancel').and.callThrough();
      (el.querySelector('.tp-cancel') as HTMLButtonElement).click();
      expect(component.cancel).toHaveBeenCalled();
    });

    it('clicking inside popup does not close it (stopPropagation)', () => {
      component.isOpen = true;
      fixture.detectChanges();
      const popup = el.querySelector('.tp-popup') as HTMLElement;
      popup.click();
      fixture.detectChanges();
      expect(component.isOpen).toBeTrue();
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

    it('binds value input to child and parses it', () => {
      hostComponent.value = '15:30';
      hostFixture.detectChanges();
      const picker = hostFixture.debugElement
        .query(By.directive(TimePickerComponent))
        .componentInstance as TimePickerComponent;
      expect(picker.selectedHour).toBe(3);
      expect(picker.period      ).toBe('PM');
    });

    it('emits valueChange and host captures it', () => {
      const picker = hostFixture.debugElement
        .query(By.directive(TimePickerComponent))
        .componentInstance as TimePickerComponent;

      picker.selectedHour = 5;
      picker.selectedMin  = 10;
      picker.period       = 'AM';
      picker.confirm();
      hostFixture.detectChanges();

      expect(hostComponent.emitted).toBe('05:10');
    });
  });
});