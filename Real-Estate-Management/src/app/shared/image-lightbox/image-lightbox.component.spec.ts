import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ImageLightboxComponent } from './image-lightbox.component';

describe('ImageLightboxComponent', () => {
  let component: ImageLightboxComponent;
  let fixture: ComponentFixture<ImageLightboxComponent>;

  const sampleImages = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImageLightboxComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(ImageLightboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default Inputs ──────────────────────────────────────────────────────────

  it('should have empty images array by default', () => {
    expect(component.images).toEqual([]);
  });

  it('should have visible false by default', () => {
    expect(component.visible).toBeFalse();
  });

  it('should have startIndex 0 by default', () => {
    expect(component.startIndex).toBe(0);
  });

  it('should have currentIndex 0 by default', () => {
    expect(component.currentIndex).toBe(0);
  });

  // ── ngOnChanges — opening lightbox ─────────────────────────────────────────

  it('should set currentIndex to startIndex when visible becomes true', () => {
    component.images     = sampleImages;
    component.startIndex = 2;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, false),
    });
    expect(component.currentIndex).toBe(2);
  });

  it('should reset currentIndex to 0 when startIndex is 0 and visible becomes true', () => {
    component.images     = sampleImages;
    component.startIndex = 0;
    component.currentIndex = 1;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, false),
    });
    expect(component.currentIndex).toBe(0);
  });

  it('should not change currentIndex when visible stays false', () => {
    component.currentIndex = 1;
    component.ngOnChanges({
      visible: new SimpleChange(false, false, false),
    });
    expect(component.currentIndex).toBe(1);
  });

  // ── next() ──────────────────────────────────────────────────────────────────

  it('next() should advance currentIndex by 1', () => {
    component.images       = sampleImages;
    component.currentIndex = 0;
    component.next();
    expect(component.currentIndex).toBe(1);
  });

  it('next() should wrap around from last to first', () => {
    component.images       = sampleImages;
    component.currentIndex = 2;
    component.next();
    expect(component.currentIndex).toBe(0);
  });

  // ── prev() ──────────────────────────────────────────────────────────────────

  it('prev() should go back by 1', () => {
    component.images       = sampleImages;
    component.currentIndex = 2;
    component.prev();
    expect(component.currentIndex).toBe(1);
  });

  it('prev() should wrap around from first to last', () => {
    component.images       = sampleImages;
    component.currentIndex = 0;
    component.prev();
    expect(component.currentIndex).toBe(2);
  });

  // ── goTo() ──────────────────────────────────────────────────────────────────

  it('goTo() should jump to a specific index', () => {
    component.images = sampleImages;
    component.goTo(2);
    expect(component.currentIndex).toBe(2);
  });

  it('goTo() should jump to index 0', () => {
    component.images       = sampleImages;
    component.currentIndex = 2;
    component.goTo(0);
    expect(component.currentIndex).toBe(0);
  });

  // ── close() ─────────────────────────────────────────────────────────────────

  it('close() should emit closed event', () => {
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    component.close();
    expect(emitted).toBeTrue();
  });

  // ── Keyboard listener ───────────────────────────────────────────────────────

  it('ArrowRight key should call next() when visible', () => {
    component.images       = sampleImages;
    component.visible      = true;
    component.currentIndex = 0;
    const spy = spyOn(component, 'next').and.callThrough();
    component.onKey(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(spy).toHaveBeenCalled();
    expect(component.currentIndex).toBe(1);
  });

  it('ArrowLeft key should call prev() when visible', () => {
    component.images       = sampleImages;
    component.visible      = true;
    component.currentIndex = 1;
    const spy = spyOn(component, 'prev').and.callThrough();
    component.onKey(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(spy).toHaveBeenCalled();
    expect(component.currentIndex).toBe(0);
  });

  it('Escape key should call close() when visible', () => {
    component.visible = true;
    const spy = spyOn(component, 'close').and.callThrough();
    component.onKey(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(spy).toHaveBeenCalled();
  });

  it('should not respond to keys when visible is false', () => {
    component.images       = sampleImages;
    component.visible      = false;
    component.currentIndex = 0;
    const nextSpy  = spyOn(component, 'next');
    const prevSpy  = spyOn(component, 'prev');
    const closeSpy = spyOn(component, 'close');
    component.onKey(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    component.onKey(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    component.onKey(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(nextSpy).not.toHaveBeenCalled();
    expect(prevSpy).not.toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should ignore unrelated key presses', () => {
    component.images       = sampleImages;
    component.visible      = true;
    component.currentIndex = 1;
    component.onKey(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.currentIndex).toBe(1);
  });
});
