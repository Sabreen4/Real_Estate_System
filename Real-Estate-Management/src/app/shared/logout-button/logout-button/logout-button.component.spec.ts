import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LogoutButtonComponent } from './logout-button.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LogoutButtonComponent', () => {
  let component: LogoutButtonComponent;
  let fixture: ComponentFixture<LogoutButtonComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['clearAuthData']);
    mockRouter      = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LogoutButtonComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router,      useValue: mockRouter      },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(LogoutButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── logout() ────────────────────────────────────────────────────────────────

  it('should call clearAuthData on logout', () => {
    component.logout();
    expect(mockAuthService.clearAuthData).toHaveBeenCalled();
  });

  it('should navigate to /login after logout', () => {
    component.logout();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should clear auth data before navigating', () => {
    const callOrder: string[] = [];
    mockAuthService.clearAuthData.and.callFake(() => callOrder.push('clear'));
    mockRouter.navigate.and.callFake(() => { callOrder.push('navigate'); return Promise.resolve(true); });

    component.logout();
    expect(callOrder[0]).toBe('clear');
    expect(callOrder[1]).toBe('navigate');
  });
});
