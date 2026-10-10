import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  let component: LoaderComponent;
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoaderComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(LoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default Input ───────────────────────────────────────────────────────────

  it('should have default message "Loading…"', () => {
    expect(component.message).toBe('Loading…');
  });

  // ── Input binding ───────────────────────────────────────────────────────────

  it('should accept a custom message', () => {
    component.message = 'Fetching data…';
    fixture.detectChanges();
    expect(component.message).toBe('Fetching data…');
  });

  it('should accept an empty message', () => {
    component.message = '';
    fixture.detectChanges();
    expect(component.message).toBe('');
  });

  it('should update message when input changes', () => {
    component.message = 'Step 1 of 3…';
    fixture.detectChanges();
    expect(component.message).toBe('Step 1 of 3…');

    component.message = 'Step 2 of 3…';
    fixture.detectChanges();
    expect(component.message).toBe('Step 2 of 3…');
  });
});
