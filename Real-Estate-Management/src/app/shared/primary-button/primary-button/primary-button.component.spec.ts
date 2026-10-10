import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrimaryButtonComponent } from './primary-button.component';

describe('PrimaryButtonComponent', () => {
  let component: PrimaryButtonComponent;
  let fixture: ComponentFixture<PrimaryButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrimaryButtonComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(PrimaryButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default Inputs ──────────────────────────────────────────────────────────

  it('should have default label "Submit"', () => {
    expect(component.label).toBe('Submit');
  });

  it('should have default icon "none"', () => {
    expect(component.icon).toBe('none');
  });

  it('should have disabled false by default', () => {
    expect(component.disabled).toBeFalse();
  });

  it('should have variant "primary" by default', () => {
    expect(component.variant).toBe('primary');
  });

  // ── Input binding ───────────────────────────────────────────────────────────

  it('should accept a custom label', () => {
    component.label = 'Save';
    fixture.detectChanges();
    expect(component.label).toBe('Save');
  });

  it('should accept icon "plus"', () => {
    component.icon = 'plus';
    fixture.detectChanges();
    expect(component.icon).toBe('plus');
  });

  it('should accept icon "refresh"', () => {
    component.icon = 'refresh';
    fixture.detectChanges();
    expect(component.icon).toBe('refresh');
  });

  it('should accept variant "danger"', () => {
    component.variant = 'danger';
    fixture.detectChanges();
    expect(component.variant).toBe('danger');
  });

  it('should accept variant "secondary"', () => {
    component.variant = 'secondary';
    fixture.detectChanges();
    expect(component.variant).toBe('secondary');
  });

  it('should accept disabled = true', () => {
    component.disabled = true;
    fixture.detectChanges();
    expect(component.disabled).toBeTrue();
  });

  // ── onClick() ───────────────────────────────────────────────────────────────

  it('should emit clicked when not disabled', () => {
    let emitted = false;
    component.disabled = false;
    component.clicked.subscribe(() => (emitted = true));
    component.onClick();
    expect(emitted).toBeTrue();
  });

  it('should NOT emit clicked when disabled', () => {
    let emitted = false;
    component.disabled = true;
    component.clicked.subscribe(() => (emitted = true));
    component.onClick();
    expect(emitted).toBeFalse();
  });

  it('should emit clicked after being re-enabled', () => {
    let emitted = false;
    component.disabled = true;
    component.clicked.subscribe(() => (emitted = true));
    component.onClick();
    expect(emitted).toBeFalse();

    component.disabled = false;
    component.onClick();
    expect(emitted).toBeTrue();
  });

  it('should support multiple subscribers to clicked', () => {
    let count = 0;
    component.disabled = false;
    component.clicked.subscribe(() => count++);
    component.clicked.subscribe(() => count++);
    component.onClick();
    expect(count).toBe(2);
  });
});
