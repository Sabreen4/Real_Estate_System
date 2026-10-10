import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  standalone: false
})
export class ResetPasswordComponent {
  email = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    const nav = this.router.getCurrentNavigation();
    this.email = nav?.extras?.state?.['email'] || '';
  }

  ngOnInit(): void {
    if (!this.email) {
      this.router.navigate(['/forgot-password']);
    }
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resetPassword({ email: this.email, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('Password reset successfully. Please login.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Something went wrong.';
        this.toast.error(this.errorMessage);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}