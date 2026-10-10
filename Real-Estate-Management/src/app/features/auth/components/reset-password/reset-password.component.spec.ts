import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NgForm, FormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shorthand for a partial NgForm mock. */
const mockForm = (invalid: boolean): NgForm => ({ invalid } as NgForm);

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  let authSpy:   jasmine.SpyObj<AuthService>;
  let toastSpy:  jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy   = jasmine.createSpyObj('AuthService',  ['resetPassword']);
    toastSpy  = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router',       ['navigate', 'getCurrentNavigation']);

    // Safe default: no navigation state
    routerSpy.getCurrentNavigation.and.returnValue(null as any);

    await TestBed.configureTestingModule({
      declarations: [ResetPasswordComponent],
      imports:      [FormsModule],
      providers: [
        { provide: AuthService,  useValue: authSpy   },
        { provide: ToastService, useValue: toastSpy  },
        { provide: Router,       useValue: routerSpy }
      ]
    }).compileComponents();
  });

  /** Creates the fixture with a given nav-state email and triggers ngOnInit. */
  function createComponent(email: string | null): void {
    routerSpy.getCurrentNavigation.and.returnValue(
      email !== null ? { extras: { state: { email } } } as any : null as any
    );
    fixture   = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  }

  /** Directly instantiates the component without TestBed (for constructor tests). */
  function makeComponent(navReturn: any): ResetPasswordComponent {
    routerSpy.getCurrentNavigation.and.returnValue(navReturn);
    return new ResetPasswordComponent(authSpy, routerSpy, toastSpy);
  }

  // ── Creation / initial state ───────────────────────────────────────────────

  describe('creation', () => {
    beforeEach(() => createComponent('test@mail.com'));

    it('should create the component without errors', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise newPassword to empty string', () => {
      expect(component.newPassword).toBe('');
    });

    it('should initialise confirmPassword to empty string', () => {
      expect(component.confirmPassword).toBe('');
    });

    it('should initialise isLoading to false', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should initialise errorMessage to empty string', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should initialise showPassword to false', () => {
      expect(component.showPassword).toBeFalse();
    });
  });

  // ── Constructor – email resolution ─────────────────────────────────────────

  describe('constructor – email resolution', () => {
    it('should set email from navigation state', () => {
      const comp = makeComponent({ extras: { state: { email: 'test@mail.com' } } });
      expect(comp.email).toBe('test@mail.com');
    });

    it('should set email to empty string when getCurrentNavigation returns null', () => {
      const comp = makeComponent(null);
      expect(comp.email).toBe('');
    });

    it('should set email to empty string when nav extras is null', () => {
      const comp = makeComponent({ extras: null });
      expect(comp.email).toBe('');
    });

    it('should set email to empty string when nav extras.state is null', () => {
      const comp = makeComponent({ extras: { state: null } });
      expect(comp.email).toBe('');
    });

    it('should set email to empty string when nav extras.state has no email key', () => {
      const comp = makeComponent({ extras: { state: {} } });
      expect(comp.email).toBe('');
    });

    it('should set email to empty string when nav state email is empty string', () => {
      const comp = makeComponent({ extras: { state: { email: '' } } });
      expect(comp.email).toBe('');
    });
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should redirect to /forgot-password when email is empty', () => {
      createComponent('');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/forgot-password']);
    });

    it('should redirect to /forgot-password when nav is null (email resolves to empty)', () => {
      createComponent(null);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/forgot-password']);
    });

    it('should NOT redirect when email is present', () => {
      createComponent('test@mail.com');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  // ── onSubmit – guard: form invalid ────────────────────────────────────────

  describe('onSubmit – form invalid', () => {
    beforeEach(() => createComponent('test@mail.com'));

    it('should NOT call resetPassword when form is invalid', () => {
      component.onSubmit(mockForm(true));
      expect(authSpy.resetPassword).not.toHaveBeenCalled();
    });

    it('should NOT set isLoading when form is invalid', () => {
      component.onSubmit(mockForm(true));
      expect(component.isLoading).toBeFalse();
    });

    it('should NOT modify errorMessage when form is invalid', () => {
      component.errorMessage = 'prior error';
      component.onSubmit(mockForm(true));
      expect(component.errorMessage).toBe('prior error');
    });
  });

  // ── onSubmit – guard: password mismatch ───────────────────────────────────

  describe('onSubmit – password mismatch', () => {
    beforeEach(() => createComponent('test@mail.com'));

    it('should set errorMessage when passwords do not match', () => {
      component.newPassword     = 'abc';
      component.confirmPassword = 'xyz';
      component.onSubmit(mockForm(false));
      expect(component.errorMessage).toBe('Passwords do not match.');
    });

    it('should keep isLoading=false on mismatch', () => {
      component.newPassword     = 'abc';
      component.confirmPassword = 'xyz';
      component.onSubmit(mockForm(false));
      expect(component.isLoading).toBeFalse();
    });

    it('should NOT call resetPassword on mismatch', () => {
      component.newPassword     = 'abc';
      component.confirmPassword = 'xyz';
      component.onSubmit(mockForm(false));
      expect(authSpy.resetPassword).not.toHaveBeenCalled();
    });
  });

  // ── onSubmit – intermediate state ─────────────────────────────────────────

  describe('onSubmit – intermediate state', () => {
    beforeEach(() => createComponent('test@mail.com'));

    it('should set isLoading=true and clear errorMessage before HTTP response', () => {
      const subject = new Subject<any>();
      authSpy.resetPassword.and.returnValue(subject.asObservable());

      component.newPassword     = 'abc123';
      component.confirmPassword = 'abc123';
      component.errorMessage    = 'old error';

      component.onSubmit(mockForm(false));

      // Observable hasn't emitted yet — inspect mid-flight state
      expect(component.isLoading).toBeTrue();
      expect(component.errorMessage).toBe('');

      subject.next({});
      subject.complete();
    });
  });

  // ── onSubmit – success path ────────────────────────────────────────────────

  describe('onSubmit – success', () => {
    beforeEach(() => {
      createComponent('test@mail.com');
      component.newPassword     = 'newPass1!';
      component.confirmPassword = 'newPass1!';
    });

    it('should call resetPassword with the correct payload', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(of({}) as any);
      component.onSubmit(mockForm(false));
      tick();
      expect(authSpy.resetPassword).toHaveBeenCalledWith({
        email:       'test@mail.com',
        newPassword: 'newPass1!'
      });
    }));

    it('should set isLoading=false after success', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(of({}) as any);
      component.onSubmit(mockForm(false));
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should show success toast with the correct message', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(of({}) as any);
      component.onSubmit(mockForm(false));
      tick();
      expect(toastSpy.success).toHaveBeenCalledWith(
        'Password reset successfully. Please login.'
      );
    }));

    it('should navigate to /login after success', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(of({}) as any);
      component.onSubmit(mockForm(false));
      tick();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should NOT call toast.error on success', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(of({}) as any);
      component.onSubmit(mockForm(false));
      tick();
      expect(toastSpy.error).not.toHaveBeenCalled();
    }));
  });

  // ── onSubmit – error path ─────────────────────────────────────────────────

  describe('onSubmit – error', () => {
    beforeEach(() => {
      createComponent('test@mail.com');
      component.newPassword     = 'newPass1!';
      component.confirmPassword = 'newPass1!';
    });

    it('should use err.error.message when the backend provides one', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(
        throwError(() => ({ error: { message: 'Reset failed' } }))
      );
      component.onSubmit(mockForm(false));
      tick();
      expect(component.errorMessage).toBe('Reset failed');
      expect(toastSpy.error).toHaveBeenCalledWith('Reset failed');
    }));

    it('should fall back to generic message when err.error.message is absent', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(throwError(() => ({ error: {} })));
      component.onSubmit(mockForm(false));
      tick();
      expect(component.errorMessage).toBe('Something went wrong.');
      expect(toastSpy.error).toHaveBeenCalledWith('Something went wrong.');
    }));

    it('should fall back to generic message when err.error is absent', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(throwError(() => ({})));
      component.onSubmit(mockForm(false));
      tick();
      expect(component.errorMessage).toBe('Something went wrong.');
    }));

    it('should set isLoading=false on error', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(throwError(() => ({})));
      component.onSubmit(mockForm(false));
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should NOT navigate on error', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(throwError(() => ({})));
      component.onSubmit(mockForm(false));
      tick();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should NOT call toast.success on error', fakeAsync(() => {
      authSpy.resetPassword.and.returnValue(throwError(() => ({})));
      component.onSubmit(mockForm(false));
      tick();
      expect(toastSpy.success).not.toHaveBeenCalled();
    }));
  });

  // ── togglePasswordVisibility ──────────────────────────────────────────────

  describe('togglePasswordVisibility', () => {
    beforeEach(() => createComponent('test@mail.com'));

    it('should toggle showPassword from false to true', () => {
      component.showPassword = false;
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeTrue();
    });

    it('should toggle showPassword from true back to false', () => {
      component.showPassword = true;
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeFalse();
    });

    it('should toggle correctly across multiple calls', () => {
      component.showPassword = false;
      component.togglePasswordVisibility();
      component.togglePasswordVisibility();
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeTrue(); // odd number of toggles
    });
  });
});