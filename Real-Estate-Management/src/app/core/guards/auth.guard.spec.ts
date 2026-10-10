import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthGuard } from './auth-guard';
import { AuthService } from '../services/auth.service';
import { PLATFORM_ID } from '@angular/core';

describe('AuthGuard', () => {
  let guard:          AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy:      jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getRole']);
    routerSpy      = jasmine.createSpyObj('Router',      ['navigate']);
   
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
            { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  // ── Helper ──────────────────────────────────────────────────────────────

  function runGuard(
    loggedIn:     boolean,
    role:         string,
    expectedRole?: string,
    url:          string = '/some-page'
  ): boolean {
    authServiceSpy.isLoggedIn.and.returnValue(loggedIn);
    authServiceSpy.getRole.and.returnValue(role);

    const route = { data: { role: expectedRole } } as unknown as ActivatedRouteSnapshot;
    const state = { url }                           as RouterStateSnapshot;

    return guard.canActivate(route, state) as boolean;
  }

  // ── Not logged in ────────────────────────────────────────────────────────

  describe('when not logged in', () => {
    it('should return false', () => {
      const result = runGuard(false, '', 'ADMIN');
      expect(result).toBeFalse();
    });

    it('should redirect to /login', () => {
      runGuard(false, '', 'ADMIN');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should save the intended URL to sessionStorage', () => {
      spyOn(sessionStorage, 'setItem');
      runGuard(false, '', 'ADMIN', '/agent/dashboard');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('redirectUrl', '/agent/dashboard');
    });

    it('should not call getRole when not logged in', () => {
      runGuard(false, '');
      expect(authServiceSpy.getRole).not.toHaveBeenCalled();
    });
  });

  // ── Logged in, role matches ───────────────────────────────────────────────

  describe('when logged in with matching role', () => {
    it('should return true for ADMIN', () => {
      expect(runGuard(true, 'ADMIN', 'ADMIN')).toBeTrue();
    });

    it('should return true for AGENT', () => {
      expect(runGuard(true, 'AGENT', 'AGENT')).toBeTrue();
    });

    it('should return true for BUYER', () => {
      expect(runGuard(true, 'BUYER', 'BUYER')).toBeTrue();
    });

    it('should not navigate when role matches', () => {
      runGuard(true, 'ADMIN', 'ADMIN');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should return true when no expectedRole is set on route', () => {
      expect(runGuard(true, 'ADMIN', undefined)).toBeTrue();
    });

    it('should not navigate when no expectedRole is set on route', () => {
      runGuard(true, 'ADMIN', undefined);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  // ── Logged in, role mismatch ─────────────────────────────────────────────

  describe('when logged in with wrong role', () => {
    it('should return false', () => {
      expect(runGuard(true, 'ADMIN', 'AGENT')).toBeFalse();
    });

    it('should redirect ADMIN to /admin dashboard', () => {
      runGuard(true, 'ADMIN', 'AGENT');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should redirect AGENT to /agent dashboard', () => {
      runGuard(true, 'AGENT', 'ADMIN');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/agent']);
    });

    it('should redirect BUYER to /buyer dashboard', () => {
      runGuard(true, 'BUYER', 'ADMIN');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/buyer']);
    });

    it('should redirect unknown role to /login', () => {
      runGuard(true, 'UNKNOWN', 'ADMIN');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ── Case / whitespace normalisation ──────────────────────────────────────

  describe('role normalisation', () => {
    it('should trim and uppercase the user role', () => {
      expect(runGuard(true, ' admin ', 'ADMIN')).toBeTrue();
    });

    it('should trim and uppercase the expected role from route data', () => {
      expect(runGuard(true, 'ADMIN', ' admin ')).toBeTrue();
    });

    it('should handle mixed case user role', () => {
      expect(runGuard(true, 'Agent', 'AGENT')).toBeTrue();
    });

    it('should handle mixed case expected role', () => {
      expect(runGuard(true, 'BUYER', 'Buyer')).toBeTrue();
    });
  });
});