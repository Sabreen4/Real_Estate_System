import { Component, ChangeDetectorRef, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService }   from 'src/app/core/services/auth.service';
import { ToastService }  from 'src/app/core/services/toast.service';
import { AuthResponse }  from 'src/app/core/models/auth-response.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent implements OnInit {

  public loginData         = { email: '', password: '' };
  public errorMessage      = '';
  public isLoading         = false;
  public showPassword      = false;
  public sessionExpiredMsg = '';

  constructor(
    private router:      Router,
    private authService: AuthService,
    private toast:       ToastService,
    private cdr:         ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object   // ← add
  ) {}

  public ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {          // ← guard every sessionStorage call
      if (sessionStorage.getItem('redirectUrl')) {
        this.sessionExpiredMsg = 'Session expired. Please log in again.';
      }
    }
  }

  public onSubmit(form: NgForm): void {
    if (form.invalid) return;

    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response: AuthResponse) => {
        try {
          if (isPlatformBrowser(this.platformId)) {    // ← guard
            sessionStorage.setItem('token', response.token);
          }

          const redirectUrl = isPlatformBrowser(this.platformId)
            ? sessionStorage.getItem('redirectUrl')
            : null;

          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.removeItem('redirectUrl');
          }

          const userRole = this.authService.getRole()?.trim().toUpperCase();
          this.toast.success('Login Successful');

          if (redirectUrl) {
            this.router.navigateByUrl(redirectUrl);
            return;
          }

          switch (userRole) {
            case 'ADMIN': this.router.navigate(['/admin/dashboard']); break;
            case 'AGENT': this.router.navigate(['/agent/dashboard']); break;
            case 'BUYER': this.router.navigate(['/buyer/dashboard']); break;
            default:
              this.toast.error('Invalid Role');
              this.router.navigate(['/login']);
          }
        } catch {
          this.toast.error('Something went wrong. Please try again.');
        } finally {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },

      error: (err) => {
        this.isLoading = false;

        const status = err?.status;

        if (status === 0) {
          this.errorMessage = 'Network error. Please check your connection.';
        } else if (status === 401 || status === 403) {
          this.errorMessage = err.error?.message || 'Invalid email or password.';
        } else if (status >= 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = err.error?.message || 'Login failed. Please try again.';
        }

        this.toast.error(this.errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public goToForgotPassword(): void {
    this.router.navigate(['/forgot-password'], {
      state: { email: this.loginData.email || '' }
    });
  }
}