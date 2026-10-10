import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { SimpleChange } from '@angular/core';
import { PropertyDetailModalComponent } from './property-detail-modal.component';
import { Property } from 'src/app/core/models/property.model';

const makeProperty = (overrides: Partial<any> = {}): Property => ({
  id: 1, userId: 10, title: 'Test Property', description: 'Desc',
  city: 'Chennai', state: 'TN', zipCode: '600001',
  price: 5000000, size: 1200,
  propertyTypeId: 40, propertyType: 'Apartment',
  listingTypeId: 70, listingType: 'Sale',
  statusId: 100, status: 'Active',
  images: [],
  ...overrides
});

describe('PropertyDetailModalComponent', () => {
  let component: PropertyDetailModalComponent;
  let fixture: ComponentFixture<PropertyDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PropertyDetailModalComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(PropertyDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default state ───────────────────────────────────────────────────────────

  it('should have property null by default', () => {
    expect(component.property).toBeNull();
  });

  it('should have visible false by default', () => {
    expect(component.visible).toBeFalse();
  });

  it('should have images empty by default', () => {
    expect(component.images).toEqual([]);
  });

  it('should have activeIndex 0 by default', () => {
    expect(component.activeIndex).toBe(0);
  });

  // ── ngOnChanges — opening modal ──────────────────────────────────────────────

  it('should build images and lock body scroll when opened with a property', () => {
    component.property = makeProperty({
      images: [{ base64: 'abc', contentType: 'image/jpeg' }]
    });
    component.visible = true;
    component.ngOnChanges({
      visible:  new SimpleChange(false, true, false),
      property: new SimpleChange(null, component.property, false),
    });
    expect(component.images.length).toBe(1);
    expect(component.images[0]).toContain('data:image/jpeg;base64,abc');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should fall back to imageUrl when images array is empty', () => {
    const prop = makeProperty({ images: [], imageUrl: 'http://example.com/img.jpg' } as any);
    component.property = prop;
    component.visible  = true;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, false),
    });
    expect(component.images).toContain('http://example.com/img.jpg');
  });

  it('should reset body overflow when modal is closed', () => {
    document.body.style.overflow = 'hidden';
    component.visible = false;
    component.ngOnChanges({
      visible: new SimpleChange(true, false, false),
    });
    expect(document.body.style.overflow).toBe('');
  });

  it('should set images to empty when property is null', () => {
    component.property = null;
    component.visible  = false;
    component.ngOnChanges({
      property: new SimpleChange(makeProperty(), null, false),
    });
    expect(component.images).toEqual([]);
  });

  // ── NEW: ngOnChanges with unrelated change key ───────────────────────────────
  // Covers the branch where changes has neither 'visible' nor 'property'.

  it('should do nothing when ngOnChanges fires for an unrelated input', () => {
    document.body.style.overflow = 'hidden'; // pre-set a sentinel
    component.ngOnChanges({
      someOtherInput: new SimpleChange('a', 'b', false),
    });
    // overflow must remain untouched — the handler was never entered
    expect(document.body.style.overflow).toBe('hidden');
  });

  // ── NEW: startAuto with a single image ───────────────────────────────────────
  // Covers the images.length > 1 === false branch — no timer should be created.

  it('should not start a timer when there is only one image', () => {
    spyOn(window, 'setInterval').and.callThrough();
    component.property = makeProperty({
      images: [{ base64: 'solo', contentType: 'image/png' }]
    });
    component.visible = true;
    component.ngOnChanges({ visible: new SimpleChange(false, true, false) });
    expect(window.setInterval).not.toHaveBeenCalled();
  });

  // ── NEW: auto-timer callback ─────────────────────────────────────────────────
  // Covers the setInterval callback body: index advance + cdr.detectChanges().

  it('should auto-advance activeIndex after timer fires', (done) => {
    jasmine.clock().install();
    component.property = makeProperty({
      images: [
        { base64: 'a', contentType: 'image/jpeg' },
        { base64: 'b', contentType: 'image/jpeg' },
      ]
    });
    component.visible = true;
    component.ngOnChanges({ visible: new SimpleChange(false, true, false) });

    expect(component.activeIndex).toBe(0);
    jasmine.clock().tick(2001);
    expect(component.activeIndex).toBe(1);

    jasmine.clock().uninstall();
    done();
  });

  // ── NEW: stopAuto when timer is already null ─────────────────────────────────
  // Covers the if (this.autoTimer) === false branch in stopAuto().

  it('should not throw when stopAuto is called while timer is already null', () => {
    // autoTimer is null by default; calling close() (which calls stopAuto) must be safe
    expect(() => component.close()).not.toThrow();
  });
  it('stopAuto should clear the timer when one is running', () => {
  jasmine.clock().install();

  component.property = makeProperty({
    images: [
      { base64: 'a', contentType: 'image/jpeg' },
      { base64: 'b', contentType: 'image/jpeg' },
    ]
  });
  component.visible = true;
  component.ngOnChanges({ visible: new SimpleChange(false, true, false) });

  // timer is now running — close() should clear it without throwing
  expect(() => component.close()).not.toThrow();
  // after close, further ticks must NOT advance activeIndex
  const indexAfterClose = component.activeIndex;
  jasmine.clock().tick(2001);
  expect(component.activeIndex).toBe(indexAfterClose);

  jasmine.clock().uninstall();
});

it('buildImages should set images to empty array when property is null', () => {
  component.property = null;
  (component as any).buildImages();
  expect(component.images).toEqual([]);
});

  // ── Navigation ──────────────────────────────────────────────────────────────

  it('goTo() should update activeIndex', () => {
    component.property = makeProperty({
      images: [
        { base64: 'a', contentType: 'image/jpeg' },
        { base64: 'b', contentType: 'image/jpeg' },
      ]
    });
    component.visible = true;
    component.ngOnChanges({ visible: new SimpleChange(false, true, false) });
    component.goTo(1);
    expect(component.activeIndex).toBe(1);
  });

  it('next() should advance activeIndex', () => {
    component.images      = ['img1', 'img2', 'img3'];
    component.activeIndex = 0;
    component.next();
    expect(component.activeIndex).toBe(1);
  });

  it('prev() should go back one', () => {
    component.images      = ['img1', 'img2', 'img3'];
    component.activeIndex = 2;
    component.prev();
    expect(component.activeIndex).toBe(1);
  });

  it('next() should wrap around from last image', () => {
    component.images      = ['img1', 'img2'];
    component.activeIndex = 1;
    component.next();
    expect(component.activeIndex).toBe(0);
  });

  it('prev() should wrap around from first image', () => {
    component.images      = ['img1', 'img2'];
    component.activeIndex = 0;
    component.prev();
    expect(component.activeIndex).toBe(1);
  });

  // ── close() ─────────────────────────────────────────────────────────────────

  it('close() should emit closed', () => {
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    component.close();
    expect(emitted).toBeTrue();
  });

  it('close() should reset body overflow', () => {
    document.body.style.overflow = 'hidden';
    component.close();
    expect(document.body.style.overflow).toBe('');
  });

  // ── onBackdropClick() ───────────────────────────────────────────────────────

  it('onBackdropClick() should call close()', () => {
    const spy = spyOn(component, 'close');
    component.onBackdropClick();
    expect(spy).toHaveBeenCalled();
  });

  // ── ngOnDestroy ─────────────────────────────────────────────────────────────

  it('ngOnDestroy should reset body overflow', () => {
    document.body.style.overflow = 'hidden';
    component.ngOnDestroy();
    expect(document.body.style.overflow).toBe('');
  });
});