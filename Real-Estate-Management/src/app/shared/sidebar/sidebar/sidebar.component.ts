import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/user.service';
import { ToastService } from 'src/app/core/services/toast.service';

interface MenuItem {
  name: string;
  link: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: false
})
export class SidebarComponent implements OnInit, OnDestroy {

  public role: string = '';
  public menu: MenuItem[] = [];
  public userName: string = '';
  public userEmail: string = '';
  public userInitials: string = '';
  public userId: number = 0;
  public drawerOpen: boolean = false;
  public showProfileDropdown: boolean = false;
  public showEditModal: boolean = false;
  public editFirstName: string = '';
  public editLastName: string = '';
  public editEmail: string = '';
  public editPhone: string = '';
  public editSaving: boolean = false;
  public editError: string = '';

  private docClickListener!: () => void;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const decoded = this.auth.decodeToken();
    this.role = this.auth.getRole();
    this.userEmail =
      decoded?.email ||
      decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
      '';
    this.userId = +(decoded?.userId ?? decoded?.nameid ?? decoded?.sub ?? 0);

    if (this.userId) {
      this.userService.getUserById(this.userId).subscribe({
        next: (user) => {
          this.userName = `${user.firstName} ${user.lastName}`.trim() || 'User';
          this.userEmail = user.email || this.userEmail;
          this.userInitials = this.getInitials(this.userName);
          this.cdr.detectChanges();
        },
        error: () => {
          this.userName = decoded?.name || decoded?.email || 'User';
          this.userInitials = this.getInitials(this.userName);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.userName = decoded?.name || decoded?.email || 'User';
      this.userInitials = this.getInitials(this.userName);
    }

    this.buildMenu();

    // Attach document click listener to close dropdown when clicking outside
    this.docClickListener = () => {
      if (this.showProfileDropdown) {
        this.showProfileDropdown = false;
        this.cdr.detectChanges();
      }
    };
    document.addEventListener('click', this.docClickListener);

    // Escape key closes everything
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDrawer();
        this.closeEditModal();
        this.showProfileDropdown = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.docClickListener) {
      document.removeEventListener('click', this.docClickListener);
    }
  }

  private getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  private buildMenu(): void {
    const r = this.role?.toUpperCase();
    if (r === 'ADMIN') {
      this.menu = [
        { name: 'Dashboard', link: '/admin/dashboard', icon: 'grid' },
        { name: 'Users',     link: '/admin/users',     icon: 'users' },
        { name: 'Register',  link: '/admin/register',  icon: 'users' },
      ];
    } else if (r === 'AGENT') {
      this.menu = [
        { name: 'Dashboard',    link: '/agent/dashboard',         icon: 'grid' },
        { name: 'Appointments', link: '/agent/agent-appointments', icon: 'calendar' },
        { name: 'Offers',       link: '/agent/agent-offer',        icon: 'money' },
        { name: 'Properties',   link: '/agent/properties',         icon: 'home' },
        { name: 'Report',       link: '/agent/report',             icon: 'report' },
      ];
    } else {
      this.menu = [
        { name: 'Dashboard',  link: '/buyer/dashboard', icon: 'grid' },
        { name: 'My Offers',  link: '/buyer/offer',     icon: 'tag' },
        { name: 'My Payment', link: '/buyer/payment',   icon: 'tag' },
      ];
    }
  }

  public goHome(): void {
    const r = this.role?.toUpperCase();
    if (r === 'ADMIN') this.router.navigate(['/admin/dashboard']);
    else if (r === 'AGENT') this.router.navigate(['/agent/dashboard']);
    else this.router.navigate(['/buyer/dashboard']);
  }

  // ── DRAWER ──
  public openDrawer(): void  { this.drawerOpen = true; }
  public closeDrawer(): void { this.drawerOpen = false; }

  // ── PROFILE DROPDOWN ──
  public toggleDropdown(event: MouseEvent): void {
    event.stopPropagation(); // stops docClickListener from firing for THIS click
    this.showProfileDropdown = !this.showProfileDropdown;
    this.cdr.detectChanges();
  }

  public stopProp(event: MouseEvent): void {
    event.stopPropagation(); // used on the dropdown div itself
  }

  // ── EDIT MODAL ──
  public openEditModal(): void {
    this.showProfileDropdown = false;
    this.editError = '';
    this.showEditModal = true;

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.editFirstName = user.firstName || '';
        this.editLastName  = user.lastName  || '';
        this.editEmail     = user.email     || '';
        this.editPhone     = user.phone     || '';
        this.cdr.detectChanges();
      },
      error: () => {
        const decoded = this.auth.decodeToken();
        this.editFirstName = decoded?.firstName || '';
        this.editLastName  = decoded?.lastName  || '';
        this.editEmail     = this.userEmail;
        this.editPhone     = '';
        this.cdr.detectChanges();
      }
    });
    this.cdr.detectChanges();
  }

  public closeEditModal(): void {
    this.showEditModal = false;
    this.editError = '';
  }

  public saveProfile(): void {
    if (!this.editFirstName.trim()) {
      this.editError = 'First name is required.';
      return;
    }
    this.editSaving = true;
    this.editError  = '';

    this.userService.updateProfile(this.userId, {
      firstName: this.editFirstName.trim(),
      lastName:  this.editLastName.trim(),
      email:     this.editEmail.trim(),
      phone:     this.editPhone.trim()
    }).subscribe({
      next: () => {
        this.userService.getUserById(this.userId).subscribe({
          next: (user) => {
            this.userName    = `${user.firstName} ${user.lastName}`.trim();
            this.userEmail   = user.email;
            this.userInitials = this.getInitials(this.userName);
            this.cdr.detectChanges();
          }
        });
        this.editSaving   = false;
        this.showEditModal = false;
        this.toast.success('Profile updated successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.editError  = err?.error?.message || 'Failed to update profile.';
        this.editSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── LOGOUT ──
  public logout(): void {
    this.auth.clearAuthData();
    this.router.navigate(['/login']);
  }

  // ── SVG ICONS ──
  public getSvg(icon: string): string {
    const icons: Record<string, string> = {
      grid:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      home:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      users:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
      tag:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></svg>`,
      money:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
      report:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    };
    return icons[icon] || icons['grid'];
  }
}