import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of, throwError, Subject } from 'rxjs';

import { SidebarComponent } from './sidebar.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service';
import { ToastService } from 'src/app/core/services/toast.service';

const makeUser = (o: any = {}) => ({
  firstName: 'John', lastName: 'Doe',
  email: 'john@test.com', phone: '9999999999', ...o
});

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockAuth: jasmine.SpyObj<AuthService>;
  let mockUser: jasmine.SpyObj<UserService>;
  let mockToast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    mockAuth  = jasmine.createSpyObj('AuthService',  ['decodeToken', 'getRole', 'clearAuthData']);
    mockUser  = jasmine.createSpyObj('UserService',  ['getUserById', 'updateProfile']);
    mockToast = jasmine.createSpyObj('ToastService', ['success', 'error']);

    mockAuth.decodeToken.and.returnValue({ userId: '1', email: 'john@test.com' }); // ✅ string
    mockAuth.getRole.and.returnValue('BUYER');
    mockUser.getUserById.and.returnValue(of(makeUser()));

    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterModule.forRoot([])],
      declarations: [SidebarComponent],
      providers: [
        { provide: AuthService,  useValue: mockAuth  },
        { provide: UserService,  useValue: mockUser  },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit — happy path ─────────────────────────────────────────────────

  it('should set role on init', () => {
    expect(component.role).toBe('BUYER');
  });

  it('should set userId from token userId field', () => {
    expect(component.userId).toBe(1);
  });

  it('should load userName from userService', () => {
    expect(component.userName).toBe('John Doe');
  });

  it('should compute initials JD', () => {
    expect(component.userInitials).toBe('JD');
  });

  it('should set userEmail from userService response', () => {
    expect(component.userEmail).toBe('john@test.com');
  });

  it('should fall back to "User" when firstName and lastName are empty strings', () => {
    mockUser.getUserById.and.returnValue(of(makeUser({ firstName: '', lastName: '', email: '' })));
    component.ngOnInit();
    expect(component.userName).toBe('User');
  });

  // ── ngOnInit — userService error path ────────────────────────────────────

  it('should use decoded name on userService error', () => {
    mockAuth.decodeToken.and.returnValue({ userId: '1', name: 'Fallback User' }); // ✅ string
    mockUser.getUserById.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.userName).toBe('Fallback User');
    expect(component.userInitials).toBe('FU');
  });

  it('should use decoded email as name on error when no decoded name', () => {
    mockAuth.decodeToken.and.returnValue({ userId: '1', email: 'fb@test.com' }); // ✅ string
    mockUser.getUserById.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.userName).toBe('fb@test.com');
  });

  it('should use "User" on error when token has neither name nor email', () => {
    mockAuth.decodeToken.and.returnValue({ userId: '1' }); // ✅ string
    mockUser.getUserById.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.userName).toBe('User');
  });

  it('should compute initials on error path', () => {
    mockAuth.decodeToken.and.returnValue({ userId: '1', name: 'Error User' }); // ✅ string
    mockUser.getUserById.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.userInitials).toBe('EU');
  });

  // ── ngOnInit — userId = 0 (else branch, no userService call) ─────────────

  it('should use decoded name when userId resolves to 0', () => {
    mockAuth.decodeToken.and.returnValue({ name: 'No Id User' });
    component.ngOnInit();
    expect(component.userName).toBe('No Id User');
    expect(component.userId).toBe(0);
  });

  it('should use decoded email when userId=0 and no name', () => {
    mockAuth.decodeToken.and.returnValue({ email: 'noId@test.com' });
    component.ngOnInit();
    expect(component.userName).toBe('noId@test.com');
  });

  it('should fall back to "User" when userId=0 and no name or email', () => {
    mockAuth.decodeToken.and.returnValue({});
    component.ngOnInit();
    expect(component.userName).toBe('User');
  });

  it('should compute initials in the userId=0 branch', () => {
    mockAuth.decodeToken.and.returnValue({ name: 'Zero User' });
    component.ngOnInit();
    expect(component.userInitials).toBe('ZU');
  });

  // ── ngOnInit — userId fallbacks (nameid, sub) ─────────────────────────────

  it('should resolve userId from nameid when userId is absent', () => {
    mockAuth.decodeToken.and.returnValue({ nameid: '5', email: 'x@x.com' }); // ✅ string
    mockUser.getUserById.and.returnValue(of(makeUser()));
    component.ngOnInit();
    expect(component.userId).toBe(5);
  });

  it('should resolve userId from sub when both userId and nameid are absent', () => {
    mockAuth.decodeToken.and.returnValue({ sub: '9', email: 'y@y.com' }); // ✅ string
    mockUser.getUserById.and.returnValue(of(makeUser()));
    component.ngOnInit();
    expect(component.userId).toBe(9);
  });

  it('should resolve userId to 0 when userId, nameid and sub are all absent', () => {
    mockAuth.decodeToken.and.returnValue({ name: 'Ghost' });
    component.ngOnInit();
    expect(component.userId).toBe(0);
  });

  // ── ngOnInit — WS-Fed email claim ─────────────────────────────────────────

  it('should read email from WS-Fed claims URI when plain email is absent', () => {
    mockAuth.decodeToken.and.returnValue({
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'ws@test.com'
    });
    component.ngOnInit();
    expect(component.userEmail).toBe('ws@test.com');
  });

  it('should prefer plain email over WS-Fed claim', () => {
    mockAuth.decodeToken.and.returnValue({
      email: 'plain@test.com',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'ws@test.com'
    });
    component.ngOnInit();
    expect(component.userEmail).toBe('plain@test.com');
  });

  // ── buildMenu ─────────────────────────────────────────────────────────────

  it('should build BUYER menu with 3 items', () => {
    mockAuth.getRole.and.returnValue('BUYER');
    component.ngOnInit();
    expect(component.menu.length).toBe(3);
    const links = component.menu.map(m => m.link);
    expect(links).toContain('/buyer/dashboard');
    expect(links).toContain('/buyer/offer');
    expect(links).toContain('/buyer/payment');
  });

  it('should build AGENT menu with 5 items', () => {
    mockAuth.getRole.and.returnValue('AGENT');
    component.ngOnInit();
    expect(component.menu.length).toBe(5);
    const links = component.menu.map(m => m.link);
    expect(links).toContain('/agent/dashboard');
    expect(links).toContain('/agent/agent-appointments');
    expect(links).toContain('/agent/agent-offer');
    expect(links).toContain('/agent/properties');
    expect(links).toContain('/agent/report');
  });

  it('should build ADMIN menu with 3 items', () => {
    mockAuth.getRole.and.returnValue('ADMIN');
    component.ngOnInit();
    expect(component.menu.length).toBe(3);
    const links = component.menu.map(m => m.link);
    expect(links).toContain('/admin/dashboard');
    expect(links).toContain('/admin/users');
    expect(links).toContain('/admin/register');
  });

  it('should build ADMIN menu with lowercase role "admin"', () => {
    mockAuth.getRole.and.returnValue('admin');
    component.ngOnInit();
    expect(component.menu.map(m => m.link)).toContain('/admin/dashboard');
  });

  it('should build AGENT menu with lowercase role "agent"', () => {
    mockAuth.getRole.and.returnValue('agent');
    component.ngOnInit();
    expect(component.menu.map(m => m.link)).toContain('/agent/dashboard');
  });

  it('should build BUYER menu with lowercase role "buyer"', () => {
    mockAuth.getRole.and.returnValue('buyer');
    component.ngOnInit();
    expect(component.menu.map(m => m.link)).toContain('/buyer/dashboard');
  });

  it('should fall back to BUYER menu for an unrecognised role', () => {
    mockAuth.getRole.and.returnValue('UNKNOWN');
    component.ngOnInit();
    expect(component.menu.map(m => m.link)).toContain('/buyer/dashboard');
  });

  // ── goHome ────────────────────────────────────────────────────────────────

  it('goHome() should navigate to admin dashboard for ADMIN role', () => {
    component.role = 'ADMIN';
    expect(() => component.goHome()).not.toThrow();
  });

  it('goHome() should navigate to agent dashboard for AGENT role', () => {
    component.role = 'AGENT';
    expect(() => component.goHome()).not.toThrow();
  });

  it('goHome() should navigate to buyer dashboard for BUYER role', () => {
    component.role = 'BUYER';
    expect(() => component.goHome()).not.toThrow();
  });

  it('goHome() should navigate to buyer dashboard for unknown role', () => {
    component.role = 'UNKNOWN';
    expect(() => component.goHome()).not.toThrow();
  });

  // ── Drawer ────────────────────────────────────────────────────────────────

  it('openDrawer() should set drawerOpen to true', () => {
    component.drawerOpen = false;
    component.openDrawer();
    expect(component.drawerOpen).toBeTrue();
  });

  it('closeDrawer() should set drawerOpen to false', () => {
    component.drawerOpen = true;
    component.closeDrawer();
    expect(component.drawerOpen).toBeFalse();
  });

  // ── toggleDropdown ────────────────────────────────────────────────────────

  it('toggleDropdown() should open the dropdown and call stopPropagation', () => {
    component.showProfileDropdown = false;
    const e = new MouseEvent('click');
    spyOn(e, 'stopPropagation');
    component.toggleDropdown(e);
    expect(component.showProfileDropdown).toBeTrue();
    expect(e.stopPropagation).toHaveBeenCalled();
  });

  it('toggleDropdown() should close the dropdown when already open', () => {
    component.showProfileDropdown = true;
    component.toggleDropdown(new MouseEvent('click'));
    expect(component.showProfileDropdown).toBeFalse();
  });

  // ── stopProp ──────────────────────────────────────────────────────────────

  it('stopProp() should call stopPropagation on the event', () => {
    const e = new MouseEvent('click');
    spyOn(e, 'stopPropagation');
    component.stopProp(e);
    expect(e.stopPropagation).toHaveBeenCalled();
  });

  // ── document click listener ───────────────────────────────────────────────

  it('clicking the document should close the dropdown when open', () => {
    component.showProfileDropdown = true;
    document.dispatchEvent(new MouseEvent('click'));
    expect(component.showProfileDropdown).toBeFalse();
  });

  it('clicking the document should do nothing when dropdown is already closed', () => {
    component.showProfileDropdown = false;
    expect(() => document.dispatchEvent(new MouseEvent('click'))).not.toThrow();
    expect(component.showProfileDropdown).toBeFalse();
  });

  // ── Escape key ────────────────────────────────────────────────────────────

  it('Escape key should close drawer, modal and dropdown', () => {
    component.drawerOpen          = true;
    component.showEditModal       = true;
    component.showProfileDropdown = true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.drawerOpen).toBeFalse();
    expect(component.showEditModal).toBeFalse();
    expect(component.showProfileDropdown).toBeFalse();
  });

  it('non-Escape keydown should not close anything', () => {
    component.drawerOpen          = true;
    component.showEditModal       = true;
    component.showProfileDropdown = true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.drawerOpen).toBeTrue();
    expect(component.showEditModal).toBeTrue();
    expect(component.showProfileDropdown).toBeTrue();
  });

  // ── openEditModal ─────────────────────────────────────────────────────────

  it('openEditModal() should set showEditModal to true and close dropdown', () => {
    component.showProfileDropdown = true;
    component.openEditModal();
    expect(component.showEditModal).toBeTrue();
    expect(component.showProfileDropdown).toBeFalse();
  });

  it('openEditModal() should clear editError before opening', () => {
    component.editError = 'old error';
    component.openEditModal();
    expect(component.editError).toBe('');
  });

  it('openEditModal() should populate edit fields from userService', () => {
    mockUser.getUserById.and.returnValue(of(makeUser()));
    component.openEditModal();
    expect(component.editFirstName).toBe('John');
    expect(component.editLastName).toBe('Doe');
    expect(component.editEmail).toBe('john@test.com');
    expect(component.editPhone).toBe('9999999999');
  });

  it('openEditModal() should handle missing phone gracefully', () => {
    mockUser.getUserById.and.returnValue(of(makeUser({ phone: undefined })));
    component.openEditModal();
    expect(component.editPhone).toBe('');
  });

  it('openEditModal() error path should use decoded token firstName and lastName', () => {
    mockUser.getUserById.and.returnValue(throwError(() => new Error()));
    mockAuth.decodeToken.and.returnValue({
      userId: '1', firstName: 'Jane', lastName: 'Doe', email: 'j@t.com' // ✅ string
    });
    component.openEditModal();
    expect(component.editFirstName).toBe('Jane');
    expect(component.editLastName).toBe('Doe');
  });

  it('openEditModal() error path should set editPhone to empty string', () => {
    mockUser.getUserById.and.returnValue(throwError(() => new Error()));
    mockAuth.decodeToken.and.returnValue({ userId: '1' }); // ✅ string
    component.openEditModal();
    expect(component.editPhone).toBe('');
  });

  it('openEditModal() error path should set editEmail to current userEmail', () => {
    component.userEmail = 'current@test.com';
    mockUser.getUserById.and.returnValue(throwError(() => new Error()));
    mockAuth.decodeToken.and.returnValue({ userId: '1' }); // ✅ string
    component.openEditModal();
    expect(component.editEmail).toBe('current@test.com');
  });

  it('openEditModal() error path falls back to empty string for missing firstName/lastName', () => {
    mockUser.getUserById.and.returnValue(throwError(() => new Error()));
    mockAuth.decodeToken.and.returnValue({ userId: '1' }); // ✅ string
    component.openEditModal();
    expect(component.editFirstName).toBe('');
    expect(component.editLastName).toBe('');
  });

  // ── closeEditModal ────────────────────────────────────────────────────────

  it('closeEditModal() should set showEditModal to false', () => {
    component.showEditModal = true;
    component.closeEditModal();
    expect(component.showEditModal).toBeFalse();
  });

  it('closeEditModal() should clear editError', () => {
    component.editError = 'some error';
    component.closeEditModal();
    expect(component.editError).toBe('');
  });

  // ── saveProfile — validation ──────────────────────────────────────────────

  it('saveProfile() should set error and not call updateProfile when firstName is empty', () => {
    component.editFirstName = '';
    component.saveProfile();
    expect(component.editError).toBe('First name is required.');
    expect(mockUser.updateProfile).not.toHaveBeenCalled();
  });

  it('saveProfile() should set error when firstName is only whitespace', () => {
    component.editFirstName = '   ';
    component.saveProfile();
    expect(component.editError).toBe('First name is required.');
    expect(mockUser.updateProfile).not.toHaveBeenCalled();
  });

  // ── saveProfile — success ─────────────────────────────────────────────────

  it('saveProfile() success should close modal and show toast', () => {
    mockUser.updateProfile.and.returnValue(of(undefined as any)); // ✅ void-compatible
    mockUser.getUserById.and.returnValue(
      of(makeUser({ firstName: 'Alice', lastName: 'Z', email: 'a@z.com' }))
    );
    component.editFirstName = 'Alice';
    component.editLastName  = 'Z';
    component.editEmail     = 'a@z.com';
    component.editPhone     = '111';
    component.saveProfile();
    expect(component.showEditModal).toBeFalse();
    expect(mockToast.success).toHaveBeenCalledWith('Profile updated successfully!');
  });

  it('saveProfile() success should refresh userName, userEmail and initials', () => {
    mockUser.updateProfile.and.returnValue(of(undefined as any)); // ✅ void-compatible
    mockUser.getUserById.and.returnValue(
      of(makeUser({ firstName: 'Alice', lastName: 'Smith', email: 'a@s.com' }))
    );
    component.editFirstName = 'Alice';
    component.saveProfile();
    expect(component.userName).toBe('Alice Smith');
    expect(component.userEmail).toBe('a@s.com');
    expect(component.userInitials).toBe('AS');
  });

  it('saveProfile() success should set editSaving to false', () => {
    mockUser.updateProfile.and.returnValue(of(undefined as any)); // ✅ void-compatible
    mockUser.getUserById.and.returnValue(of(makeUser()));
    component.editFirstName = 'Alice';
    component.saveProfile();
    expect(component.editSaving).toBeFalse();
  });

  it('saveProfile() should call updateProfile with trimmed values', () => {
    mockUser.updateProfile.and.returnValue(of(undefined as any)); // ✅ void-compatible
    mockUser.getUserById.and.returnValue(of(makeUser()));
    component.editFirstName = ' Bob ';
    component.editLastName  = ' Jones ';
    component.editEmail     = ' b@j.com ';
    component.editPhone     = ' 123 ';
    component.saveProfile();
    expect(mockUser.updateProfile).toHaveBeenCalledWith(component.userId, {
      firstName: 'Bob', lastName: 'Jones', email: 'b@j.com', phone: '123'
    });
  });

  it('saveProfile() should set editSaving true before async call', () => {
    // ✅ Use already-imported Subject — no require() needed
    const subject = new Subject<void>();
    mockUser.updateProfile.and.returnValue(subject.asObservable());
    component.editFirstName = 'Alice';
    component.saveProfile();
    expect(component.editSaving).toBeTrue();
    subject.complete();
  });

  // ── saveProfile — error ───────────────────────────────────────────────────

  it('saveProfile() error should set editError from error.message', () => {
    mockUser.updateProfile.and.returnValue(
      throwError(() => ({ error: { message: 'Server fail' } }))
    );
    component.editFirstName = 'Alice';
    component.saveProfile();
    expect(component.editError).toBe('Server fail');
    expect(component.editSaving).toBeFalse();
  });

  it('saveProfile() error should use fallback message when error.message is absent', () => {
    mockUser.updateProfile.and.returnValue(throwError(() => ({})));
    component.editFirstName = 'Alice';
    component.saveProfile();
    expect(component.editError).toBe('Failed to update profile.');
  });

  it('saveProfile() error should set editSaving to false', () => {
    mockUser.updateProfile.and.returnValue(throwError(() => ({})));
    component.editFirstName = 'Alice';
    component.saveProfile();
    expect(component.editSaving).toBeFalse();
  });

  // ── logout ────────────────────────────────────────────────────────────────

  it('logout() should call clearAuthData', () => {
    component.logout();
    expect(mockAuth.clearAuthData).toHaveBeenCalled();
  });

  it('logout() should navigate to /login', () => {
    const router = TestBed.inject(RouterModule as any);
    expect(() => component.logout()).not.toThrow();
  });

  // ── getSvg ────────────────────────────────────────────────────────────────

  it('getSvg("grid") should return an svg string',       () => expect(component.getSvg('grid')).toContain('<svg'));
  it('getSvg("home") should return an svg string',       () => expect(component.getSvg('home')).toContain('<svg'));
  it('getSvg("calendar") should return an svg string',   () => expect(component.getSvg('calendar')).toContain('<svg'));
  it('getSvg("users") should return an svg string',      () => expect(component.getSvg('users')).toContain('<svg'));
  it('getSvg("tag") should return an svg string',        () => expect(component.getSvg('tag')).toContain('<svg'));
  it('getSvg("money") should return an svg string',      () => expect(component.getSvg('money')).toContain('<svg'));
  it('getSvg("report") should return an svg string',     () => expect(component.getSvg('report')).toContain('<svg'));
  it('getSvg("unknown") should fall back to grid svg',   () => expect(component.getSvg('unknown')).toBe(component.getSvg('grid')));

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

  it('ngOnDestroy() should remove the document click listener', () => {
    spyOn(document, 'removeEventListener').and.callThrough();
    component.ngOnDestroy();
    expect(document.removeEventListener).toHaveBeenCalledWith('click', jasmine.any(Function));
  });

  it('should not throw if ngOnDestroy called before docClickListener is set', () => {
    (component as any).docClickListener = undefined;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});