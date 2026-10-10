import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router:      Router,
    @Inject(PLATFORM_ID) private platformId: Object   // ← add
  ) {}

  public canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    // ── SSR: never block server-side rendering ─────────────────────────────
    if (!isPlatformBrowser(this.platformId)) {
      return true;                                     // ← let SSR pass through
    }

    // ── 1. Not logged in ───────────────────────────────────────────────────
    if (!this.authService.isLoggedIn()) {
      sessionStorage.setItem('redirectUrl', state.url);
      this.router.navigate(['/login']);
      return false;
    }

    // ── 2. Wrong role ──────────────────────────────────────────────────────
    const expectedRole = route.data?.['role']?.trim().toUpperCase();
    const userRole     = this.authService.getRole().trim().toUpperCase();

    if (expectedRole && userRole !== expectedRole) {
      this.redirectToDashboard(userRole);
      return false;
    }

    // ── 3. All good ────────────────────────────────────────────────────────
    return true;
  }

  private redirectToDashboard(role: string): void {
    switch (role) {
      case 'ADMIN': this.router.navigate(['/admin']); break;
      case 'AGENT': this.router.navigate(['/agent']); break;
      case 'BUYER': this.router.navigate(['/buyer']); break;
      default:      this.router.navigate(['/login']);
    }
  }
}