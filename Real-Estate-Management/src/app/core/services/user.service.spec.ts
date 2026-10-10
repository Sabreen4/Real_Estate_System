import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { UserService } from 'src/app/core/services/user.service';
import { User } from 'src/app/core/models/user.model';
import { editUser } from 'src/app/core/models/editUser.model';
import { environment } from 'src/environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/users`;
  const token  = 'test-jwt-token';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:   [HttpClientTestingModule],
      providers: [UserService]
    });
    service  = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── getHeaders ────────────────────────────────────────────────────────────

  describe('getHeaders()', () => {
    it('should return an options object with an Authorization Bearer header', () => {
      const options = service.getHeaders(token);

      // Verify the returned object has a headers property that is an HttpHeaders instance
      expect(options.headers instanceof HttpHeaders).toBeTrue();
      expect(options.headers.get('Authorization')).toBe(`Bearer ${token}`);
    });

    it('should use the exact token string passed in', () => {
      const customToken = 'my.custom.jwt';
      const options = service.getHeaders(customToken);
      expect(options.headers.get('Authorization')).toBe(`Bearer ${customToken}`);
    });
  });

  // ─── getAllUsers ────────────────────────────────────────────────────────────

  describe('getAllUsers()', () => {
    it('should GET /users with Authorization header and return user list', () => {
      const mockUsers: Partial<User>[] = [
        { id: 1, email: 'a@b.com' },
        { id: 2, email: 'c@d.com' }
      ];

      service.getAllUsers(token).subscribe(users => {
        expect(users).toEqual(mockUsers as User[]);
        expect(users.length).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      expect(req.request.body).toBeNull();
      req.flush(mockUsers);
    });

    it('should return an empty array when no users exist', () => {
      service.getAllUsers(token).subscribe(users => expect(users).toEqual([]));

      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });
  });

  // ─── getUserById ───────────────────────────────────────────────────────────

  describe('getUserById()', () => {
    it('should GET /users/:id and return the matching user', () => {
      const mockUser: Partial<User> = { id: 3, email: 'user@test.com' };

      service.getUserById(3).subscribe(user => expect(user).toEqual(mockUser as User));

      const req = httpMock.expectOne(`${apiUrl}/3`);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush(mockUser);
    });

    it('should correctly interpolate id=0 into the URL', () => {
      service.getUserById(0).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/0`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  // ─── updateUser ────────────────────────────────────────────────────────────

  describe('updateUser()', () => {
    it('should PUT /users/:id with auth header and data body', () => {
      const updateData: Partial<editUser> = { firstName: 'John', lastName: 'Doe' };

      service.updateUser(4, updateData as editUser, token).subscribe(res =>
        expect((res as any).id).toBe(4)
      );

      const req = httpMock.expectOne(`${apiUrl}/4`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      expect(req.request.body).toEqual(updateData);
      req.flush({ id: 4, ...updateData });
    });
  });

  // ─── updateProfile ─────────────────────────────────────────────────────────

  describe('updateProfile()', () => {
    it('should PUT /users/:id with payload and no explicit auth header', () => {
      const profile: Partial<editUser> = {
        firstName: 'Jane',
        lastName:  'Smith',
        email:     'j@s.com',
        phone:     '555'
      };

      // Observable<void> — the subscriber receives null/undefined on success
      service.updateProfile(7, profile as editUser).subscribe(res =>
        expect(res).toBeNull()
      );

      const req = httpMock.expectOne(`${apiUrl}/7`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(profile);
      // No Authorization header — updateProfile sends no token
      expect(req.request.headers.get('Authorization')).toBeNull();
      req.flush(null);
    });
  });

  // ─── deleteUser ────────────────────────────────────────────────────────────

  describe('deleteUser()', () => {
    it('should DELETE /users/:id with Authorization header', () => {
      // Observable<void> — flush null, not { success: true }
      service.deleteUser(9, token).subscribe(res => expect(res).toBeNull());

      const req = httpMock.expectOne(`${apiUrl}/9`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush(null);
    });
  });

});