import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, PLATFORM_ID } from '@angular/core';

import { VerifyOtpComponent } from './verify-otp.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeCdr = (): ChangeDetectorRef =>
  ({ detectChanges: jasmine.createSpy('detectChanges') } as unknown as ChangeDetectorRef);

/** Instantiates the component directly, bypassing TestBed. */
const makeComponent = (
  auth: jasmine.SpyObj<AuthService>,
  router: jasmine.SpyObj<Router>,
  toast: jasmine.SpyObj<ToastService>,
  cdr: ChangeDetectorRef,
  platformId: string = 'browser'
) => new VerifyOtpComponent(auth, router, toast, cdr, platformId as any);

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('VerifyOtpComponent', () => {
  let component: VerifyOtpComponent;
  let fixture: ComponentFixture<VerifyOtpComponent>;

  let authSpy:   jasmine.SpyObj<AuthService>;
  let toastSpy:  jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let cdrSpy:    jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    sessionStorage.clear(); // prevent state leaking between tests

    authSpy   = jasmine.createSpyObj('AuthService',  ['verifyOtp', 'forgotPassword']);
    toastSpy  = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router',       ['navigate', 'getCurrentNavigation']);
    cdrSpy    = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    routerSpy.getCurrentNavigation.and.returnValue(null as any);

    await TestBed.configureTestingModule({
      declarations: [VerifyOtpComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthService,        useValue: authSpy   },
        { provide: ToastService,       useValue: toastSpy  },
        { provide: Router,             useValue: routerSpy },
        { provide: ChangeDetectorRef,  useValue: cdrSpy    },
        { provide: PLATFORM_ID,        useValue: 'browser' }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(VerifyOtpComponent);
    component = fixture.componentInstance;

    // Replace the injected CDR with our spy
    (component as any).cdr = cdrSpy;
  });

  afterEach(() => {
    // Always destroy timers after each test
    component.ngOnDestroy();
    sessionStorage.clear();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  describe('creation', () => {
    it('should create the component without errors', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise otp to empty string', () => {
      expect(component.otp).toBe('');
    });

    it('should initialise isLoading to false', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should initialise errorMessage to empty string', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should initialise canResend to false', () => {
      expect(component.canResend).toBeFalse();
    });

    it('should initialise resendCooldown to 60', () => {
      expect(component.resendCooldown).toBe(60);
    });
  });

  // ── Constructor – email resolution ────────────────────────────────────────

  describe('constructor – email resolution', () => {
    it('should read email from navigation state', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { email: 'nav@mail.com' } }
      } as any);

      const comp = makeComponent(authSpy, routerSpy, toastSpy, makeCdr());
      expect(comp.email).toBe('nav@mail.com');
    });

    it('should persist email to sessionStorage when reading from nav state (browser)', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { email: 'nav@mail.com' } }
      } as any);
      spyOn(sessionStorage, 'setItem');

      makeComponent(authSpy, routerSpy, toastSpy, makeCdr(), 'browser');

      expect(sessionStorage.setItem).toHaveBeenCalledWith('otp_email', 'nav@mail.com');
    });

    it('should NOT write to sessionStorage when reading from nav state on server', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { email: 'nav@mail.com' } }
      } as any);
      spyOn(sessionStorage, 'setItem');

      makeComponent(authSpy, routerSpy, toastSpy, makeCdr(), 'server');

      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should fall back to sessionStorage when nav state has no email (browser)', () => {
      routerSpy.getCurrentNavigation.and.returnValue(null as any);
      sessionStorage.setItem('otp_email', 'stored@mail.com');

      const comp = makeComponent(authSpy, routerSpy, toastSpy, makeCdr(), 'browser');
      expect(comp.email).toBe('stored@mail.com');
    });

    it('should set email to empty string when sessionStorage is also empty (browser)', () => {
      routerSpy.getCurrentNavigation.and.returnValue(null as any);
      sessionStorage.removeItem('otp_email');

      const comp = makeComponent(authSpy, routerSpy, toastSpy, makeCdr(), 'browser');
      expect(comp.email).toBe('');
    });

    it('should set email to empty string on server with no nav state', () => {
      routerSpy.getCurrentNavigation.and.returnValue(null as any);

      const comp = makeComponent(authSpy, routerSpy, toastSpy, makeCdr(), 'server');
      expect(comp.email).toBe('');
    });

    it('should fall back to sessionStorage when nav extras is null', () => {
      routerSpy.getCurrentNavigation.and.returnValue({ extras: null } as any);
      sessionStorage.setItem('otp_email', 'fallback@mail.com');

      const comp = makeComponent(authSpy, routerSpy, toastSpy, makeCdr(), 'browser');
      expect(comp.email).toBe('fallback@mail.com');
    });

    it('should fall back to sessionStorage when nav extras.state.email is empty string', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { email: '' } }
      } as any);
      sessionStorage.setItem('otp_email', 'fallback@mail.com');

      const comp = makeComponent(authSpy, routerSpy, toastSpy, makeCdr(), 'browser');
      expect(comp.email).toBe('fallback@mail.com');
    });
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should redirect to /forgot-password when email is empty', () => {
      component.email = '';
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/forgot-password']);
    });

    it('should NOT start timer when redirecting', () => {
      component.email = '';
      spyOn(component, 'startTimer');
      component.ngOnInit();
      expect(component.startTimer).not.toHaveBeenCalled();
    });

    it('should call startTimer when email is present', fakeAsync(() => {
      component.email = 'test@mail.com';
      spyOn(component, 'startTimer');
      component.ngOnInit();
      expect(component.startTimer).toHaveBeenCalled();
      tick(60000); // drain timer
    }));

    it('should NOT navigate when email is present', fakeAsync(() => {
      component.email = 'test@mail.com';
      component.ngOnInit();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      tick(60000);
    }));
  });

  // ── onSubmit – guard: invalid OTP ─────────────────────────────────────────

  describe('onSubmit – invalid OTP guard', () => {
    it('should reject an empty otp', () => {
      component.otp = '';
      component.onSubmit();
      expect(component.errorMessage).toBe('Please enter a valid 6-digit OTP.');
      expect(authSpy.verifyOtp).not.toHaveBeenCalled();
    });

    it('should reject an otp shorter than 6 digits', () => {
      component.otp = '123';
      component.onSubmit();
      expect(component.errorMessage).toBe('Please enter a valid 6-digit OTP.');
      expect(authSpy.verifyOtp).not.toHaveBeenCalled();
    });

    it('should reject an otp longer than 6 digits', () => {
      component.otp = '1234567';
      component.onSubmit();
      expect(component.errorMessage).toBe('Please enter a valid 6-digit OTP.');
      expect(authSpy.verifyOtp).not.toHaveBeenCalled();
    });

    it('should NOT set isLoading when otp is invalid', () => {
      component.otp = '12';
      component.onSubmit();
      expect(component.isLoading).toBeFalse();
    });
  });

  // ── onSubmit – intermediate state ─────────────────────────────────────────

  describe('onSubmit – intermediate state', () => {
    it('should set isLoading=true and clear errorMessage before HTTP response', () => {
      const subject = new Subject<any>();
      authSpy.verifyOtp.and.returnValue(subject.asObservable());

      component.email        = 'test@mail.com';
      component.otp          = '123456';
      component.errorMessage = 'old error';

      component.onSubmit();

      expect(component.isLoading).toBeTrue();
      expect(component.errorMessage).toBe('');

      subject.next({ email: 'test@mail.com' });
      subject.complete();
    });
  });

  // ── onSubmit – success path ────────────────────────────────────────────────

  describe('onSubmit – success', () => {
    beforeEach(() => {
      component.email = 'test@mail.com';
      component.otp   = '123456';
    });

    it('should call verifyOtp with the correct payload', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(of({ email: 'test@mail.com' }) as any);
      component.onSubmit();
      tick();
      expect(authSpy.verifyOtp).toHaveBeenCalledWith({
        email: 'test@mail.com',
        otp:   '123456'
      });
    }));

    it('should set isLoading=false after success', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(of({ email: 'test@mail.com' }) as any);
      component.onSubmit();
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should call cdr.detectChanges after success', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(of({ email: 'test@mail.com' }) as any);
      cdrSpy.detectChanges.calls.reset();
      component.onSubmit();
      tick();
      expect(cdrSpy.detectChanges).toHaveBeenCalled();
    }));

    it('should remove otp_email from sessionStorage on success (browser)', fakeAsync(() => {
      sessionStorage.setItem('otp_email', 'test@mail.com');
      authSpy.verifyOtp.and.returnValue(of({ email: 'test@mail.com' }) as any);
      spyOn(sessionStorage, 'removeItem');
      component.onSubmit();
      tick();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('otp_email');
    }));

    it('should NOT remove from sessionStorage on success when server platform', fakeAsync(() => {
      const comp = makeComponent(authSpy, routerSpy, toastSpy, cdrSpy, 'server');
      comp.email = 'test@mail.com';
      comp.otp   = '123456';
      authSpy.verifyOtp.and.returnValue(of({ email: 'test@mail.com' }) as any);
      spyOn(sessionStorage, 'removeItem');
      comp.onSubmit();
      tick();
      expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    }));

    it('should show success toast', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(of({ email: 'test@mail.com' }) as any);
      component.onSubmit();
      tick();
      expect(toastSpy.success).toHaveBeenCalledWith('OTP verified successfully');
    }));

    it('should navigate to /reset-password with email in state', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(of({ email: 'test@mail.com' }) as any);
      component.onSubmit();
      tick();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/reset-password'],
        { state: { email: 'test@mail.com' } }
      );
    }));

    it('should NOT call toast.error on success', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(of({ email: 'test@mail.com' }) as any);
      component.onSubmit();
      tick();
      expect(toastSpy.error).not.toHaveBeenCalled();
    }));
  });

  // ── onSubmit – error path ─────────────────────────────────────────────────

  describe('onSubmit – error', () => {
    beforeEach(() => {
      component.email = 'test@mail.com';
      component.otp   = '123456';
    });

    it('should use err.error.message when provided', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid OTP' } }))
      );
      component.onSubmit();
      tick();
      expect(component.errorMessage).toBe('Invalid OTP');
      expect(toastSpy.error).toHaveBeenCalledWith('Invalid OTP');
    }));

    it('should fall back to default error message when err.error.message is absent', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(throwError(() => ({ error: {} })));
      component.onSubmit();
      tick();
      expect(component.errorMessage).toBe('Invalid or expired OTP.');
      expect(toastSpy.error).toHaveBeenCalledWith('Invalid or expired OTP.');
    }));

    it('should fall back to default error message when err.error is absent', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      tick();
      expect(component.errorMessage).toBe('Invalid or expired OTP.');
    }));

    it('should set isLoading=false on error', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should call cdr.detectChanges on error', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(throwError(() => ({})));
      cdrSpy.detectChanges.calls.reset();
      component.onSubmit();
      tick();
      expect(cdrSpy.detectChanges).toHaveBeenCalled();
    }));

    it('should NOT navigate on error', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      tick();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should NOT call toast.success on error', fakeAsync(() => {
      authSpy.verifyOtp.and.returnValue(throwError(() => ({})));
      component.onSubmit();
      tick();
      expect(toastSpy.success).not.toHaveBeenCalled();
    }));
  });

  // ── resendOtp ─────────────────────────────────────────────────────────────

  describe('resendOtp', () => {
    beforeEach(() => {
      component.email = 'test@mail.com';
    });

    it('should call forgotPassword with the current email', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(of({}) as any);
      component.resendOtp();
      tick();
      expect(authSpy.forgotPassword).toHaveBeenCalledWith({ email: 'test@mail.com' });
    }));

    it('should show success toast on resend success', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(of({}) as any);
      component.resendOtp();
      tick();
      expect(toastSpy.success).toHaveBeenCalledWith('OTP resent to your email');
    }));

    it('should restart the timer on resend success', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(of({}) as any);
      component.canResend = true; // simulate cooldown expired
      spyOn(component, 'startTimer').and.callThrough();
      component.resendOtp();
      tick();
      expect(component.startTimer).toHaveBeenCalled();
      expect(component.canResend).toBeFalse(); // timer reset
      tick(60000); // drain
    }));

    it('should show error toast on resend failure', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(throwError(() => new Error('fail')));
      component.resendOtp();
      tick();
      expect(toastSpy.error).toHaveBeenCalledWith('Failed to resend OTP.');
    }));

    it('should NOT call startTimer on resend failure', fakeAsync(() => {
      authSpy.forgotPassword.and.returnValue(throwError(() => new Error('fail')));
      spyOn(component, 'startTimer');
      component.resendOtp();
      tick();
      expect(component.startTimer).not.toHaveBeenCalled();
    }));
  });

  // ── startTimer ────────────────────────────────────────────────────────────

  describe('startTimer', () => {
    it('should set canResend=false and resendCooldown=60 immediately', fakeAsync(() => {
      component.canResend      = true;
      component.resendCooldown = 0;
      component.startTimer();
      expect(component.canResend).toBeFalse();
      expect(component.resendCooldown).toBe(60);
      tick(60000);
    }));

    it('should decrement resendCooldown each second', fakeAsync(() => {
      component.startTimer();
      tick(1000);
      expect(component.resendCooldown).toBe(59);
      tick(1000);
      expect(component.resendCooldown).toBe(58);
      tick(58000); // drain remaining
    }));

    it('should set canResend=true after full 60-second countdown', fakeAsync(() => {
      component.startTimer();
      expect(component.canResend).toBeFalse();
      tick(60000);
      expect(component.canResend).toBeTrue();
    }));

    it('should clear the interval once countdown reaches zero', fakeAsync(() => {
      component.startTimer();
      tick(60000);
      // Ticking further should not change resendCooldown (interval is cleared)
      tick(5000);
      expect(component.resendCooldown).toBe(0);
    }));

    it('should restart cleanly if called again while a timer is running', fakeAsync(() => {
      component.startTimer();
      tick(10000); // advance 10 s into first timer
      component.startTimer(); // restart
      expect(component.resendCooldown).toBe(60);
      tick(60000);
      expect(component.canResend).toBeTrue();
    }));
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should clear the interval when a timer is running', fakeAsync(() => {
      component.startTimer();
      expect(() => component.ngOnDestroy()).not.toThrow();
      tick(60000); // drain — no unhandled timer errors
    }));

    it('should not throw when no timer was ever started', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should stop the countdown after destroy', fakeAsync(() => {
      component.startTimer();
      tick(5000);
      component.ngOnDestroy();
      const countdownAtDestroy = component.resendCooldown;
      tick(10000); // more time passes but interval is cleared
      expect(component.resendCooldown).toBe(countdownAtDestroy);
    }));
  });
});