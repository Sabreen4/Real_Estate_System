// import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// import { FormsModule, NgForm } from '@angular/forms';
// import { Router } from '@angular/router';
// import { of, throwError } from 'rxjs';
// import { ChangeDetectorRef } from '@angular/core';

// import { LoginComponent } from './login.component';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { ToastService } from 'src/app/core/services/toast.service';

// describe('LoginComponent', () => {
//   let component: LoginComponent;
//   let fixture: ComponentFixture<LoginComponent>;

//   let authSpy: jasmine.SpyObj<AuthService>;
//   let toastSpy: jasmine.SpyObj<ToastService>;
//   let routerSpy: jasmine.SpyObj<Router>;
//   let cdrSpy: jasmine.SpyObj<ChangeDetectorRef>;

//   beforeEach(async () => {
//     authSpy = jasmine.createSpyObj('AuthService', ['login', 'getRole']);
//     toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
//     routerSpy = jasmine.createSpyObj('Router', ['navigate']);
//     cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

//     await TestBed.configureTestingModule({
//       declarations: [LoginComponent],
//       imports: [FormsModule],
//       providers: [
//         { provide: AuthService, useValue: authSpy },
//         { provide: ToastService, useValue: toastSpy },
//         { provide: Router, useValue: routerSpy }
//       ]
//     }).compileComponents();

//     fixture = TestBed.createComponent(LoginComponent);
//     component = fixture.componentInstance;

//     // ✅ Directly overwrite CDR on the instance — TestBed provider has no effect for CDR
//     (component as any)['cdr'] = cdrSpy;
//   });

//   // ===================== CREATE =====================
//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   // ===================== SUBMIT INVALID FORM =====================
//   it('should return when form is invalid', () => {
//     const form = { invalid: true } as NgForm;

//     component.onSubmit(form);

//     expect(authSpy.login).not.toHaveBeenCalled();
//   });

//   // ===================== SUCCESS — ADMIN =====================
//   it('should login and navigate to ADMIN dashboard', fakeAsync(() => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(of({ token: 'abc' } as any));
//     authSpy.getRole.and.returnValue('ADMIN');

//     spyOn(sessionStorage, 'setItem');

//     component.loginData = { email: 'admin@mail.com', password: 'pass' };

//     component.onSubmit(form);
//     tick();

//     expect(sessionStorage.setItem).toHaveBeenCalledWith('token', 'abc');
//     expect(toastSpy.success).toHaveBeenCalledWith('Login Successful');
//     expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
//     expect(cdrSpy.detectChanges).toHaveBeenCalled();
//     expect(component.isLoading).toBeFalse();
//   }));

//   // ===================== SUCCESS — AGENT =====================
//   it('should login and navigate to AGENT dashboard', fakeAsync(() => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(of({ token: 'abc' } as any));
//     authSpy.getRole.and.returnValue('AGENT');

//     spyOn(sessionStorage, 'setItem');

//     component.onSubmit(form);
//     tick();

//     expect(routerSpy.navigate).toHaveBeenCalledWith(['/agent/dashboard']);
//     expect(cdrSpy.detectChanges).toHaveBeenCalled();
//     expect(component.isLoading).toBeFalse();
//   }));

//   // ===================== SUCCESS — BUYER =====================
//   it('should login and navigate to BUYER dashboard', fakeAsync(() => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(of({ token: 'abc' } as any));
//     authSpy.getRole.and.returnValue('BUYER');

//     spyOn(sessionStorage, 'setItem');

//     component.onSubmit(form);
//     tick();

//     expect(routerSpy.navigate).toHaveBeenCalledWith(['/buyer/dashboard']);
//     expect(cdrSpy.detectChanges).toHaveBeenCalled();
//     expect(component.isLoading).toBeFalse();
//   }));

//   // ===================== SUCCESS — INVALID ROLE =====================
//   it('should handle invalid role and redirect to login', fakeAsync(() => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(of({ token: 'abc' } as any));
//     authSpy.getRole.and.returnValue('UNKNOWN');

