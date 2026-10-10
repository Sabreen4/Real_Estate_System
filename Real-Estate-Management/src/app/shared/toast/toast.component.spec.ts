import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToastComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default Inputs ──────────────────────────────────────────────────────────

  it('should have empty successMessage by default', () => {
    expect(component.successMessage).toBe('');
  });

  it('should have empty errorMessage by default', () => {
    expect(component.errorMessage).toBe('');
  });

  // ── Input binding ───────────────────────────────────────────────────────────

  it('should accept a success message', () => {
    component.successMessage = 'Saved successfully!';
    fixture.detectChanges();
    expect(component.successMessage).toBe('Saved successfully!');
  });

  it('should accept an error message', () => {
    component.errorMessage = 'Something went wrong.';
    fixture.detectChanges();
    expect(component.errorMessage).toBe('Something went wrong.');
  });

  it('should allow both messages to be set simultaneously', () => {
    component.successMessage = 'Done';
    component.errorMessage   = 'Also an error';
    fixture.detectChanges();
    expect(component.successMessage).toBe('Done');
    expect(component.errorMessage).toBe('Also an error');
  });

  it('should allow messages to be cleared', () => {
    component.successMessage = 'Was set';
    component.successMessage = '';
    fixture.detectChanges();
    expect(component.successMessage).toBe('');
  });
});
