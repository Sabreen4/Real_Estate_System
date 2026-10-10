import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatusBadgeComponent],
    }).compileComponents();

    fixture   = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default Inputs ──────────────────────────────────────────────────────────

  it('should have empty label by default', () => {
    expect(component.label).toBe('');
  });

  it('should have type "role" by default', () => {
    expect(component.type).toBe('role');
  });
  it('should return badge-default for unknown type', () => {
  component.label = 'anything';
  (component as any).type = 'unknown';
  expect(component.cssClass).toBe('badge-default');
});

  // ── cssClass — role type ─────────────────────────────────────────────────────

  it('should return badge-admin for role admin', () => {
    component.label = 'admin';
    component.type  = 'role';
    expect(component.cssClass).toBe('badge-admin');
  });

  it('should return badge-admin for role ADMIN (case-insensitive)', () => {
    component.label = 'ADMIN';
    component.type  = 'role';
    expect(component.cssClass).toBe('badge-admin');
  });

  it('should return badge-agent for role agent', () => {
    component.label = 'agent';
    component.type  = 'role';
    expect(component.cssClass).toBe('badge-agent');
  });

  it('should return badge-buyer for role buyer', () => {
    component.label = 'buyer';
    component.type  = 'role';
    expect(component.cssClass).toBe('badge-buyer');
  });

  it('should return badge-default for unknown role', () => {
    component.label = 'superuser';
    component.type  = 'role';
    expect(component.cssClass).toBe('badge-default');
  });

  // ── cssClass — listing type ──────────────────────────────────────────────────

  it('should return badge-sale for listing "sale"', () => {
    component.label = 'sale';
    component.type  = 'listing';
    expect(component.cssClass).toBe('badge-sale');
  });

  it('should return badge-sale for listing "for sale"', () => {
    component.label = 'for sale';
    component.type  = 'listing';
    expect(component.cssClass).toBe('badge-sale');
  });

  it('should return badge-rent for listing "rent"', () => {
    component.label = 'rent';
    component.type  = 'listing';
    expect(component.cssClass).toBe('badge-rent');
  });

  it('should return badge-rent for listing "for rent"', () => {
    component.label = 'for rent';
    component.type  = 'listing';
    expect(component.cssClass).toBe('badge-rent');
  });

  it('should return badge-lease for listing "lease"', () => {
    component.label = 'lease';
    component.type  = 'listing';
    expect(component.cssClass).toBe('badge-lease');
  });

  it('should return badge-default for unknown listing type', () => {
    component.label = 'auction';
    component.type  = 'listing';
    expect(component.cssClass).toBe('badge-default');
  });

  // ── cssClass — status type ───────────────────────────────────────────────────

  it('should return status-active for status "active"', () => {
    component.label = 'active';
    component.type  = 'status';
    expect(component.cssClass).toBe('status-active');
  });

  it('should return status-active for status "available"', () => {
    component.label = 'available';
    component.type  = 'status';
    expect(component.cssClass).toBe('status-active');
  });

  it('should return status-sold for status "sold"', () => {
    component.label = 'sold';
    component.type  = 'status';
    expect(component.cssClass).toBe('status-sold');
  });

  it('should return status-pending for status "pending"', () => {
    component.label = 'pending';
    component.type  = 'status';
    expect(component.cssClass).toBe('status-pending');
  });

  it('should return status-rented for status "rented"', () => {
    component.label = 'rented';
    component.type  = 'status';
    expect(component.cssClass).toBe('status-rented');
  });

  it('should return status-inactive for status "inactive"', () => {
    component.label = 'inactive';
    component.type  = 'status';
    expect(component.cssClass).toBe('status-inactive');
  });

  it('should return badge-default for unknown status', () => {
    component.label = 'archived';
    component.type  = 'status';
    expect(component.cssClass).toBe('badge-default');
  });

  // ── Case insensitivity ───────────────────────────────────────────────────────

  it('should handle uppercase listing type', () => {
    component.label = 'SALE';
    component.type  = 'listing';
    expect(component.cssClass).toBe('badge-sale');
  });

  it('should handle mixed case status', () => {
    component.label = 'Active';
    component.type  = 'status';
    expect(component.cssClass).toBe('status-active');
  });
});
