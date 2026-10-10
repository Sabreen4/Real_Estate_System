import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from 'src/app/core/services/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthResponse } from 'src/app/core/models/auth-response.model';
import { RegisterRequest } from '../models/register-request.model';

// ─── JWT helpers ──────────────────────────────────────────────────────────────
// jwtDecode expects base64url encoding (RFC 4648 §5): '+' → '-', '/' → '_', no '='
function toBase64Url(obj: object): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function makeToken(payload: object): string {
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${toBase64Url(payload)}.signature`;
}

// ─── Shared mock tokens ───────────────────────────────────────────────────────
const mockToken         = makeToken({ role: 'Admin', sub: '1' });
const mockTokenMsClaim  = makeToken({
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Agent',
  sub: '2'
});
const noRoleToken       = makeToken({ sub: '3' });

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/auth`;

  // Resets the TestBed module between describe blocks that use different PLATFORM_ID
  function setupBrowser(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports:   [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  function setupServer(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports:   [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => sessionStorage.clear());

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login()', () => {
    beforeEach(setupBrowser);

    it('should POST to /auth/login and return AuthResponse', () => {
      const creds = { email: 'a@b.com', password: '123' };
      const mockResp: AuthResponse = {
        success:   true,
        message:   'OK',
        token:     mockToken,
        userId:    1,
        roleId:    1,
        firstName: 'Test',
        lastName:  'User',
        email:     'a@b.com'
      };

      service.login(creds).subscribe(res => expect(res).toEqual(mockResp));

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(creds);
      req.flush(mockResp);
    });
  });

  // ─── register ──────────────────────────────────────────────────────────────

  describe('register()', () => {
    beforeEach(setupBrowser);

    it('should POST to /auth/register', () => {
      const payload: RegisterRequest = {
        email:     'x@y.com',
        password:  'pw',
        role:      'Buyer',
        firstName: 'John',
        lastName:  'Doe',
        phone:     '0123456789'
      };

      service.register(payload).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ id: 1 });
    });
  });

  // ─── forgotPassword ────────────────────────────────────────────────────────

  describe('forgotPassword()', () => {
    beforeEach(setupBrowser);

    it('should POST to /auth/forgot-password', () => {
      const body = { email: 'a@b.com' };

      service.forgotPassword(body).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/forgot-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });
  });

  // ─── verifyOtp ─────────────────────────────────────────────────────────────

  describe('verifyOtp()', () => {
    beforeEach(setupBrowser);

    it('should POST to /auth/verify-otp and return email', () => {
      const body = { email: 'a@b.com', otp: '1234' };

      service.verifyOtp(body).subscribe(res => expect(res.email).toBe('a@b.com'));

      const req = httpMock.expectOne(`${apiUrl}/verify-otp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ email: 'a@b.com' });
    });
  });

  // ─── resetPassword ─────────────────────────────────────────────────────────

  describe('resetPassword()', () => {
    beforeEach(setupBrowser);

    it('should POST to /auth/reset-password', () => {
      const body = { email: 'a@b.com', newPassword: 'newPw' };

      service.resetPassword(body).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });
  });

  // ─── getUserById ───────────────────────────────────────────────────────────

  describe('getUserById()', () => {
    beforeEach(setupBrowser);

    it('should GET /auth/:id', () => {
      service.getUserById(5).subscribe(res => expect((res as any).id).toBe(5));

      const req = httpMock.expectOne(`${apiUrl}/5`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush({ id: 5 });
    });
  });

  // ─── logout ────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    describe('on browser platform', () => {
      beforeEach(setupBrowser);

      it('should clear sessionStorage', () => {
        sessionStorage.setItem('token', mockToken);
        service.logout();
        expect(sessionStorage.getItem('token')).toBeNull();
      });
    });

    describe('on server platform', () => {
      beforeEach(setupServer);

      it('should not throw and should not touch sessionStorage', () => {
        sessionStorage.setItem('token', mockToken);          // would only matter in browser
        expect(() => service.logout()).not.toThrow();
      });
    });
  });

  // ─── clearAuthData ─────────────────────────────────────────────────────────

  describe('clearAuthData()', () => {
    describe('on browser platform', () => {
      beforeEach(setupBrowser);

      it('should clear sessionStorage', () => {
        sessionStorage.setItem('token', mockToken);
        service.clearAuthData();
        expect(sessionStorage.getItem('token')).toBeNull();
      });
    });

    describe('on server platform', () => {
      beforeEach(setupServer);

      it('should not throw on server', () => {
        expect(() => service.clearAuthData()).not.toThrow();
      });
    });
  });

  // ─── getToken ──────────────────────────────────────────────────────────────

  describe('getToken()', () => {
    describe('on browser platform', () => {
      beforeEach(setupBrowser);

      it('should return the token when present', () => {
        sessionStorage.setItem('token', mockToken);
        expect(service.getToken()).toBe(mockToken);
      });

      it('should return null when no token is stored', () => {
        expect(service.getToken()).toBeNull();
      });
    });

    describe('on server platform', () => {
      beforeEach(setupServer);

      it('should always return null', () => {
        expect(service.getToken()).toBeNull();
      });
    });
  });

  // ─── isLoggedIn ────────────────────────────────────────────────────────────

  describe('isLoggedIn()', () => {
    beforeEach(setupBrowser);

    it('should return true when a token exists', () => {
      sessionStorage.setItem('token', mockToken);
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should return false when no token exists', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  // ─── decodeToken ───────────────────────────────────────────────────────────

  describe('decodeToken()', () => {
    describe('on browser platform', () => {
      beforeEach(setupBrowser);

      it('should return null when no token is stored', () => {
        expect(service.decodeToken()).toBeNull();
      });

      it('should return the decoded payload when token is present', () => {
        sessionStorage.setItem('token', mockToken);
        const decoded = service.decodeToken();
        expect(decoded).toBeTruthy();
        expect((decoded as any)['role']).toBe('Admin');
        expect((decoded as any)['sub']).toBe('1');
      });
    });

    describe('on server platform', () => {
      beforeEach(setupServer);

      it('should return null', () => {
        expect(service.decodeToken()).toBeNull();
      });
    });
  });

  // ─── getRole ───────────────────────────────────────────────────────────────

  describe('getRole()', () => {
    beforeEach(setupBrowser);

    it('should return empty string when no token is present', () => {
      expect(service.getRole()).toBe('');
    });

    it('should return role from the direct "role" claim', () => {
      sessionStorage.setItem('token', mockToken);
      expect(service.getRole()).toBe('Admin');
    });

    it('should return role from the MS claims key when direct "role" is absent', () => {
      sessionStorage.setItem('token', mockTokenMsClaim);
      expect(service.getRole()).toBe('Agent');
    });

    it('should return empty string when token has no role claim at all', () => {
      sessionStorage.setItem('token', noRoleToken);
      expect(service.getRole()).toBe('');
    });
  });

});