//     spyOn(sessionStorage, 'setItem');

//     component.onSubmit(form);
//     tick();

//     expect(toastSpy.error).toHaveBeenCalledWith('Invalid Role');
//     expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
//     expect(cdrSpy.detectChanges).toHaveBeenCalled();
//     expect(component.isLoading).toBeFalse();
//   }));

//   // ===================== SUCCESS — TRY/CATCH BLOCK =====================
//   it('should handle exception thrown inside try block', fakeAsync(() => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(of({ token: 'abc' } as any));

//     // Force an error inside the try block
//     authSpy.getRole.and.throwError('role error');

//     component.onSubmit(form);
//     tick();

//     expect(toastSpy.error).toHaveBeenCalledWith(
//       'Something went wrong. Please try again.'
//     );
//     expect(cdrSpy.detectChanges).toHaveBeenCalled();
//     expect(component.isLoading).toBeFalse();
//   }));

//   // ===================== ERROR — STATUS 0 (NETWORK) =====================
//   it('should handle network error (status 0)', () => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(
//       throwError(() => ({ status: 0 }))
//     );

//     component.onSubmit(form);

//     expect(component.errorMessage)
//       .toBe('Network error. Please check your connection.');
//     expect(toastSpy.error)
//       .toHaveBeenCalledWith('Network error. Please check your connection.');
//     expect(component.isLoading).toBeFalse();
//   });

//   // ===================== ERROR — STATUS 401 =====================
//   it('should handle 401 error with server message', () => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(
//       throwError(() => ({
//         status: 401,
//         error: { message: 'Invalid credentials' }
//       }))
//     );

//     component.onSubmit(form);

//     expect(component.errorMessage).toBe('Invalid credentials');
//     expect(toastSpy.error).toHaveBeenCalledWith('Invalid credentials');
//     expect(component.isLoading).toBeFalse();
//   });

//   // ===================== ERROR — STATUS 403 =====================
//   it('should handle 403 error with fallback message', () => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(
//       throwError(() => ({ status: 403 }))
//     );

//     component.onSubmit(form);

//     expect(component.errorMessage).toBe('Invalid email or password.');
//     expect(toastSpy.error).toHaveBeenCalledWith('Invalid email or password.');
//     expect(component.isLoading).toBeFalse();
//   });

//   // ===================== ERROR — STATUS 500 =====================
//   it('should handle server error with status 500', () => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(
//       throwError(() => ({ status: 500 }))
//     );

//     component.onSubmit(form);

//     expect(component.errorMessage)
//       .toBe('Server error. Please try again later.');
//     expect(toastSpy.error)
//       .toHaveBeenCalledWith('Server error. Please try again later.');
//     expect(component.isLoading).toBeFalse();
//   });

//   // ===================== ERROR — STATUS 503 (also >= 500) =====================
//   it('should handle server error with status 503', () => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(
//       throwError(() => ({ status: 503 }))
//     );

//     component.onSubmit(form);

//     expect(component.errorMessage)
//       .toBe('Server error. Please try again later.');
//   });

//   // ===================== ERROR — DEFAULT WITH MESSAGE (e.g. 404) =====================
//   it('should handle default error with server message (status 404)', () => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(
//       throwError(() => ({ status: 404, error: { message: 'Resource not found' } }))
//     );

//     component.onSubmit(form);

//     expect(component.errorMessage).toBe('Resource not found');
//     expect(toastSpy.error).toHaveBeenCalledWith('Resource not found');
//     expect(component.isLoading).toBeFalse();
//   });

//   // ===================== ERROR — DEFAULT WITHOUT MESSAGE (e.g. 404 no body) =====================
//   it('should handle default error with no error message (status 404)', () => {
//     const form = { invalid: false } as NgForm;

