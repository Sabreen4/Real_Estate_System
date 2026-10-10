import { Injectable } from '@angular/core';

import {HttpEvent,HttpHandler,HttpInterceptor,HttpRequest,HttpErrorResponse} from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private toast: ToastService
  ) { }

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {

    const token = sessionStorage.getItem('token');

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {

        //  Skip global handling for auth routes — 
        // login/register handle their own errors inline
        const isAuthRoute =
          req.url.includes('/auth/login') ||
          req.url.includes('/auth/register') ||
          req.url.includes('/auth/forgot-password') ||   // ← add
          req.url.includes('/auth/verify-otp') ||         // ← add
          req.url.includes('/auth/reset-password');        // ← add

        if (!isAuthRoute) {
          this.handleError(error);
        }

        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {

    // Network / server unreachable
    if (error.status === 0) {
      this.toast.error(
        'Unable to reach the server. Please check your connection.',
        'Network Error'
      );
      return;
    }

    switch (error.status) {

      case 400:
        this.toast.error(
          error.error?.message || 'Invalid request. Please check your input.',
          'Bad Request'
        );
        break;

      case 401:
        this.toast.error(
          'Your session has expired. Please log in again.',
          'Unauthorized'
        );
        sessionStorage.removeItem('token');
        this.router.navigate(['/login']);
        break;

      case 403:
        this.toast.error(
          'You do not have permission to perform this action.',
          'Access Denied'
        );
        break;

      case 404:
        this.toast.error(
          error.error?.message || 'The requested resource was not found.',
          'Not Found'
        );
        break;

      case 409:
        this.toast.error(
          error.error?.message || 'A conflict occurred with the current state.',
          'Conflict'
        );
        break;

      case 422:
        this.toast.error(
          error.error?.message || 'Validation failed. Please check your input.',
          'Validation Error'
        );
        break;

      case 500:
        this.toast.error(
          'An internal server error occurred. Please try again later.',
          'Server Error'
        );
        break;

      case 503:
        this.toast.error(
          'The service is temporarily unavailable. Please try again later.',
          'Service Unavailable'
        );
        break;

      default:
        this.toast.error(
          error.error?.message || `Unexpected error (${error.status}). Please try again.`,
          'Error'
        );
        break;
    }
  }
}