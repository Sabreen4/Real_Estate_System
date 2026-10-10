import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { FormComponent } from './form.component';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty firstName by default', () => {
    expect(component.data.firstName).toBe('');
  });

  it('should have empty lastName by default', () => {
    expect(component.data.lastName).toBe('');
  });

  it('should have empty email by default', () => {
    expect(component.data.email).toBe('');
  });

  it('should have empty phone by default', () => {
    expect(component.data.phone).toBe('');
  });

  it('should have empty password by default', () => {
    expect(component.data.password).toBe('');
  });

  it('should have empty confirmPassword by default', () => {
    expect(component.data.confirmPassword).toBe('');
  });

  it('should have empty role by default', () => {
    expect(component.data.role).toBe('');
  });

  it('should have empty roles array by default', () => {
    expect(component.roles).toEqual([]);
  });

  it('should have showPassword false by default', () => {
    expect(component.showPassword).toBeFalse();
  });

  it('should have showConfirmPassword false by default', () => {
    expect(component.showConfirmPassword).toBeFalse();
  });

  it('should toggle showPassword to true', () => {
    component.showPassword = true;
    fixture.detectChanges();
    expect(component.showPassword).toBeTrue();
  });

  it('should toggle showConfirmPassword to true', () => {
    component.showConfirmPassword = true;
    fixture.detectChanges();
    expect(component.showConfirmPassword).toBeTrue();
  });

  it('should toggle showPassword back to false', () => {
    component.showPassword = true;
    component.showPassword = false;
    fixture.detectChanges();
    expect(component.showPassword).toBeFalse();
  });

  it('should accept a custom data object', () => {
    component.data = {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      phone: '1234567890',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'BUYER'
    };

    fixture.detectChanges();

    expect(component.data.firstName).toBe('Alice');
    expect(component.data.email).toBe('alice@example.com');
    expect(component.data.role).toBe('BUYER');
  });

  it('should accept a roles list', () => {
    component.roles = ['ADMIN', 'AGENT', 'BUYER'];

    fixture.detectChanges();

    expect(component.roles.length).toBe(3);
    expect(component.roles).toContain('ADMIN');
  });

  it('should accept an empty roles array', () => {
    component.roles = [];

    fixture.detectChanges();

    expect(component.roles.length).toBe(0);
  });

  it('should allow direct mutation of data fields', () => {
    component.data.firstName = 'Bob';
    component.data.lastName = 'Jones';

    fixture.detectChanges();

    expect(component.data.firstName).toBe('Bob');
    expect(component.data.lastName).toBe('Jones');
  });
});