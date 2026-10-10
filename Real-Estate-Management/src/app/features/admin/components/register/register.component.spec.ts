import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy:      jasmine.SpyObj<Router>;
  let toastSpy:       jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService,  useValue: jasmine.createSpyObj('AuthService',  ['register']) },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: Router,       useValue: jasmine.createSpyObj('Router',       ['navigate']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture   = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;

    authServiceSpy = TestBed.inject(AuthService)  as jasmine.SpyObj<AuthService>;
    toastSpy       = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    routerSpy      = TestBed.inject(Router)       as jasmine.SpyObj<Router>;

    fixture.detectChanges(); // triggers ngOnInit → builds form
  });

  /** Helper: fill the form with a valid payload */
  function fillValid(overrides: Record<string, string> = {}): void {
    component.registerForm.setValue({
      firstName:       'John',
      lastName:        'Doe',
      email:           'john@test.com',
      phone:           '9876543210',
      password:        'Password123',
      confirmPassword: 'Password123',
      role:            'BUYER',
      ...overrides
    });
  }

  // ── CREATE / INIT ────────────────────────────────────────────────────────
  describe('Initialisation', () => {

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise roles as [AGENT, BUYER]', () => {
      expect(component.roles).toEqual(['AGENT', 'BUYER']);
    });

    it('should initialise isLoading as false', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should build the form with all required controls', () => {
      ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword', 'role']
        .forEach(ctrl => expect(component.registerForm.contains(ctrl)).toBeTrue());
    });

    it('getter f should return registerForm.controls', () => {
      expect(component.f).toBe(component.registerForm.controls);
    });
  });

  // ── VALIDATION ───────────────────────────────────────────────────────────
  describe('Validation', () => {

    it('should be invalid when all controls are empty', () => {
      component.registerForm.reset();
      expect(component.registerForm.invalid).toBeTrue();
    });

    it('should call markAllAsTouched when form is invalid', () => {
      component.registerForm.reset();
      spyOn(component.registerForm, 'markAllAsTouched');

      component.onSubmit();

      expect(component.registerForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should NOT call register when form is invalid', () => {
      component.registerForm.reset();
      component.onSubmit();
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should have passwordMismatch error when passwords differ', () => {
      fillValid({ password: 'abc123', confirmPassword: 'xyz999' });
      expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();
    });

    it('should NOT have passwordMismatch error when passwords match', () => {
      fillValid();
      expect(component.registerForm.hasError('passwordMismatch')).toBeFalse();
    });

    it('should NOT call register when passwords do not match', () => {
      fillValid({ password: 'abc123', confirmPassword: 'xyz999' });
      component.onSubmit();
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should be invalid when email format is wrong', () => {
      fillValid({ email: 'not-an-email' });
      expect(component.registerForm.get('email')?.invalid).toBeTrue();
    });

    it('should be invalid when phone is not 10 digits', () => {
      fillValid({ phone: '123' });
      expect(component.registerForm.get('phone')?.invalid).toBeTrue();
    });

    it('should be invalid when password is shorter than 6 chars', () => {
      fillValid({ password: 'abc', confirmPassword: 'abc' });
      expect(component.registerForm.get('password')?.invalid).toBeTrue();
    });

    it('should be invalid when firstName is shorter than 2 chars', () => {
      fillValid({ firstName: 'J' });
      expect(component.registerForm.get('firstName')?.invalid).toBeTrue();
    });

    it('should be invalid when lastName is shorter than 2 chars', () => {
      fillValid({ lastName: 'D' });
      expect(component.registerForm.get('lastName')?.invalid).toBeTrue();
    });

    it('should be invalid when role is empty', () => {
      fillValid({ role: '' });
      expect(component.registerForm.get('role')?.invalid).toBeTrue();
    });
  });

  // ── SUCCESSFUL SUBMISSION ────────────────────────────────────────────────
  describe('Successful submission', () => {

    beforeEach(() => {
      authServiceSpy.register.and.returnValue(of({} as any));
    });

    it('should call register with trimmed values', () => {
      component.registerForm.setValue({
        firstName:       ' John ',
        lastName:        ' Doe ',
        email:           'john@test.com',
        phone:           '9876543210',
        password:        'Password123',
        confirmPassword: 'Password123',
        role:            'BUYER'
      });

      component.onSubmit();

      expect(authServiceSpy.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName:  'Doe',
        email:     'john@test.com',
        password:  'Password123',
        phone:     '9876543210',
        role:      'BUYER'
      });
    });

    it('should set isLoading to true before the call resolves', () => {
      let capturedLoading = false;
      authServiceSpy.register.and.callFake(() => {
        capturedLoading = component.isLoading;
        return of({} as any);
      });

      fillValid();
      component.onSubmit();

      expect(capturedLoading).toBeTrue();
    });

    it('should set isLoading to false after success', () => {
      fillValid();
      component.onSubmit();
      expect(component.isLoading).toBeFalse();
    });

    it('should show success toast after registration', () => {
      fillValid();
      component.onSubmit();
      expect(toastSpy.success).toHaveBeenCalledWith('Registration successful! Redirecting...');
    });

    it('should reset the form after successful registration', () => {
      fillValid();
      spyOn(component.registerForm, 'reset');
      component.onSubmit();
      expect(component.registerForm.reset).toHaveBeenCalled();
    });

    it('should navigate to /login after 1200ms', fakeAsync(() => {
      fillValid();
      component.onSubmit();
      tick(1200);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should NOT navigate before 1200ms have elapsed', fakeAsync(() => {
      fillValid();
      component.onSubmit();
      tick(1199);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      tick(1); // clean up
    }));
  });

  // ── ERROR HANDLING ───────────────────────────────────────────────────────
  describe('Error handling', () => {

    beforeEach(() => fillValid());

    it('should set isLoading to false after any error', () => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 500 })));
      component.onSubmit();
      expect(component.isLoading).toBeFalse();
    });

    it('should show network error message when status is 0', () => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 0 })));
      component.onSubmit();
      expect(toastSpy.error).toHaveBeenCalledWith('Network error. Please check your connection.');
    });

    it('should show backend message on 409 conflict', () => {
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ status: 409, error: { message: 'Email already exists' } }))
      );
      component.onSubmit();
      expect(toastSpy.error).toHaveBeenCalledWith('Email already exists');
    });

    it('should show default 409 message when backend message is absent', () => {
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ status: 409, error: {} }))
      );
      component.onSubmit();
      expect(toastSpy.error).toHaveBeenCalledWith('Email already registered.');
    });

    it('should show server error message for status 500', () => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 500 })));
      component.onSubmit();
      expect(toastSpy.error).toHaveBeenCalledWith('Server error. Please try again later.');
    });

    it('should show server error message for status 503 (any >= 500)', () => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 503 })));
      component.onSubmit();
      expect(toastSpy.error).toHaveBeenCalledWith('Server error. Please try again later.');
    });

    it('should show backend message for generic 4xx error', () => {
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'Invalid registration' } }))
      );
      component.onSubmit();
      expect(toastSpy.error).toHaveBeenCalledWith('Invalid registration');
    });

    it('should show fallback message for generic 4xx error without backend message', () => {
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ status: 400, error: {} }))
      );
      component.onSubmit();
      expect(toastSpy.error).toHaveBeenCalledWith('Registration failed. Please try again.');
    });

    it('should show fallback message for generic 4xx error with null error body', () => {
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ status: 422, error: null }))
      );
      component.onSubmit();
      expect(toastSpy.error).toHaveBeenCalledWith('Registration failed. Please try again.');
    });

    it('should NOT call toast.success on error', () => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 500 })));
      component.onSubmit();
      expect(toastSpy.success).not.toHaveBeenCalled();
    });

    it('should NOT navigate on error', fakeAsync(() => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ status: 500 })));
      component.onSubmit();
      tick(1200);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));
  });
});