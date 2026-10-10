import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: false
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  roles = ['AGENT', 'BUYER'];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName:       ['', [Validators.required, Validators.minLength(2)]],
      lastName:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role:            ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password        = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get f() { return this.registerForm.controls; }

  public onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const d = this.registerForm.value;

    this.authService.register({
      firstName: d.firstName.trim(),
      lastName:  d.lastName.trim(),
      email:     d.email.trim(),
      password:  d.password,
      phone:     d.phone.trim(),
      role:      d.role
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('Registration successful! Redirecting...');
        this.registerForm.reset();
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        let msg: string;
        if (err.status === 0) {
          msg = 'Network error. Please check your connection.';
        } else if (err.status === 409) {
          msg = err.error?.message || 'Email already registered.';
        } else if (err.status >= 500) {
          msg = 'Server error. Please try again later.';
        } else {
          msg = err.error?.message || 'Registration failed. Please try again.';
        }
        this.toast.error(msg);
      }
    });
  }
}