import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmptyStateComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default Inputs ──────────────────────────────────────────────────────────

  it('should have default icon "📭"', () => {
    expect(component.icon).toBe('📭');
  });

  it('should have default title "Nothing here yet"', () => {
    expect(component.title).toBe('Nothing here yet');
  });

  it('should have empty subtitle by default', () => {
    expect(component.subtitle).toBe('');
  });

  it('should have empty ctaLabel by default', () => {
    expect(component.ctaLabel).toBe('');
  });

  // ── Input binding ───────────────────────────────────────────────────────────

  it('should accept a custom icon', () => {
    component.icon = '🏠';
    fixture.detectChanges();
    expect(component.icon).toBe('🏠');
  });

  it('should accept a custom title', () => {
    component.title = 'No properties found';
    fixture.detectChanges();
    expect(component.title).toBe('No properties found');
  });

  it('should accept a subtitle', () => {
    component.subtitle = 'Try adjusting your search filters.';
    fixture.detectChanges();
    expect(component.subtitle).toBe('Try adjusting your search filters.');
  });

  it('should accept a ctaLabel', () => {
    component.ctaLabel = 'Add Property';
    fixture.detectChanges();
    expect(component.ctaLabel).toBe('Add Property');
  });

  // ── Output events ───────────────────────────────────────────────────────────

  it('should emit ctaClicked when ctaClicked.emit() is called', () => {
    let emitted = false;
    component.ctaClicked.subscribe(() => (emitted = true));
    component.ctaClicked.emit();
    expect(emitted).toBeTrue();
  });

  it('should support multiple subscribers to ctaClicked', () => {
    let count = 0;
    component.ctaClicked.subscribe(() => count++);
    component.ctaClicked.subscribe(() => count++);
    component.ctaClicked.emit();
    expect(count).toBe(2);
  });

  // ── Combined state ──────────────────────────────────────────────────────────

  it('should allow all inputs to be set simultaneously', () => {
    component.icon     = '🔍';
    component.title    = 'Nothing found';
    component.subtitle = 'No matches for your query.';
    component.ctaLabel = 'Clear filters';
    fixture.detectChanges();

    expect(component.icon).toBe('🔍');
    expect(component.title).toBe('Nothing found');
    expect(component.subtitle).toBe('No matches for your query.');
    expect(component.ctaLabel).toBe('Clear filters');
  });
});
