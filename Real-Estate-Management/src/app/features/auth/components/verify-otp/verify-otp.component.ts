import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css'],
  standalone: false
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  public otp = '';
  public email = '';
  public isLoading = false;
  public errorMessage = '';

  public resendCooldown = 60;
  public canResend = false;
  private timerInterval!: ReturnType<typeof setInterval>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const nav = this.router.getCurrentNavigation();
    const stateEmail = nav?.extras?.state?.['email'] || '';

    if (stateEmail) {
      this.email = stateEmail;
      if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem('otp_email', stateEmail);
      }
    } else if (isPlatformBrowser(this.platformId)) {
      this.email = sessionStorage.getItem('otp_email') || '';
    }
  }

  public ngOnInit(): void {
    if (!this.email) {
      this.router.navigate(['/forgot-password']);
      return;
    }
    this.startTimer();
  }

  public ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  public startTimer(): void {
    this.resendCooldown = 60;
    this.canResend = false;
    this.timerInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.timerInterval);
        this.canResend = true;
      }
    }, 1000);
  }

  public onSubmit(): void {
    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyOtp({ email: this.email, otp: this.otp }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.removeItem('otp_email');
        }
        this.toast.success('OTP verified successfully');
        this.router.navigate(['/reset-password'], { state: { email: res.email } });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid or expired OTP.';
        this.cdr.detectChanges();
        this.toast.error(this.errorMessage);
      }
    });
  }

  public resendOtp(): void {
    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: () => {
        this.toast.success('OTP resent to your email');
        this.startTimer();
      },
      error: () => this.toast.error('Failed to resend OTP.')
    });
  }
}