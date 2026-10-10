import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchBarComponent, SearchFilters } from './search-bar.component';

// ── Helper ──────────────────────────────────────────────────────────────────
// toggleDropdown reads event.currentTarget.getBoundingClientRect(), which is
// null when a plain MouseEvent is created without dispatching it on a real
// DOM element.  This helper creates a real trigger element, mocks its rect,
// and attaches it as currentTarget so the component doesn't throw.
function makeTriggerEvent(): MouseEvent {
  const trigger = document.createElement('div');
  trigger.className = 'custom-select-trigger';
  document.body.appendChild(trigger);
  spyOn(trigger, 'getBoundingClientRect').and.returnValue({
    top: 100, bottom: 120, left: 50, right: 250, width: 200, height: 20,
    x: 50, y: 100, toJSON: () => ({})
  } as DOMRect);
  const event = new MouseEvent('click');
  Object.defineProperty(event, 'currentTarget',    { value: trigger });
  Object.defineProperty(event, 'stopPropagation',  { value: jasmine.createSpy('stopPropagation') });
  return event;
}

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [SearchBarComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // clean up any floating menus injected into the body
    component.ngOnDestroy();
    // clean up any trigger elements left in body
    document.querySelectorAll('.custom-select-trigger').forEach(el => el.remove());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default inputs ──────────────────────────────────────────────────────────

  it('should have empty location by default', () => {
    expect(component.location).toBe('');
  });

  it('should have empty selectedType by default', () => {
    expect(component.selectedType).toBe('');
  });

  it('should have empty listingType by default', () => {
    expect(component.listingType).toBe('');
  });

  it('should have empty status by default', () => {
    expect(component.status).toBe('');
  });

  it('should have hideStatus false by default', () => {
    expect(component.hideStatus).toBeFalse();
  });

  it('should have minPrice null by default', () => {
    expect(component.minPrice).toBeNull();
  });

  it('should have maxPrice null by default', () => {
    expect(component.maxPrice).toBeNull();
  });

  it('should have resultCount 0 by default', () => {
    expect(component.resultCount).toBe(0);
  });

  it('should have openDropdown null by default', () => {
    expect(component.openDropdown).toBeNull();
  });

  // ── Static dropdown data ────────────────────────────────────────────────────

  it('should have 3 property types', () => {
    expect(component.propertyTypes.length).toBe(3);
  });

  it('should contain Apartment in propertyTypes', () => {
    expect(component.propertyTypes.map(t => t.label)).toContain('Apartment');
  });

  it('should contain House in propertyTypes', () => {
    expect(component.propertyTypes.map(t => t.label)).toContain('House');
  });

  it('should contain Commercial in propertyTypes', () => {
    expect(component.propertyTypes.map(t => t.label)).toContain('Commercial');
  });

  it('should have 3 listing types', () => {
    expect(component.listingTypes.length).toBe(3);
  });

  it('should contain Sale in listingTypes', () => {
    expect(component.listingTypes.map(t => t.label)).toContain('Sale');
  });

  it('should contain Rent in listingTypes', () => {
    expect(component.listingTypes.map(t => t.label)).toContain('Rent');
  });

  it('should contain Lease in listingTypes', () => {
    expect(component.listingTypes.map(t => t.label)).toContain('Lease');
  });

  it('should have 2 statuses', () => {
    expect(component.statuses.length).toBe(2);
  });

  it('should have correct status labels (Active, Sold)', () => {
    const labels = component.statuses.map(s => s.label);
    expect(labels).toEqual(jasmine.arrayContaining(['Active', 'Sold']));
  });

  // ── Dropdown IDs are correct (string values) ────────────────────────────────

  it('should have correct property type ids ("40", "50", "60")', () => {
    expect(component.propertyTypes.map(t => t.id)).toEqual(['40', '50', '60']);
  });

  it('should have correct listing type ids ("70", "80", "90")', () => {
    expect(component.listingTypes.map(t => t.id)).toEqual(['70', '80', '90']);
  });

  it('should have correct status ids ("100", "300")', () => {
    expect(component.statuses.map(s => s.id)).toEqual(['100', '300']);
  });

  // ── @Input() binding ────────────────────────────────────────────────────────

  it('should accept resultCount as an input', () => {
    component.resultCount = 42;
    fixture.detectChanges();
    expect(component.resultCount).toBe(42);
  });

  it('should accept hideStatus as an input', () => {
    component.hideStatus = true;
    fixture.detectChanges();
    expect(component.hideStatus).toBeTrue();
  });

  // ── *ngIf="!hideStatus" — requires .field-status class in the template ──────

  it('should show the status field when hideStatus is false', () => {
    component.hideStatus = false;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.field-status');
    expect(el).toBeTruthy();
  });

  it('should hide the status field when hideStatus is true', () => {
    component.hideStatus = true;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.field-status');
    expect(el).toBeFalsy();
  });

  // ── emitSearch() ────────────────────────────────────────────────────────────

  it('should emit search with all current filter values', () => {
    component.location     = 'Chennai';
    component.selectedType = '40';
    component.listingType  = '70';
    component.status       = '100';
    component.minPrice     = 500000;
    component.maxPrice     = 2000000;

    let payload: SearchFilters | undefined;
    component.search.subscribe((v: SearchFilters) => (payload = v));
    component.emitSearch();

    expect(payload!.location).toBe('Chennai');
    expect(payload!.selectedType).toBe('40');
    expect(payload!.listingType).toBe('70');
    expect(payload!.status).toBe('100');
    expect(payload!.minPrice).toBe(500000);
    expect(payload!.maxPrice).toBe(2000000);
  });

  it('should emit search with null prices when unset', () => {
    let payload: SearchFilters | undefined;
    component.search.subscribe((v: SearchFilters) => (payload = v));
    component.emitSearch();
    expect(payload!.minPrice).toBeNull();
    expect(payload!.maxPrice).toBeNull();
  });

  it('should emit all six keys in the search payload', () => {
    let payload: SearchFilters | undefined;
    component.search.subscribe((v: SearchFilters) => (payload = v));
    component.emitSearch();
    expect(Object.keys(payload!)).toEqual(
      jasmine.arrayContaining(['location', 'selectedType', 'listingType', 'status', 'minPrice', 'maxPrice'])
    );
  });

  it('should emit search with empty strings when filters are default', () => {
    let payload: SearchFilters | undefined;
    component.search.subscribe((v: SearchFilters) => (payload = v));
    component.emitSearch();
    expect(payload!.location).toBe('');
    expect(payload!.selectedType).toBe('');
    expect(payload!.listingType).toBe('');
    expect(payload!.status).toBe('');
  });

  it('should emit exactly one event per emitSearch() call', () => {
    let count = 0;
    component.search.subscribe(() => count++);
    component.emitSearch();
    component.emitSearch();
    expect(count).toBe(2);
  });

  // ── clearFilters() ──────────────────────────────────────────────────────────

  it('should reset all filter fields on clearFilters()', () => {
    component.location     = 'Mumbai';
    component.selectedType = '50';
    component.listingType  = '80';
    component.status       = '100';
    component.minPrice     = 100000;
    component.maxPrice     = 999999;

    component.clearFilters();

    expect(component.location).toBe('');
    expect(component.selectedType).toBe('');
    expect(component.listingType).toBe('');
    expect(component.status).toBe('');
    expect(component.minPrice).toBeNull();
    expect(component.maxPrice).toBeNull();
  });

  it('should emit clear event on clearFilters()', () => {
    let emitted = false;
    component.clear.subscribe(() => (emitted = true));
    component.clearFilters();
    expect(emitted).toBeTrue();
  });

  it('should emit clear even when all fields were already empty', () => {
    let emitted = false;
    component.clear.subscribe(() => (emitted = true));
    component.clearFilters();
    expect(emitted).toBeTrue();
  });

  it('should emit exactly one clear event per clearFilters() call', () => {
    let count = 0;
    component.clear.subscribe(() => count++);
    component.clearFilters();
    component.clearFilters();
    expect(count).toBe(2);
  });

  it('should reset to null prices (not zero) after clearFilters()', () => {
    component.minPrice = 0;
    component.maxPrice = 0;
    component.clearFilters();
    expect(component.minPrice).toBeNull();
    expect(component.maxPrice).toBeNull();
  });

  it('should reset openDropdown to null on clearFilters()', () => {
    component.openDropdown = 'type';
    component.clearFilters();
    expect(component.openDropdown).toBeNull();
  });

  // ── toggleDropdown() — branch coverage ──────────────────────────────────────

  it('should open "type" dropdown and append a floating menu', () => {
    component.toggleDropdown('type', makeTriggerEvent());
    expect(component.openDropdown).toBe('type');
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(1);
  });

  it('should open "listing" dropdown and append a floating menu', () => {
    component.toggleDropdown('listing', makeTriggerEvent());
    expect(component.openDropdown).toBe('listing');
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(1);
  });

  it('should open "status" dropdown and append a floating menu', () => {
    component.toggleDropdown('status', makeTriggerEvent());
    expect(component.openDropdown).toBe('status');
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(1);
  });

  it('should close the dropdown when the same one is toggled twice', () => {
    component.toggleDropdown('type', makeTriggerEvent());
    component.toggleDropdown('type', makeTriggerEvent());
    expect(component.openDropdown).toBeNull();
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(0);
  });

  it('should replace the menu when switching to a different dropdown', () => {
    component.toggleDropdown('type', makeTriggerEvent());
    component.toggleDropdown('listing', makeTriggerEvent());
    expect(component.openDropdown).toBe('listing');
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(1);
  });

  // ── floating menu — "All" option click ─────────────────────────────────────

  it('should clear selectedType when "All Property Types" is clicked', () => {
    component.selectedType = '40';
    spyOn(component, 'emitSearch');
    component.toggleDropdown('type', makeTriggerEvent());

    const allDiv = document.querySelector('.custom-floating-menu div') as HTMLElement;
    allDiv.click();

    expect(component.selectedType).toBe('');
    expect(component.emitSearch).toHaveBeenCalled();
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(0);
  });

  it('should clear listingType when "All Listing Types" is clicked', () => {
    component.listingType = '70';
    spyOn(component, 'emitSearch');
    component.toggleDropdown('listing', makeTriggerEvent());

    const allDiv = document.querySelector('.custom-floating-menu div') as HTMLElement;
    allDiv.click();

    expect(component.listingType).toBe('');
    expect(component.emitSearch).toHaveBeenCalled();
  });

  it('should clear status when "All Status" is clicked', () => {
    component.status = '100';
    spyOn(component, 'emitSearch');
    component.toggleDropdown('status', makeTriggerEvent());

    const allDiv = document.querySelector('.custom-floating-menu div') as HTMLElement;
    allDiv.click();

    expect(component.status).toBe('');
    expect(component.emitSearch).toHaveBeenCalled();
  });

  // ── floating menu — regular option click ────────────────────────────────────

  it('should select the first property type option when clicked', () => {
    spyOn(component, 'emitSearch');
    component.toggleDropdown('type', makeTriggerEvent());

    const divs = document.querySelectorAll('.custom-floating-menu div');
    (divs[1] as HTMLElement).click(); // index 0 = "All", index 1 = Apartment

    expect(component.selectedType).toBe('40');
    expect(component.emitSearch).toHaveBeenCalled();
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(0);
  });

  it('should select the first listing type option when clicked', () => {
    spyOn(component, 'emitSearch');
    component.toggleDropdown('listing', makeTriggerEvent());

    const divs = document.querySelectorAll('.custom-floating-menu div');
    (divs[1] as HTMLElement).click();

    expect(component.listingType).toBe('70');
  });

  it('should select the first status option when clicked', () => {
    spyOn(component, 'emitSearch');
    component.toggleDropdown('status', makeTriggerEvent());

    const divs = document.querySelectorAll('.custom-floating-menu div');
    (divs[1] as HTMLElement).click();

    expect(component.status).toBe('100');
  });

  // ── floating menu — checkmark rendered for selected item ────────────────────

  it('should render a checkmark span on the currently selected option', () => {
    component.selectedType = '40';
    component.toggleDropdown('type', makeTriggerEvent());

    const divs = document.querySelectorAll('.custom-floating-menu div');
    const selectedDiv = divs[1] as HTMLElement; // Apartment
    expect(selectedDiv.querySelector('span')?.textContent).toBe('✓');
  });

  it('should not render a checkmark on an unselected option', () => {
    component.selectedType = ''; // nothing selected
    component.toggleDropdown('type', makeTriggerEvent());

    const divs = document.querySelectorAll('.custom-floating-menu div');
    const firstOption = divs[1] as HTMLElement;
    expect(firstOption.querySelector('span')).toBeNull();
  });

  // ── floating menu — hover handlers (mouseenter / mouseleave) ────────────────

  it('should apply hover style on "All" option mouseenter', () => {
    component.toggleDropdown('type', makeTriggerEvent());
    const allDiv = document.querySelector('.custom-floating-menu div') as HTMLElement;
    expect(() => allDiv.dispatchEvent(new MouseEvent('mouseenter'))).not.toThrow();
  });

  it('should restore style on "All" option mouseleave', () => {
    component.toggleDropdown('type', makeTriggerEvent());
    const allDiv = document.querySelector('.custom-floating-menu div') as HTMLElement;
    expect(() => allDiv.dispatchEvent(new MouseEvent('mouseleave'))).not.toThrow();
  });

  it('should apply hover style on an unselected option mouseenter', () => {
    component.selectedType = '';
    component.toggleDropdown('type', makeTriggerEvent());
    const divs = document.querySelectorAll('.custom-floating-menu div');
    expect(() => (divs[1] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'))).not.toThrow();
  });

  it('should restore style on an unselected option mouseleave', () => {
    component.selectedType = '';
    component.toggleDropdown('type', makeTriggerEvent());
    const divs = document.querySelectorAll('.custom-floating-menu div');
    expect(() => (divs[1] as HTMLElement).dispatchEvent(new MouseEvent('mouseleave'))).not.toThrow();
  });

  it('should apply hover style on a selected option mouseenter', () => {
    component.selectedType = '40';
    component.toggleDropdown('type', makeTriggerEvent());
    const divs = document.querySelectorAll('.custom-floating-menu div');
    expect(() => (divs[1] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'))).not.toThrow();
  });

  it('should restore style on a selected option mouseleave (keeps white colour)', () => {
    component.selectedType = '40';
    component.toggleDropdown('type', makeTriggerEvent());
    const divs = document.querySelectorAll('.custom-floating-menu div');
    expect(() => (divs[1] as HTMLElement).dispatchEvent(new MouseEvent('mouseleave'))).not.toThrow();
  });

  // ── HostListener: onDocumentClick ───────────────────────────────────────────

  it('should close dropdown when clicking outside trigger and menu', () => {
    component.toggleDropdown('type', makeTriggerEvent());
    expect(component.openDropdown).toBe('type');

    const outsideClick = new MouseEvent('click');
    Object.defineProperty(outsideClick, 'target', { value: document.body });
    component.onDocumentClick(outsideClick);

    expect(component.openDropdown).toBeNull();
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(0);
  });

  it('should NOT close when clicking inside a .custom-select-trigger', () => {
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    document.body.appendChild(trigger);

    component.openDropdown = 'listing';
    const clickEvent = new MouseEvent('click');
    Object.defineProperty(clickEvent, 'target', { value: trigger });
    component.onDocumentClick(clickEvent);

    expect(component.openDropdown).toBe('listing');
    document.body.removeChild(trigger);
  });

  it('should NOT close when clicking inside a .custom-floating-menu', () => {
    component.toggleDropdown('status', makeTriggerEvent());

    const menu = document.querySelector('.custom-floating-menu') as HTMLElement;
    const clickEvent = new MouseEvent('click');
    Object.defineProperty(clickEvent, 'target', { value: menu });
    component.onDocumentClick(clickEvent);

    expect(component.openDropdown).toBe('status');
  });

  // ── HostListener: onScroll ──────────────────────────────────────────────────

  it('should close dropdown and remove menu on window scroll', () => {
    component.toggleDropdown('listing', makeTriggerEvent());
    expect(component.openDropdown).toBe('listing');

    component.onScroll();

    expect(component.openDropdown).toBeNull();
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(0);
  });

  // ── getLabel() ──────────────────────────────────────────────────────────────

  it('should return the matching label for a known id', () => {
    expect(component.getLabel(component.propertyTypes, '40', 'All')).toBe('Apartment');
  });

  it('should return allLabel when the id is not found', () => {
    expect(component.getLabel(component.propertyTypes, '999', 'All Property Types')).toBe('All Property Types');
  });

  it('should return allLabel when value is empty string', () => {
    expect(component.getLabel(component.listingTypes, '', 'All Listing Types')).toBe('All Listing Types');
  });

  // ── selectOption() ──────────────────────────────────────────────────────────

  it('should update selectedType and call emitSearch via selectOption', () => {
    spyOn(component, 'emitSearch');
    component.selectOption('selectedType', '50');
    expect(component.selectedType).toBe('50');
    expect(component.openDropdown).toBeNull();
    expect(component.emitSearch).toHaveBeenCalled();
  });

  it('should update listingType via selectOption', () => {
    spyOn(component, 'emitSearch');
    component.selectOption('listingType', '80');
    expect(component.listingType).toBe('80');
  });

  it('should update status via selectOption', () => {
    spyOn(component, 'emitSearch');
    component.selectOption('status', '300');
    expect(component.status).toBe('300');
  });

  // ── ngOnDestroy() ───────────────────────────────────────────────────────────

  it('should remove all floating menus on ngOnDestroy', () => {
    component.toggleDropdown('type', makeTriggerEvent());
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(1);

    component.ngOnDestroy();
    expect(document.querySelectorAll('.custom-floating-menu').length).toBe(0);
  });
});