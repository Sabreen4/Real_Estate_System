import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminUsersComponent } from './users.component';
import { UserService } from 'src/app/core/services/user.service';
import { AuthService } from 'src/app/core/services/auth.service';

describe('AdminUsersComponent', () => {
  let component: AdminUsersComponent;
  let fixture: ComponentFixture<AdminUsersComponent>;

  let userServiceSpy: jasmine.SpyObj<UserService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy:      jasmine.SpyObj<Router>;
  let realCdr:        ChangeDetectorRef;

  const mockUsers = [
    { id: 1, firstName: 'John', lastName: 'Doe',   email: 'john@test.com', phone: '1234567890', roleName: 'ADMIN' },
    { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', phone: '9876543210', roleName: 'AGENT' }
  ];

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers', 'updateUser', 'deleteUser']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole', 'getToken', 'register']);
    routerSpy      = jasmine.createSpyObj('Router', ['navigate']);

    userServiceSpy.getAllUsers.and.returnValue(of(mockUsers as any));
    authServiceSpy.getRole.and.returnValue('ADMIN');
    authServiceSpy.getToken.and.returnValue('token');

    await TestBed.configureTestingModule({
      declarations: [AdminUsersComponent],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        { provide: UserService,  useValue: userServiceSpy },
        { provide: AuthService,  useValue: authServiceSpy },
        { provide: Router,       useValue: routerSpy }
        // ChangeDetectorRef is NOT overridden here —
        // Angular always injects the real one from the host view.
        // We grab and spy on it below after component creation.
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture   = TestBed.createComponent(AdminUsersComponent);
    component = fixture.componentInstance;

    // Grab the real CDR that Angular injected into the component and spy on it.
    realCdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    spyOn(realCdr, 'detectChanges');
    (component as any).cdr = realCdr;
  });

  // ── CREATE ───────────────────────────────────────────────────────────────
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ── NGONINIT ─────────────────────────────────────────────────────────────
  describe('ngOnInit', () => {

    it('should load users when role is ADMIN', fakeAsync(() => {
      fixture.detectChanges();
      tick(300);
      expect(userServiceSpy.getAllUsers).toHaveBeenCalled();
    }));

    it('should redirect when role is not ADMIN (BUYER)', () => {
      authServiceSpy.getRole.and.returnValue('BUYER');
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should redirect when role is null / undefined', () => {
      authServiceSpy.getRole.and.returnValue(null as any);
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle role string with surrounding whitespace', fakeAsync(() => {
      authServiceSpy.getRole.and.returnValue('  admin  ');
      fixture.detectChanges();
      tick(300);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should wire up debounce pipeline and execute search', fakeAsync(() => {
      fixture.detectChanges();
      tick(300);

      component.users = [...mockUsers] as any;
      component['searchSubject$'].next('john');
      tick(300);

      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0].firstName).toBe('John');
    }));

    it('should deduplicate identical search terms (distinctUntilChanged)', fakeAsync(() => {
      fixture.detectChanges();
      tick(300);

      component.users = [...mockUsers] as any;
      spyOn<any>(component, 'executeSearch').and.callThrough();

      component['searchSubject$'].next('john');
      tick(300);
      component['searchSubject$'].next('john');
      tick(300);

      expect((component as any).executeSearch).toHaveBeenCalledTimes(1);
    }));
  });

  // ── NGONDESTROY ──────────────────────────────────────────────────────────
  describe('ngOnDestroy', () => {

    it('should call next and complete on destroy$', () => {
      const destroy$ = (component as any).destroy$;
      spyOn(destroy$, 'next');
      spyOn(destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroy$.next).toHaveBeenCalled();
      expect(destroy$.complete).toHaveBeenCalled();
    });
  });

  // ── GET ALL USERS ────────────────────────────────────────────────────────
  describe('getAllUsers', () => {

    it('should set users and filteredUsers on success', () => {
      component.getAllUsers();
      expect(component.users.length).toBe(2);
      expect(component.filteredUsers.length).toBe(2);
      expect(component.isLoading).toBeFalse();
    });

    it('should default to empty arrays when response is not an array', () => {
      userServiceSpy.getAllUsers.and.returnValue(of(null as any));
      component.getAllUsers();
      expect(component.users).toEqual([]);
      expect(component.filteredUsers).toEqual([]);
    });

    it('should set isLoading to true before response', () => {
      let capturedLoading = false;
      userServiceSpy.getAllUsers.and.callFake(() => {
        capturedLoading = component.isLoading;
        return of(mockUsers as any);
      });
      component.getAllUsers();
      expect(capturedLoading).toBeTrue();
    });

    it('should reset currentPage to 1 on success', () => {
      component.currentPage = 4;
      component.getAllUsers();
      expect(component.currentPage).toBe(1);
    });

    it('should handle service error and show error message', fakeAsync(() => {
      spyOn(console, 'error');
      userServiceSpy.getAllUsers.and.returnValue(throwError(() => new Error('fail')));

      component.getAllUsers();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load users.');
      tick(3500);
    }));

    it('should use empty string token when getToken returns null', () => {
      authServiceSpy.getToken.and.returnValue(null as any);
      component.getAllUsers();
      expect(userServiceSpy.getAllUsers).toHaveBeenCalledWith('');
    });
  });

  // ── SEARCH ───────────────────────────────────────────────────────────────
  describe('Search', () => {

    beforeEach(() => {
      component.users         = [...mockUsers] as any;
      component.filteredUsers = [...mockUsers] as any;
    });

    it('should not push to subject for input of length 1', () => {
      spyOn<any>(component['searchSubject$'], 'next');
      component.onSearchInput('a');
      expect(component['searchSubject$'].next).not.toHaveBeenCalled();
    });

    it('should not push to subject for input of length 2', () => {
      spyOn<any>(component['searchSubject$'], 'next');
      component.onSearchInput('ab');
      expect(component['searchSubject$'].next).not.toHaveBeenCalled();
    });

    it('should push to subject for empty string (reset)', () => {
      spyOn<any>(component['searchSubject$'], 'next');
      component.onSearchInput('');
      expect(component['searchSubject$'].next).toHaveBeenCalledWith('');
    });

    it('should push to subject for valid input (≥3 chars)', () => {
      spyOn<any>(component['searchSubject$'], 'next');
      component.onSearchInput('john');
      expect(component['searchSubject$'].next).toHaveBeenCalledWith('john');
    });

    it('applySearch should push searchText into searchSubject$', () => {
      spyOn<any>(component['searchSubject$'], 'next');
      component.searchText = 'jane';
      component.applySearch();
      expect(component['searchSubject$'].next).toHaveBeenCalledWith('jane');
    });

    it('should filter by firstName (case-insensitive)', () => {
      (component as any).executeSearch('john');
      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0].firstName).toBe('John');
    });

    it('should filter by lastName', () => {
      (component as any).executeSearch('smith');
      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0].lastName).toBe('Smith');
    });

    it('should filter by email', () => {
      (component as any).executeSearch('jane@test.com');
      expect(component.filteredUsers[0].email).toBe('jane@test.com');
    });

    it('should filter by phone', () => {
      (component as any).executeSearch('9876543210');
      expect(component.filteredUsers[0].phone).toBe('9876543210');
    });

    it('should return all users for empty search string', () => {
      (component as any).executeSearch('');
      expect(component.filteredUsers.length).toBe(2);
    });

    it('should handle undefined user fields safely (no match)', () => {
      component.users = [{ firstName: undefined, lastName: undefined, email: undefined, phone: undefined }] as any;
      (component as any).executeSearch('test');
      expect(component.filteredUsers.length).toBe(0);
    });

    it('should reset currentPage to 1 after executeSearch', () => {
      component.currentPage = 3;
      (component as any).executeSearch('john');
      expect(component.currentPage).toBe(1);
    });

    it('should call cdr.detectChanges after executeSearch', () => {
      (realCdr.detectChanges as jasmine.Spy).calls.reset();
      (component as any).executeSearch('john');
      expect(realCdr.detectChanges).toHaveBeenCalled();
    });
  });

  // ── PAGINATION ───────────────────────────────────────────────────────────
  describe('Pagination', () => {

    beforeEach(() => {
      component.filteredUsers = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 })) as any;
      component.currentPage   = 1;
      component.itemsPerPage  = 5;
      (component as any).updatePaginatedUsers();
    });

    it('should calculate correct totalPages', () => {
      expect(component.totalPages()).toBe(3);
    });

    it('should advance to next page', () => {
      component.nextPage();
      expect(component.currentPage).toBe(2);
    });

    it('should not advance past last page', () => {
      component.currentPage = 3;
      component.nextPage();
      expect(component.currentPage).toBe(3);
    });

    it('should go to previous page', () => {
      component.currentPage = 2;
      component.previousPage();
      expect(component.currentPage).toBe(1);
    });

    it('should not go below page 1', () => {
      component.currentPage = 1;
      component.previousPage();
      expect(component.currentPage).toBe(1);
    });

    it('should slice correct users for page 2', () => {
      component.currentPage = 2;
      (component as any).updatePaginatedUsers();
      expect(component.paginatedUsers.length).toBe(5);
      expect(component.paginatedUsers[0].id).toBe(6);
    });

    it('should slice remaining users for last page', () => {
      component.currentPage = 3;
      (component as any).updatePaginatedUsers();
      expect(component.paginatedUsers.length).toBe(2);
    });

    it('nextPage should call updatePaginatedUsers', () => {
      spyOn<any>(component, 'updatePaginatedUsers');
      component.currentPage = 1;
      component.nextPage();
      expect((component as any).updatePaginatedUsers).toHaveBeenCalled();
    });

    it('previousPage should call updatePaginatedUsers', () => {
      spyOn<any>(component, 'updatePaginatedUsers');
      component.currentPage = 2;
      component.previousPage();
      expect((component as any).updatePaginatedUsers).toHaveBeenCalled();
    });
  });

  // ── EDIT USER ────────────────────────────────────────────────────────────
  describe('Edit User', () => {

    it('should set selectedUser and populate editUser on openEdit', () => {
      component.openEdit(mockUsers[0] as any);
      expect(component.selectedUser).toEqual(mockUsers[0] as any);
      expect(component.editUser.firstName).toBe('John');
      expect(component.editUser.phone).toBe('1234567890');
    });

    it('should default phone to empty string when user.phone is undefined', () => {
      const userNoPhone = { id: 3, firstName: 'A', lastName: 'B', email: 'a@b.com' };
      component.openEdit(userNoPhone as any);
      expect(component.editUser.phone).toBe('');
    });

    it('closeModal should set selectedUser to null', () => {
      component.selectedUser = mockUsers[0] as any;
      component.closeModal();
      expect(component.selectedUser).toBeNull();
    });

    it('updateUser should return early if selectedUser is null', () => {
      component.selectedUser = null;
      component.updateUser();
      expect(userServiceSpy.updateUser).not.toHaveBeenCalled();
    });

    it('should update user successfully', fakeAsync(() => {
      component.selectedUser = mockUsers[0] as any;
      userServiceSpy.updateUser.and.returnValue(of({} as any));

      component.updateUser();

      // Component always uses hardcoded message, never reads res.message
      expect(component.successMessage).toBe('User updated successfully!');
      expect(component.selectedUser).toBeNull();

      tick(300);
      expect(userServiceSpy.getAllUsers).toHaveBeenCalled();
      tick(3500);
    }));

    it('should handle update error with error.message', fakeAsync(() => {
      spyOn(console, 'error');
      component.selectedUser = mockUsers[0] as any;
      userServiceSpy.updateUser.and.returnValue(
        throwError(() => ({ error: { message: 'Update Failed' } }))
      );

      component.updateUser();

      expect(component.errorMessage).toBe('Update Failed');
      tick(3500);
    }));

    it('should use fallback error message when error has no message', fakeAsync(() => {
      spyOn(console, 'error');
      component.selectedUser = mockUsers[0] as any;
      userServiceSpy.updateUser.and.returnValue(throwError(() => ({})));

      component.updateUser();

      expect(component.errorMessage).toBe('Failed to update user.');
      tick(3500);
    }));
  });

  // ── ADD USER ─────────────────────────────────────────────────────────────
  describe('Add User', () => {

    beforeEach(() => {
      fixture.detectChanges(); // triggers ngOnInit → buildAddUserForm
    });

    it('should open add user modal and reset form', () => {
      component.openAddUserModal();
      expect(component.showAddUserModal).toBeTrue();
      expect(component.addUserForm.get('email')?.value).toBeFalsy();
    });

    it('should close add user modal and set flag to false', () => {
      component.showAddUserModal = true;
      component.closeAddUserModal();
      expect(component.showAddUserModal).toBeFalse();
    });

    it('closeAddUserModal should reset the form', () => {
      component.addUserForm.patchValue({ firstName: 'Test' });
      component.closeAddUserModal();
      expect(component.addUserForm.get('firstName')?.value).toBeNull();
    });

    it('should mark all controls touched when form is invalid', () => {
      component.submitAddUser();
      Object.values(component.addUserForm.controls).forEach(ctrl => {
        expect(ctrl.touched).toBeTrue();
      });
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should not submit when passwords do not match (passwordMismatch validator)', () => {
      component.addUserForm.setValue({
        firstName: 'John', lastName: 'Doe', email: 'john@test.com',
        phone: '1234567890', role: 'AGENT',
        password: 'abc123', confirmPassword: 'DIFFERENT'
      });
      component.submitAddUser();
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('getter f should return addUserForm.controls', () => {
      expect(component.f).toBe(component.addUserForm.controls);
    });

    function fillValidForm(comp: AdminUsersComponent): void {
      comp.addUserForm.setValue({
        firstName: 'John', lastName: 'Doe', email: 'john@test.com',
        phone: '1234567890', role: 'AGENT',
        password: '123456', confirmPassword: '123456'
      });
    }

    it('should register user successfully', fakeAsync(() => {
      fillValidForm(component);
      authServiceSpy.register.and.returnValue(of({} as any));
      spyOn(component, 'getAllUsers');

      component.submitAddUser();

      expect(component.showAddUserModal).toBeFalse();
      expect(component.getAllUsers).toHaveBeenCalled();
      expect(component.successMessage).toBe('User registered successfully!');
      expect(component.addUserLoading).toBeFalse();
      tick(3500);
    }));

    it('should handle register error with message', fakeAsync(() => {
      fillValidForm(component);
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ error: { message: 'Registration Failed' } }))
      );

      component.submitAddUser();

      expect(component.errorMessage).toBe('Registration Failed');
      expect(component.addUserLoading).toBeFalse();
      tick(3500);
    }));

    it('should handle register error with no message (fallback)', fakeAsync(() => {
      fillValidForm(component);
      authServiceSpy.register.and.returnValue(throwError(() => ({})));

      component.submitAddUser();

      expect(component.errorMessage).toBe('Registration failed!');
      tick(3500);
    }));

    it('should set addUserLoading to true before register resolves', () => {
      fillValidForm(component);
      let capturedLoading = false;
      authServiceSpy.register.and.callFake(() => {
        capturedLoading = component.addUserLoading;
        return of({} as any);
      });
      component.submitAddUser();
      expect(capturedLoading).toBeTrue();
    });
  });

  // ── DELETE USER ──────────────────────────────────────────────────────────
  describe('Delete User', () => {

    it('should set deleteConfirmUser on confirmDelete', () => {
      component.confirmDelete(mockUsers[0] as any);
      expect(component.deleteConfirmUser).toEqual(mockUsers[0] as any);
    });

    it('closeDeleteConfirm should set deleteConfirmUser to null', () => {
      component.deleteConfirmUser = mockUsers[0] as any;
      component.closeDeleteConfirm();
      expect(component.deleteConfirmUser).toBeNull();
    });

    it('should return early when deleteConfirmUser is null', () => {
      component.deleteConfirmUser = null;
      component.deleteUser();
      expect(userServiceSpy.deleteUser).not.toHaveBeenCalled();
    });

    it('should delete user successfully', fakeAsync(() => {
      component.deleteConfirmUser = mockUsers[0] as any;
      userServiceSpy.deleteUser.and.returnValue(of({} as any));
      spyOn(component, 'getAllUsers');

      component.deleteUser();

      expect(component.deleteConfirmUser).toBeNull();
      expect(component.getAllUsers).toHaveBeenCalled();
      expect(component.successMessage).toBe('User deleted successfully!');
      tick(3500);
    }));

    it('should handle delete error when error.message exists', fakeAsync(() => {
      spyOn(console, 'error');
      component.deleteConfirmUser = mockUsers[0] as any;
      userServiceSpy.deleteUser.and.returnValue(
        throwError(() => ({ error: { message: 'Forbidden' } }))
      );

      component.deleteUser();

      expect(component.errorMessage).toBe('Forbidden');
      tick(3500);
    }));

    it('should use fallback when delete error has no error.message (plain string error)', fakeAsync(() => {
      // err.error is a plain string → err.error?.message === undefined → fallback
      spyOn(console, 'error');
      component.deleteConfirmUser = mockUsers[0] as any;
      userServiceSpy.deleteUser.and.returnValue(
        throwError(() => ({ error: 'Delete Failed' }))
      );

      component.deleteUser();

      expect(component.errorMessage).toBe('Failed to delete user.');
      tick(3500);
    }));

    it('should use fallback when delete error has no error property', fakeAsync(() => {
      spyOn(console, 'error');
      component.deleteConfirmUser = mockUsers[0] as any;
      userServiceSpy.deleteUser.and.returnValue(throwError(() => ({})));

      component.deleteUser();

      expect(component.errorMessage).toBe('Failed to delete user.');
      tick(3500);
    }));
  });

  // ── ROLE DISPLAY HELPERS ─────────────────────────────────────────────────
  describe('getRoleDisplay', () => {

    it('should return Admin for roleName ADMIN',           () => expect(component.getRoleDisplay({ roleName: 'ADMIN' }   as any)).toBe('Admin'));
    it('should return Agent for roleName AGENT',           () => expect(component.getRoleDisplay({ roleName: 'AGENT' }   as any)).toBe('Agent'));
    it('should return Buyer for roleName BUYER',           () => expect(component.getRoleDisplay({ roleName: 'BUYER' }   as any)).toBe('Buyer'));
    it('should return raw roleName for unrecognised role', () => expect(component.getRoleDisplay({ roleName: 'MANAGER' } as any)).toBe('MANAGER'));

    it('should return Admin from roleId 1',                () => expect(component.getRoleDisplay({ roleId: 1 }   as any)).toBe('Admin'));
    it('should return Agent from roleId 2',                () => expect(component.getRoleDisplay({ roleId: 2 }   as any)).toBe('Agent'));
    it('should return Buyer from roleId 3',                () => expect(component.getRoleDisplay({ roleId: 3 }   as any)).toBe('Buyer'));
    it('should return Unknown for unrecognised roleId',    () => expect(component.getRoleDisplay({ roleId: 99 }  as any)).toBe('Unknown'));

    it('should return Unknown when no role info',          () => expect(component.getRoleDisplay({} as any)).toBe('Unknown'));
    it('should return Unknown when roleId is null',        () => expect(component.getRoleDisplay({ roleId: null } as any)).toBe('Unknown'));
  });

  // ── ROLE BADGE CLASS HELPERS ─────────────────────────────────────────────
  describe('getRoleBadgeClass', () => {

    it('should return badge-admin for roleName ADMIN',     () => expect(component.getRoleBadgeClass({ roleName: 'ADMIN' } as any)).toBe('badge-admin'));
    it('should return badge-agent for roleName AGENT',     () => expect(component.getRoleBadgeClass({ roleName: 'AGENT' } as any)).toBe('badge-agent'));
    it('should return badge-buyer for roleName BUYER',     () => expect(component.getRoleBadgeClass({ roleName: 'BUYER' } as any)).toBe('badge-buyer'));
    it('should return badge-default for unknown roleName', () => expect(component.getRoleBadgeClass({ roleName: 'OTHER' } as any)).toBe('badge-default'));

    it('should return badge-admin from roleId 1',          () => expect(component.getRoleBadgeClass({ roleId: 1 }   as any)).toBe('badge-admin'));
    it('should return badge-agent from roleId 2',          () => expect(component.getRoleBadgeClass({ roleId: 2 }   as any)).toBe('badge-agent'));
    it('should return badge-buyer from roleId 3',          () => expect(component.getRoleBadgeClass({ roleId: 3 }   as any)).toBe('badge-buyer'));
    it('should return badge-default for unknown roleId',   () => expect(component.getRoleBadgeClass({ roleId: 99 }  as any)).toBe('badge-default'));

    it('should return badge-default when no role info',    () => expect(component.getRoleBadgeClass({} as any)).toBe('badge-default'));
    it('should return badge-default when roleId is null',  () => expect(component.getRoleBadgeClass({ roleId: null } as any)).toBe('badge-default'));
  });

  // ── TOAST AUTO-CLEAR ─────────────────────────────────────────────────────
  describe('Toast message auto-clear', () => {

    it('should set and clear successMessage after 3500ms', fakeAsync(() => {
      (component as any).showSuccess('Done!');
      expect(component.successMessage).toBe('Done!');
      tick(3500);
      expect(component.successMessage).toBe('');
    }));

    it('should set and clear errorMessage after 3500ms', fakeAsync(() => {
      (component as any).showError('Oops!');
      expect(component.errorMessage).toBe('Oops!');
      tick(3500);
      expect(component.errorMessage).toBe('');
    }));

    it('showSuccess should call cdr.detectChanges twice (once on set, once on clear)', fakeAsync(() => {
      (realCdr.detectChanges as jasmine.Spy).calls.reset();
      (component as any).showSuccess('msg');
      tick(3500);
      expect(realCdr.detectChanges).toHaveBeenCalledTimes(2);
    }));

    it('showError should call cdr.detectChanges twice (once on set, once on clear)', fakeAsync(() => {
      (realCdr.detectChanges as jasmine.Spy).calls.reset();
      (component as any).showError('err');
      tick(3500);
      expect(realCdr.detectChanges).toHaveBeenCalledTimes(2);
    }));
  });
});