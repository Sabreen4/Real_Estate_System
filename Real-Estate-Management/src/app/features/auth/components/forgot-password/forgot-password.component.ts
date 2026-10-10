import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: false
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  errorMessage = '';
  isEmailPrefilled = false;  // ← add

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Read email passed from login page
    const nav = this.router.getCurrentNavigation();
    const stateEmail = nav?.extras?.state?.['email'] || '';
    if (stateEmail) {
      this.email = stateEmail;
      this.isEmailPrefilled = true;  // ← lock the field
    }
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('OTP sent to your email');
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem('otp_email', this.email);
        }
        this.router.navigate(['/verify-otp'], { state: { email: this.email } });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Something went wrong.';
        this.toast.error(this.errorMessage);
      }
    });
  }
}
