import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionButtonsComponent } from './action-button.component';
import { MatIconModule } from '@angular/material/icon';

describe('ActionButtonsComponent', () => {
  let component: ActionButtonsComponent;
  let fixture: ComponentFixture<ActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActionButtonsComponent],
      imports: [MatIconModule], 
    }).compileComponents();

    fixture   = TestBed.createComponent(ActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ... rest of your tests unchanged

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default Input values ────────────────────────────────────────────────────

  it('should have default editLabel as "Edit"', () => {
    expect(component.editLabel).toBe('Edit');
  });

  it('should have default deleteLabel as "Delete"', () => {
    expect(component.deleteLabel).toBe('Delete');
  });

  it('should have editDisabled false by default', () => {
    expect(component.editDisabled).toBeFalse();
  });

  it('should have deleteDisabled false by default', () => {
    expect(component.deleteDisabled).toBeFalse();
  });

  // ── Input binding ───────────────────────────────────────────────────────────

  it('should accept custom editLabel', () => {
    component.editLabel = 'Modify';
    fixture.detectChanges();
    expect(component.editLabel).toBe('Modify');
  });

  it('should accept custom deleteLabel', () => {
    component.deleteLabel = 'Remove';
    fixture.detectChanges();
    expect(component.deleteLabel).toBe('Remove');
  });

  it('should accept editDisabled as true', () => {
    component.editDisabled = true;
    fixture.detectChanges();
    expect(component.editDisabled).toBeTrue();
  });

  it('should accept deleteDisabled as true', () => {
    component.deleteDisabled = true;
    fixture.detectChanges();
    expect(component.deleteDisabled).toBeTrue();
  });

  // ── Output events ───────────────────────────────────────────────────────────

  it('should emit editClicked when editClicked.emit() is called', () => {
    let emitted = false;
    component.editClicked.subscribe(() => (emitted = true));
    component.editClicked.emit();
    expect(emitted).toBeTrue();
  });

  it('should emit deleteClicked when deleteClicked.emit() is called', () => {
    let emitted = false;
    component.deleteClicked.subscribe(() => (emitted = true));
    component.deleteClicked.emit();
    expect(emitted).toBeTrue();
  });

  // ── Both buttons disabled simultaneously ────────────────────────────────────

  it('should allow both buttons to be disabled at the same time', () => {
    component.editDisabled   = true;
    component.deleteDisabled = true;
    fixture.detectChanges();
    expect(component.editDisabled).toBeTrue();
    expect(component.deleteDisabled).toBeTrue();
  });

  it('should allow both buttons to be enabled at the same time', () => {
    component.editDisabled   = false;
    component.deleteDisabled = false;
    fixture.detectChanges();
    expect(component.editDisabled).toBeFalse();
    expect(component.deleteDisabled).toBeFalse();
  });

  // ── Multiple subscriptions ──────────────────────────────────────────────────

  it('should support multiple subscribers to editClicked', () => {
    let count = 0;
    component.editClicked.subscribe(() => count++);
    component.editClicked.subscribe(() => count++);
    component.editClicked.emit();
    expect(count).toBe(2);
  });
});
