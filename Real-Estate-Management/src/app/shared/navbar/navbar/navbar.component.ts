import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: false
})

export class NavbarComponent {

  isDropdownOpen = false;

  userName = 'Sabreen';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) { }

  // Toggle Dropdown
   public toggleDropdown(): void {

    this.isDropdownOpen = !this.isDropdownOpen;
  }
  public goHome(): void {
  const role = this.authService.getRole();

  const routeMap: Record<string, string> = {
    BUYER: '/buyer/dashboard',
    AGENT: '/agent/dashboard',
    ADMIN: '/admin/dashboard'
  };

  this.router.navigate([routeMap[role] ?? '/']);
}
  // Logout
  public logout(): void {

    // Clear Session
    this.authService.clearAuthData();

    // Toast Message
    this.toast.success('Logged out successfully');

    // Redirect
    this.router.navigate(['/login']);
  }
}