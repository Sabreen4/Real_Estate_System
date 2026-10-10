import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shorthand to instantiate the component directly (bypassing TestBed). */
const makeComponent = (
  auth: jasmine.SpyObj<AuthService>,
  router: jasmine.SpyObj<Router>,
  toast: jasmine.SpyObj<ToastService>,
  platformId: string = 'browser'
) => new ForgotPasswordComponent(auth, router, toast, platformId as any);

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;

  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy   = jasmine.createSpyObj('AuthService',  ['forgotPassword']);
    toastSpy  = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router',       ['navigate', 'getCurrentNavigation']);

    // Safe default: no navigation state
    routerSpy.getCurrentNavigation.and.returnValue(null);

    await TestBed.configureTestingModule({
      declarations: [ForgotPasswordComponent],
      imports:      [FormsModule],
      providers: [
        { provide: AuthService,  useValue: authSpy   },
        { provide: ToastService, useValue: toastSpy  },
        { provide: Router,       useValue: routerSpy },
        { provide: PLATFORM_ID,  useValue: 'browser' }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  describe('creation', () => {
    it('should create the component without errors', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise isLoading to false', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should initialise errorMessage to empty string', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should initialise email to empty string when no nav state', () => {
      expect(component.email).toBe('');
    });

    it('should initialise isEmailPrefilled to false when no nav state', () => {
      expect(component.isEmailPrefilled).toBeFalse();
    });
  });

  // ── Constructor – email prefill ────────────────────────────────────────────

  describe('constructor – email prefill', () => {
    it('should prefill email and set isEmailPrefilled=true when nav state has email', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { email: 'test@mail.com' } }
      } as any);

      const comp = makeComponent(authSpy, routerSpy, toastSpy);

      expect(comp.email).toBe('test@mail.com');
      expect(comp.isEmailPrefilled).toBeTrue();
    });

    it('should NOT prefill when getCurrentNavigation returns null', () => {
      routerSpy.getCurrentNavigation.and.returnValue(null);

      const comp = makeComponent(authSpy, routerSpy, toastSpy);

      expect(comp.email).toBe('');
      expect(comp.isEmailPrefilled).toBeFalse();
    });

    it('should NOT prefill when nav extras is null', () => {
      routerSpy.getCurrentNavigation.and.returnValue({ extras: null } as any);

      const comp = makeComponent(authSpy, routerSpy, toastSpy);

      expect(comp.email).toBe('');
      expect(comp.isEmailPrefilled).toBeFalse();
    });

    it('should NOT prefill when nav extras.state is null', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: null }
      } as any);

      const comp = makeComponent(authSpy, routerSpy, toastSpy);

      expect(comp.email).toBe('');
      expect(comp.isEmailPrefilled).toBeFalse();
    });

    it('should NOT prefill when nav extras.state has no email key', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: {} }
      } as any);

      const comp = makeComponent(authSpy, routerSpy, toastSpy);

      expect(comp.email).toBe('');
      expect(comp.isEmailPrefilled).toBeFalse();
    });

    it('should NOT prefill when nav extras.state.email is an empty string', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { email: '' } }
      } as any);

      const comp = makeComponent(authSpy, routerSpy, toastSpy);

      expect(comp.email).toBe('');
      expect(comp.isEmailPrefilled).toBeFalse();
    });
  });

  // ── onSubmit – guard: form invalid ────────────────────────────────────────

  describe('onSubmit – form invalid', () => {
    it('should return early and NOT call forgotPassword when form is invalid', () => {
      component.onSubmit({ invalid: true } as any);
      expect(authSpy.forgotPassword).not.toHaveBeenCalled();
    });

    it('should NOT set isLoading when form is invalid', () => {
      component.onSubmit({ invalid: true } as any);
      expect(component.isLoading).toBeFalse();
    });

    it('should NOT clear errorMessage when form is invalid', () => {
      component.errorMessage = 'prior error';
      component.onSubmit({ invalid: true } as any);
      expect(component.errorMessage).toBe('prior error'); // unchanged
    });
  });

  // ── onSubmit – intermediate state ─────────────────────────────────────────

  describe('onSubmit – intermediate state', () => {
    it('should set isLoading=true and clear errorMessage before the HTTP response', () => {
      const subject = new Subject<any>();
      authSpy.forgotPassword.and.returnValue(subject.asObservable());

      component.email        = 'test@mail.com';
      component.errorMessage = 'old error';

      component.onSubmit({ invalid: false } as any);

      // Observable hasn't emitted yet — inspect state mid-flight
      expect(component.isLoading).toBeTrue();
      expect(component.errorMessage).toBe('');

      // Clean up
      subject.next({});
      subject.complete();
    });
  });

  // ── onSubmit – success flow ────────────────────────────────────────────────

  describe('onSubmit – success', () => {
    it('should call forgotPassword with the correct email payload', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(of({}) as any);
      component.email = 'test@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(authSpy.forgotPassword).toHaveBeenCalledWith({ email: 'test@mail.com' });
    }));

    it('should show success toast with the correct message', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(of({}) as any);
      component.email = 'test@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(toastSpy.success).toHaveBeenCalledWith('OTP sent to your email');
    }));

    it('should store the email in sessionStorage (browser platform)', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(of({}) as any);
      spyOn(sessionStorage, 'setItem');
      component.email = 'test@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(sessionStorage.setItem).toHaveBeenCalledWith('otp_email', 'test@mail.com');
    }));

    it('should navigate to /verify-otp with the email in state', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(of({}) as any);
      component.email = 'test@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/verify-otp'],
        { state: { email: 'test@mail.com' } }
      );
    }));

    it('should set isLoading=false after a successful response', fakeAsync(() => {
      const subject = new Subject<any>();
      authSpy.forgotPassword.and.returnValue(subject.asObservable());
      component.email = 'test@mail.com';

      component.onSubmit({ invalid: false } as any);
      expect(component.isLoading).toBeTrue();

      subject.next({});
      subject.complete();
      tick();

      expect(component.isLoading).toBeFalse();
    }));

    it('should NOT call toastSpy.error on success', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(of({}) as any);
      component.email = 'test@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(toastSpy.error).not.toHaveBeenCalled();
    }));
  });

  // ── onSubmit – server platform (no sessionStorage) ────────────────────────

  describe('onSubmit – server platform', () => {
    it('should NOT write to sessionStorage when running on the server', fakeAsync(() => {
      const comp = makeComponent(authSpy, routerSpy, toastSpy, 'server');
      authSpy.forgotPassword.and.returnValue(of({}) as any);
      spyOn(sessionStorage, 'setItem');

      comp.email = 'test@mail.com';
      comp.onSubmit({ invalid: false } as any);
      tick();

      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    }));

    it('should still navigate and show toast on server platform', fakeAsync(() => {
      const comp = makeComponent(authSpy, routerSpy, toastSpy, 'server');
      authSpy.forgotPassword.and.returnValue(of({}) as any);

      comp.email = 'test@mail.com';
      comp.onSubmit({ invalid: false } as any);
      tick();

      expect(toastSpy.success).toHaveBeenCalledWith('OTP sent to your email');
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/verify-otp'],
        { state: { email: 'test@mail.com' } }
      );
    }));
  });

  // ── onSubmit – error flow ─────────────────────────────────────────────────

  describe('onSubmit – error', () => {
    it('should use err.error.message when the backend provides one', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid email' } }))
      );
      component.email = 'wrong@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(component.errorMessage).toBe('Invalid email');
    }));

    it('should show the backend error message via toast.error', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid email' } }))
      );
      component.email = 'wrong@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(toastSpy.error).toHaveBeenCalledWith('Invalid email');
    }));

    it('should fall back to the generic message when err.error.message is absent', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(throwError(() => ({ error: {} })));
      component.email = 'wrong@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(component.errorMessage).toBe('Something went wrong.');
      expect(toastSpy.error).toHaveBeenCalledWith('Something went wrong.');
    }));

    it('should fall back to the generic message when err.error is absent', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(throwError(() => ({})));
      component.email = 'wrong@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(component.errorMessage).toBe('Something went wrong.');
      expect(toastSpy.error).toHaveBeenCalledWith('Something went wrong.');
    }));

    it('should set isLoading=false on error', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(throwError(() => ({})));
      component.email = 'wrong@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(component.isLoading).toBeFalse();
    }));

    it('should NOT navigate on error', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(throwError(() => ({})));
      component.email = 'wrong@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should NOT write to sessionStorage on error', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(throwError(() => ({})));
      spyOn(sessionStorage, 'setItem');
      component.email = 'wrong@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    }));

    it('should NOT call toastSpy.success on error', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(throwError(() => ({})));
      component.email = 'wrong@mail.com';

      component.onSubmit({ invalid: false } as any);
      tick();

      expect(toastSpy.success).not.toHaveBeenCalled();
    }));
  });
});