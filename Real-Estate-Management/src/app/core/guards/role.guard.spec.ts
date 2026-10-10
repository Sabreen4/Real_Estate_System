import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { roleGuard } from './role-guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getRole'
    ]);

    routerSpy = jasmine.createSpyObj('Router', [
      'navigate'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  const executeGuard = (
    currentRole: string,
    expectedRole: string
  ) => {
    authServiceSpy.getRole.and.returnValue(currentRole);

    const route: any = {
      data: {
        role: expectedRole
      }
    };

    const state: any = {};

    return TestBed.runInInjectionContext(() =>
      roleGuard(route, state)
    );
  };

  it('should allow access when role matches', () => {
    const result = executeGuard('ADMIN', 'ADMIN');

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should deny access when role does not match', () => {
    const result = executeGuard('AGENT', 'ADMIN');

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should allow AGENT role', () => {
    const result = executeGuard('AGENT', 'AGENT');

    expect(result).toBeTrue();
  });

  it('should allow BUYER role', () => {
    const result = executeGuard('BUYER', 'BUYER');

    expect(result).toBeTrue();
  });

  it('should redirect BUYER when ADMIN expected', () => {
    const result = executeGuard('BUYER', 'ADMIN');

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect when role is empty', () => {
    const result = executeGuard('', 'ADMIN');

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});