//     authSpy.login.and.returnValue(
//       throwError(() => ({ status: 404 }))
//     );

//     component.onSubmit(form);

//     expect(component.errorMessage).toBe('Login failed. Please try again.');
//     expect(toastSpy.error)
//       .toHaveBeenCalledWith('Login failed. Please try again.');
//     expect(component.isLoading).toBeFalse();
//   });

//   // ===================== TOGGLE PASSWORD =====================
//   it('should toggle password visibility on and off', () => {
//     expect(component.showPassword).toBeFalse();

//     component.togglePasswordVisibility();
//     expect(component.showPassword).toBeTrue();

//     component.togglePasswordVisibility();
//     expect(component.showPassword).toBeFalse();
//   });

//   // ===================== FORGOT PASSWORD — WITH EMAIL =====================
//   it('should navigate to forgot-password with current email', () => {
//     component.loginData.email = 'test@mail.com';

//     component.goToForgotPassword();

//     expect(routerSpy.navigate).toHaveBeenCalledWith(
//       ['/forgot-password'],
//       { state: { email: 'test@mail.com' } }
//     );
//   });

//   // ===================== FORGOT PASSWORD — EMPTY EMAIL =====================
//   it('should navigate to forgot-password with empty email', () => {
//     component.loginData.email = '';

//     component.goToForgotPassword();

//     expect(routerSpy.navigate).toHaveBeenCalledWith(
//       ['/forgot-password'],
//       { state: { email: '' } }
//     );
//   });
// });
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { FormsModule, NgForm } from '@angular/forms';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';

