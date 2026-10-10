import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NavbarComponent } from './navbar.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['clearAuthData', 'getRole']);
    mockRouter      = jasmine.createSpyObj('Router', ['navigate']);
    mockToast       = jasmine.createSpyObj('ToastService', ['success']);

    mockAuthService.getRole.and.returnValue('BUYER');

    await TestBed.configureTestingModule({
      declarations: [NavbarComponent],
      providers: [
        { provide: AuthService,  useValue: mockAuthService },
        { provide: Router,       useValue: mockRouter      },
        { provide: ToastService, useValue: mockToast       },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Default state ───────────────────────────────────────────────────────────

  it('should have isDropdownOpen false by default', () => {
    expect(component.isDropdownOpen).toBeFalse();
  });

  // ── toggleDropdown() ────────────────────────────────────────────────────────

  it('should open the dropdown when toggleDropdown is called', () => {
    component.isDropdownOpen = false;
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBeTrue();
  });

  it('should close the dropdown when toggleDropdown is called again', () => {
    component.isDropdownOpen = true;
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBeFalse();
  });

  // ── goHome() ────────────────────────────────────────────────────────────────

  it('should navigate to /buyer/dashboard for BUYER role', () => {
    mockAuthService.getRole.and.returnValue('BUYER');
    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/buyer/dashboard']);
  });

  it('should navigate to /agent/dashboard for AGENT role', () => {
    mockAuthService.getRole.and.returnValue('AGENT');
    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/agent/dashboard']);
  });

  it('should navigate to /admin/dashboard for ADMIN role', () => {
    mockAuthService.getRole.and.returnValue('ADMIN');
    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('should navigate to / for an unknown role', () => {
    mockAuthService.getRole.and.returnValue('UNKNOWN');
    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  // ── logout() ────────────────────────────────────────────────────────────────

  it('should call clearAuthData on logout', () => {
    component.logout();
    expect(mockAuthService.clearAuthData).toHaveBeenCalled();
  });

  it('should show success toast on logout', () => {
    component.logout();
    expect(mockToast.success).toHaveBeenCalledWith('Logged out successfully');
  });

  it('should navigate to /login after logout', () => {
    component.logout();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
