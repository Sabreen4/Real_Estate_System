import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDeleteModalComponent } from './confirm-delete-modal.component';

describe('ConfirmDeleteModalComponent', () => {
  let component: ConfirmDeleteModalComponent;
  let fixture: ComponentFixture<ConfirmDeleteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmDeleteModalComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(ConfirmDeleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default Inputs ──────────────────────────────────────────────────────────

  it('should have visible false by default', () => {
    expect(component.visible).toBeFalse();
  });

  it('should have default title "Delete?"', () => {
    expect(component.title).toBe('Delete?');
  });

  it('should have empty description by default', () => {
    expect(component.description).toBe('');
  });

  it('should have default confirmLabel "Yes, Delete"', () => {
    expect(component.confirmLabel).toBe('Yes, Delete');
  });

  it('should have isLoading false by default', () => {
    expect(component.isLoading).toBeFalse();
  });

  // ── Input binding ───────────────────────────────────────────────────────────

  it('should accept visible = true', () => {
    component.visible = true;
    fixture.detectChanges();
    expect(component.visible).toBeTrue();
  });

  it('should accept custom title', () => {
    component.title = 'Remove User?';
    fixture.detectChanges();
    expect(component.title).toBe('Remove User?');
  });

  it('should accept custom description', () => {
    component.description = 'This action cannot be undone.';
    fixture.detectChanges();
    expect(component.description).toBe('This action cannot be undone.');
  });

  it('should accept custom confirmLabel', () => {
    component.confirmLabel = 'Confirm';
    fixture.detectChanges();
    expect(component.confirmLabel).toBe('Confirm');
  });

  it('should accept isLoading = true', () => {
    component.isLoading = true;
    fixture.detectChanges();
    expect(component.isLoading).toBeTrue();
  });

  // ── Output events ───────────────────────────────────────────────────────────

  it('should emit confirmed when confirmed.emit() is called', () => {
    let emitted = false;
    component.confirmed.subscribe(() => (emitted = true));
    component.confirmed.emit();
    expect(emitted).toBeTrue();
  });

  it('should emit cancelled when cancelled.emit() is called', () => {
    let emitted = false;
    component.cancelled.subscribe(() => (emitted = true));
    component.cancelled.emit();
    expect(emitted).toBeTrue();
  });

  // ── Combined states ─────────────────────────────────────────────────────────

  it('should show loading state while confirming', () => {
    component.visible   = true;
    component.isLoading = true;
    fixture.detectChanges();
    expect(component.isLoading).toBeTrue();
    expect(component.visible).toBeTrue();
  });

  it('should allow confirmed and cancelled to both have subscribers', () => {
    let confirmCount = 0;
    let cancelCount  = 0;
    component.confirmed.subscribe(() => confirmCount++);
    component.cancelled.subscribe(() => cancelCount++);

    component.confirmed.emit();
    component.cancelled.emit();

    expect(confirmCount).toBe(1);
    expect(cancelCount).toBe(1);
  });
});