import { LoginComponent } from './login.component';
import { AuthService }    from 'src/app/core/services/auth.service';
import { ToastService }   from 'src/app/core/services/toast.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validForm   = () => ({ invalid: false }) as NgForm;
const invalidForm = () => ({ invalid: true  }) as NgForm;

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('LoginComponent', () => {
  let component:  LoginComponent;
  let fixture:    ComponentFixture<LoginComponent>;

  let authSpy:   jasmine.SpyObj<AuthService>;
  let toastSpy:  jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let cdrSpy:    jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    sessionStorage.clear();

    authSpy   = jasmine.createSpyObj('AuthService',  ['login', 'getRole']);
    toastSpy  = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router',       ['navigate', 'navigateByUrl']);
    cdrSpy    = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports:      [FormsModule],
      providers: [
        { provide: AuthService,       useValue: authSpy   },
        { provide: ToastService,      useValue: toastSpy  },
        { provide: Router,            useValue: routerSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy    }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture   = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    (component as any).cdr = cdrSpy;
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  // ── Creation ─────────────────────────────────────────────────────────────

  describe('creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise loginData with empty email and password', () => {
      expect(component.loginData).toEqual({ email: '', password: '' });
    });

    it('should initialise errorMessage to empty string', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should initialise isLoading to false', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should initialise showPassword to false', () => {
      expect(component.showPassword).toBeFalse();
    });

    it('should initialise sessionExpiredMsg to empty string', () => {
      expect(component.sessionExpiredMsg).toBe('');
    });
  });

  // ── ngOnInit ─────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set sessionExpiredMsg when redirectUrl is in sessionStorage', () => {
      sessionStorage.setItem('redirectUrl', '/agent/dashboard');
      component.ngOnInit();
      expect(component.sessionExpiredMsg).toBe('Session expired. Please log in again.');
    });

    it('should leave sessionExpiredMsg empty when no redirectUrl', () => {
      sessionStorage.removeItem('redirectUrl');
      component.ngOnInit();
      expect(component.sessionExpiredMsg).toBe('');
    });
  });

  // ── togglePasswordVisibility ──────────────────────────────────────────────

  describe('togglePasswordVisibility', () => {
    it('should set showPassword to true when called once', () => {
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeTrue();
    });

    it('should toggle showPassword back to false when called twice', () => {
      component.togglePasswordVisibility();
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeFalse();
    });
  });

  // ── goToForgotPassword ────────────────────────────────────────────────────

  describe('goToForgotPassword', () => {
    it('should navigate to /forgot-password', () => {
      component.goToForgotPassword();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/forgot-password'],
        jasmine.objectContaining({ state: jasmine.any(Object) })
      );
    });

    it('should pass current email in navigation state', () => {
      component.loginData.email = 'test@mail.com';
      component.goToForgotPassword();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/forgot-password'],
        { state: { email: 'test@mail.com' } }
      );
    });

    it('should pass empty string when email is blank', () => {
      component.loginData.email = '';
      component.goToForgotPassword();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/forgot-password'],
        { state: { email: '' } }
      );
    });
  });

  // ── onSubmit – form invalid guard ─────────────────────────────────────────

  describe('onSubmit – invalid form', () => {
    it('should do nothing when form is invalid', () => {
      component.onSubmit(invalidForm());
      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('should not set isLoading when form is invalid', () => {
      component.onSubmit(invalidForm());
      expect(component.isLoading).toBeFalse();
    });
  });

  // ── onSubmit – intermediate state ─────────────────────────────────────────

 // ── onSubmit – intermediate state ─────────────────────────────────────────

describe('onSubmit – intermediate state', () => {
  it('should set isLoading=true and clear errorMessage before response', () => {
    const subject = new Subject<any>();                          // ← use Subject
    authSpy.login.and.returnValue(subject.asObservable());

    component.errorMessage = 'old error';
    component.onSubmit(validForm());

    // Observable hasn't emitted yet → still in loading state
    expect(component.isLoading).toBeTrue();                     // ← passes now
    expect(component.errorMessage).toBe('');

    // Clean up — complete the subject so no open observables remain
    subject.next({ token: 'tok' });
    subject.complete();
  });
});

  // ── onSubmit – success: role routing ─────────────────────────────────────

  describe('onSubmit – success routing by role', () => {
    const cases = [
      { role: 'ADMIN', path: '/admin/dashboard' },
      { role: 'AGENT', path: '/agent/dashboard' },
      { role: 'BUYER', path: '/buyer/dashboard' }
    ];

    cases.forEach(({ role, path }) => {
      it(`should navigate to ${path} for role ${role}`, fakeAsync(() => {
        authSpy.login.and.returnValue(of({ token: 'tok' }) as any);
        authSpy.getRole.and.returnValue(role);

        component.onSubmit(validForm());
        tick();

        expect(routerSpy.navigate).toHaveBeenCalledWith([path]);
      }));
    });

    it('should show error toast and navigate to /login for unknown role', fakeAsync(() => {
      authSpy.login.and.returnValue(of({ token: 'tok' }) as any);
      authSpy.getRole.and.returnValue('UNKNOWN');

      component.onSubmit(validForm());
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Invalid Role');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));
  });

  // ── onSubmit – success: redirect URL ─────────────────────────────────────

  describe('onSubmit – success with saved redirectUrl', () => {
    it('should navigateByUrl to saved redirectUrl and skip role switch', fakeAsync(() => {
      sessionStorage.setItem('redirectUrl', '/agent/appointments');
      authSpy.login.and.returnValue(of({ token: 'tok' }) as any);
      authSpy.getRole.and.returnValue('AGENT');

      component.onSubmit(validForm());
      tick();

      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/agent/appointments');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should remove redirectUrl from sessionStorage after redirect', fakeAsync(() => {
      sessionStorage.setItem('redirectUrl', '/agent/appointments');
      authSpy.login.and.returnValue(of({ token: 'tok' }) as any);
      authSpy.getRole.and.returnValue('AGENT');
      spyOn(sessionStorage, 'removeItem');

      component.onSubmit(validForm());
      tick();

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('redirectUrl');
    }));
  });

  // ── onSubmit – success: side effects ─────────────────────────────────────

  describe('onSubmit – success side effects', () => {
    beforeEach(() => {
      authSpy.login.and.returnValue(of({ token: 'my-token' }) as any);
      authSpy.getRole.and.returnValue('BUYER');
    });

    it('should save token to sessionStorage', fakeAsync(() => {
      spyOn(sessionStorage, 'setItem');
      component.onSubmit(validForm());
      tick();
      expect(sessionStorage.setItem).toHaveBeenCalledWith('token', 'my-token');
    }));

    it('should show success toast', fakeAsync(() => {
      component.onSubmit(validForm());
      tick();
      expect(toastSpy.success).toHaveBeenCalledWith('Login Successful');
    }));

    it('should set isLoading=false after success', fakeAsync(() => {
      component.onSubmit(validForm());
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should call cdr.detectChanges after success', fakeAsync(() => {
      cdrSpy.detectChanges.calls.reset();
      component.onSubmit(validForm());
      tick();
      expect(cdrSpy.detectChanges).toHaveBeenCalled();
    }));
  });

  // ── onSubmit – error: message mapping ────────────────────────────────────

  describe('onSubmit – error message mapping', () => {
    function submitWithError(status: number, errorBody: any = {}) {
      authSpy.login.and.returnValue(
        throwError(() => ({ status, error: errorBody }))
      );
      component.onSubmit(validForm());
    }

    it('should set network error message for status 0', fakeAsync(() => {
      submitWithError(0);
      tick();
      expect(component.errorMessage).toBe('Network error. Please check your connection.');
    }));

    it('should use server message for status 401', fakeAsync(() => {
      submitWithError(401, { message: 'Bad credentials' });
      tick();
      expect(component.errorMessage).toBe('Bad credentials');
    }));

    it('should fall back to default for status 401 with no message', fakeAsync(() => {
      submitWithError(401);
      tick();
      expect(component.errorMessage).toBe('Invalid email or password.');
    }));

    it('should use server message for status 403', fakeAsync(() => {
      submitWithError(403, { message: 'Account disabled' });
      tick();
      expect(component.errorMessage).toBe('Account disabled');
    }));

    it('should set server error message for status 500', fakeAsync(() => {
      submitWithError(500);
      tick();
      expect(component.errorMessage).toBe('Server error. Please try again later.');
    }));

    it('should set server error message for status 503', fakeAsync(() => {
      submitWithError(503);
      tick();
      expect(component.errorMessage).toBe('Server error. Please try again later.');
    }));

    it('should use server message for other statuses', fakeAsync(() => {
      submitWithError(422, { message: 'Validation failed' });
      tick();
      expect(component.errorMessage).toBe('Validation failed');
    }));

    it('should fall back to default for other statuses with no message', fakeAsync(() => {
      submitWithError(422);
      tick();
      expect(component.errorMessage).toBe('Login failed. Please try again.');
    }));
  });

  // ── onSubmit – error: side effects ───────────────────────────────────────

  describe('onSubmit – error side effects', () => {
    beforeEach(() => {
      authSpy.login.and.returnValue(throwError(() => ({ status: 401, error: {} })));
    });

    it('should set isLoading=false on error', fakeAsync(() => {
      component.onSubmit(validForm());
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should call toast.error with the error message', fakeAsync(() => {
      component.onSubmit(validForm());
      tick();
      expect(toastSpy.error).toHaveBeenCalledWith('Invalid email or password.');
    }));

    it('should call cdr.detectChanges on error', fakeAsync(() => {
      cdrSpy.detectChanges.calls.reset();
      component.onSubmit(validForm());
      tick();
      expect(cdrSpy.detectChanges).toHaveBeenCalled();
    }));

    it('should not navigate on error', fakeAsync(() => {
      component.onSubmit(validForm());
      tick();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should not call toast.success on error', fakeAsync(() => {
      component.onSubmit(validForm());
      tick();
      expect(toastSpy.success).not.toHaveBeenCalled();
    }));
  });
});