import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminDashboardComponent } from './dashboard.component';
import { UserService } from 'src/app/core/services/user.service';
import { AuthService } from 'src/app/core/services/auth.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  let userServiceSpy: jasmine.SpyObj<UserService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy:      jasmine.SpyObj<Router>;
  let cdr:            ChangeDetectorRef;

  const mockUsers: any[] = [
  { id: 1, firstName: 'John',  lastName: 'Doe',   roleName: 'ADMIN', roleId: 1 },
  { id: 2, firstName: 'Jane',  lastName: 'Smith',  roleName: 'AGENT', roleId: 2 },
  { id: 3, firstName: 'Mike',  lastName: 'Brown',  roleName: 'BUYER', roleId: 3 },
  { id: 4, firstName: 'Anna',  lastName: 'Lee',    roleId: 2 },
  { id: 5, firstName: 'Tom',   lastName: 'Cruise', roleId: 3 }
];

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole', 'getToken']);
    routerSpy      = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [AdminDashboardComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router,      useValue: routerSpy }
        // No ChangeDetectorRef override — use Angular's real one and spy on it
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture   = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;

    // Grab the real CDR injected into the component and spy on it
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    spyOn(cdr, 'detectChanges');
    (component as any).cdr = cdr;

    authServiceSpy.getRole.and.returnValue('ADMIN');
    authServiceSpy.getToken.and.returnValue('token');
    userServiceSpy.getAllUsers.and.returnValue(of(mockUsers));
  });

  // ── CREATE ───────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── NGONINIT ─────────────────────────────────────────────────────────────
  describe('ngOnInit', () => {

    it('should load users when role is ADMIN', () => {
      authServiceSpy.getRole.and.returnValue('ADMIN');
      component.ngOnInit();
      expect(userServiceSpy.getAllUsers).toHaveBeenCalled();
    });

    it('should trim and uppercase role before comparing', () => {
      authServiceSpy.getRole.and.returnValue('  admin  ');
      component.ngOnInit();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      expect(userServiceSpy.getAllUsers).toHaveBeenCalled();
    });

    it('should redirect to /login when role is not ADMIN', () => {
      authServiceSpy.getRole.and.returnValue('BUYER');
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      expect(userServiceSpy.getAllUsers).not.toHaveBeenCalled();
    });

    it('should redirect to /login when role is null', () => {
      authServiceSpy.getRole.and.returnValue(null as any);
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should redirect to /login when role is AGENT', () => {
      authServiceSpy.getRole.and.returnValue('AGENT');
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ── GET ALL USERS ────────────────────────────────────────────────────────
  describe('getAllUsers', () => {

    it('should populate users array on success', () => {
      component.getAllUsers();
      expect(component.users.length).toBe(5);
    });

    it('should call cdr.detectChanges on success', () => {
      (cdr.detectChanges as jasmine.Spy).calls.reset();
      component.getAllUsers();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should default to empty array when response is not an array', () => {
      userServiceSpy.getAllUsers.and.returnValue(of({} as any));
      component.getAllUsers();
      expect(component.users).toEqual([]);
    });

    it('should handle error and call cdr.detectChanges', () => {
      spyOn(console, 'error');
      (cdr.detectChanges as jasmine.Spy).calls.reset();
      userServiceSpy.getAllUsers.and.returnValue(throwError(() => new Error('API Error')));

      component.getAllUsers();

      expect(component.users.length).toBe(0); // unchanged
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should use empty string when getToken returns null', () => {
      authServiceSpy.getToken.and.returnValue(null as any);
      component.getAllUsers();
      expect(userServiceSpy.getAllUsers).toHaveBeenCalledWith('');
    });
  });

  // ── REFRESH DATA ─────────────────────────────────────────────────────────
  describe('refreshData', () => {

    it('should call getAllUsers and show success toast', fakeAsync(() => {
      spyOn(component, 'getAllUsers');
      component.refreshData();

      expect(component.getAllUsers).toHaveBeenCalled();
      expect(component.successMessage).toBe('Data refreshed!');

      tick(3500);
      expect(component.successMessage).toBe('');
    }));
  });

  // ── NAVIGATION ───────────────────────────────────────────────────────────
  describe('Navigation', () => {

    it('goToUsers should navigate to /admin/users', () => {
      component.goToUsers();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/users']);
    });

    it('goToAddUser should navigate with action=add queryParam', () => {
      component.goToAddUser();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/admin/users'],
        { queryParams: { action: 'add' } }
      );
    });

    it('goToAgents should navigate with role=AGENT queryParam', () => {
      component.goToAgents();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/admin/users'],
        { queryParams: { role: 'AGENT' } }
      );
    });
  });

  // ── STATS HELPERS ────────────────────────────────────────────────────────
  describe('countByRole', () => {

    beforeEach(() => { component.users = [...mockUsers]; });

    it('should count ADMIN by roleName', () => {
      expect(component.countByRole('ADMIN')).toBe(1);
    });

    it('should count AGENT by roleName and roleId combined', () => {
      // Jane (roleName AGENT) + Anna (roleId 2 → AGENT)
      expect(component.countByRole('AGENT')).toBe(2);
    });

    it('should count BUYER by roleName and roleId combined', () => {
      // Mike (roleName BUYER) + Tom (roleId 3 → BUYER)
      expect(component.countByRole('BUYER')).toBe(2);
    });

    it('should return 0 for unrecognised role', () => {
      expect(component.countByRole('MANAGER')).toBe(0);
    });

    it('should match roleId when roleName is absent', () => {
      component.users = [{ roleId: 1 } as any];
      expect(component.countByRole('ADMIN')).toBe(1);
    });

    it('should not match when roleId does not map to requested role', () => {
      component.users = [{ roleId: 99 } as any];
      expect(component.countByRole('ADMIN')).toBe(0);
    });
  });

  describe('getPercent', () => {

    it('should return correct percentage', () => {
      component.users = [...mockUsers]; // 1 ADMIN out of 5 = 20%
      expect(component.getPercent('ADMIN')).toBeCloseTo(20);
    });

    it('should return 0 when users array is empty', () => {
      component.users = [];
      expect(component.getPercent('ADMIN')).toBe(0);
    });
  });

  describe('recentUsers getter', () => {

    it('should return at most 6 users', () => {
      component.users = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })) as any[];
      expect(component.recentUsers.length).toBe(6);
    });

    it('should return users in reverse order (most recent first)', () => {
      component.users = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })) as any[];
      expect(component.recentUsers[0].id).toBe(10);
      expect(component.recentUsers[5].id).toBe(5);
    });

    it('should return all users when fewer than 6 exist', () => {
      component.users = [...mockUsers]; // 5 users
      expect(component.recentUsers.length).toBe(5);
    });
  });

  describe('agentCoverage getter', () => {

    it('should return 0 when users array is empty', () => {
      component.users = [];
      expect(component.agentCoverage).toBe(0);
    });

    it('should calculate coverage correctly', () => {
      // 2 agents, 2 buyers → (2/2)*100 = 100 → capped at 100
      component.users = [...mockUsers];
      expect(component.agentCoverage).toBe(100);
    });

    it('should use buyer count of 1 (Math.max) when buyers = 0', () => {
      component.users = [{ roleName: 'AGENT' } as any];
      // 1 agent / max(0,1) = 100%
      expect(component.agentCoverage).toBe(100);
    });

    it('should cap coverage at 100 when agents far exceed buyers', () => {
      component.users = [
        { roleName: 'AGENT' } as any, { roleName: 'AGENT' } as any, { roleName: 'AGENT' } as any,
        { roleName: 'BUYER' } as any
      ];
      expect(component.agentCoverage).toBe(100);
    });

    it('should return fractional coverage when agents < buyers', () => {
      component.users = [
        { roleName: 'AGENT' } as any,
        { roleName: 'BUYER' } as any, { roleName: 'BUYER' } as any,
        { roleName: 'BUYER' } as any, { roleName: 'BUYER' } as any
      ];
      // 1/4 * 100 = 25
      expect(component.agentCoverage).toBeCloseTo(25);
    });
  });

  describe('agentToBuyerRatio getter', () => {

    it('should return — when no agents and no buyers', () => {
      component.users = [];
      expect(component.agentToBuyerRatio).toBe('—');
    });

    it('should return n:0 when agents exist but no buyers', () => {
      component.users = [{ roleName: 'AGENT' } as any];
      expect(component.agentToBuyerRatio).toBe('1:0');
    });

    it('should reduce ratio using GCD', () => {
      component.users = [
        { roleName: 'AGENT' } as any, { roleName: 'AGENT' } as any,
        { roleName: 'BUYER' } as any
      ];
      expect(component.agentToBuyerRatio).toBe('2:1');
    });

    it('should reduce ratio correctly (e.g. 2:2 → 1:1)', () => {
      component.users = [
        { roleName: 'AGENT' } as any, { roleName: 'AGENT' } as any,
        { roleName: 'BUYER' } as any, { roleName: 'BUYER' } as any
      ];
      expect(component.agentToBuyerRatio).toBe('1:1');
    });

    it('should return correct ratio using roleId-based counts', () => {
      component.users = [
        { roleId: 2 } as any,           // AGENT
        { roleId: 3 } as any, { roleId: 3 } as any  // BUYER x2
      ];
      expect(component.agentToBuyerRatio).toBe('1:2');
    });
  });

  // ── DISPLAY HELPERS ──────────────────────────────────────────────────────
  describe('getInitials', () => {

    it('should return both initials uppercased', () => {
      expect(component.getInitials({ firstName: 'John', lastName: 'Doe' } as any)).toBe('JD');
    });

    it('should return only first initial when lastName is empty', () => {
      expect(component.getInitials({ firstName: 'John', lastName: '' } as any)).toBe('J');
    });

    it('should return only last initial when firstName is empty', () => {
      expect(component.getInitials({ firstName: '', lastName: 'Doe' } as any)).toBe('D');
    });

    it('should return ? when both names are empty', () => {
      expect(component.getInitials({} as any)).toBe('?');
    });

    it('should return ? when firstName and lastName are undefined', () => {
      expect(component.getInitials({ firstName: undefined, lastName: undefined } as any)).toBe('?');
    });
  });

  describe('getRoleDisplay', () => {

    // roleName branch
    it('should return Admin for roleName ADMIN',             () => expect(component.getRoleDisplay({ roleName: 'ADMIN' }   as any)).toBe('Admin'));
    it('should return Agent for roleName AGENT',             () => expect(component.getRoleDisplay({ roleName: 'AGENT' }   as any)).toBe('Agent'));
    it('should return Buyer for roleName BUYER',             () => expect(component.getRoleDisplay({ roleName: 'BUYER' }   as any)).toBe('Buyer'));
    it('should return raw roleName for unrecognised role',   () => expect(component.getRoleDisplay({ roleName: 'MANAGER' } as any)).toBe('MANAGER'));

    // roleId branch (no roleName)
    it('should return Admin from roleId 1',                  () => expect(component.getRoleDisplay({ roleId: 1 }   as any)).toBe('Admin'));
    it('should return Agent from roleId 2',                  () => expect(component.getRoleDisplay({ roleId: 2 }   as any)).toBe('Agent'));
    it('should return Buyer from roleId 3',                  () => expect(component.getRoleDisplay({ roleId: 3 }   as any)).toBe('Buyer'));
    it('should return Unknown for unrecognised roleId',      () => expect(component.getRoleDisplay({ roleId: 999 } as any)).toBe('Unknown'));

    // neither branch
    it('should return Unknown when no role info',            () => expect(component.getRoleDisplay({} as any)).toBe('Unknown'));
    it('should return Unknown when roleId is null',          () => expect(component.getRoleDisplay({ roleId: null } as any)).toBe('Unknown'));
  });

  describe('getRolePillClass', () => {

    // roleName branch
    it('should return pill-admin for roleName ADMIN',        () => expect(component.getRolePillClass({ roleName: 'ADMIN' } as any)).toBe('pill-admin'));
    it('should return pill-agent for roleName AGENT',        () => expect(component.getRolePillClass({ roleName: 'AGENT' } as any)).toBe('pill-agent'));
    it('should return pill-buyer for roleName BUYER',        () => expect(component.getRolePillClass({ roleName: 'BUYER' } as any)).toBe('pill-buyer'));
    it('should return pill-default for unknown roleName',    () => expect(component.getRolePillClass({ roleName: 'OTHER' } as any)).toBe('pill-default'));

    // roleId branch (no roleName)
    it('should return pill-admin from roleId 1',             () => expect(component.getRolePillClass({ roleId: 1 }   as any)).toBe('pill-admin'));
    it('should return pill-agent from roleId 2',             () => expect(component.getRolePillClass({ roleId: 2 }   as any)).toBe('pill-agent'));
    it('should return pill-buyer from roleId 3',             () => expect(component.getRolePillClass({ roleId: 3 }   as any)).toBe('pill-buyer'));
    it('should return pill-default for unknown roleId',      () => expect(component.getRolePillClass({ roleId: 999 } as any)).toBe('pill-default'));

    // neither branch
    it('should return pill-default when no role info',       () => expect(component.getRolePillClass({} as any)).toBe('pill-default'));
    it('should return pill-default when roleId is null',     () => expect(component.getRolePillClass({ roleId: null } as any)).toBe('pill-default'));
  });

  // ── TOAST ────────────────────────────────────────────────────────────────
  describe('Toast auto-clear', () => {

    it('showSuccess should set message and clear after 3500ms', fakeAsync(() => {
      (cdr.detectChanges as jasmine.Spy).calls.reset();
      (component as any).showSuccess('Done!');

      expect(component.successMessage).toBe('Done!');
      expect(cdr.detectChanges).toHaveBeenCalledTimes(1);

      tick(3500);

      expect(component.successMessage).toBe('');
      expect(cdr.detectChanges).toHaveBeenCalledTimes(2);
    }));

    it('showError should set message and clear after 3500ms', fakeAsync(() => {
      (cdr.detectChanges as jasmine.Spy).calls.reset();
      (component as any).showError('Oops!');

      expect(component.errorMessage).toBe('Oops!');
      expect(cdr.detectChanges).toHaveBeenCalledTimes(1);

      tick(3500);

      expect(component.errorMessage).toBe('');
      expect(cdr.detectChanges).toHaveBeenCalledTimes(2);
    }));
  });
});