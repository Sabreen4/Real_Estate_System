import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/auth-response.model';
import { LoginRequest } from '../models/login-request.model';
import { RegisterRequest } from '../models/register-request.model';
import { JwtPayload } from '../models/jwt-payload.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // =========================
  // LOGIN
  // =========================
  public login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data);
  }

  // FORGOT PASSWORD
  public forgotPassword(data: { email: string }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, data);
  }

  // VERIFY OTP
  public verifyOtp(data: { email: string; otp: string }): Observable<{ email: string }> {
    return this.http.post<{ email: string }>(`${this.apiUrl}/verify-otp`, data);
  }

  // RESET PASSWORD
  public resetPassword(data: { email: string; newPassword: string }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, data);
  }

  // =========================
  // REGISTER
  // =========================
  public register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  public getUserById(id: number): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/${id}`);
  }

  // =========================
  // LOGOUT
  // =========================
  public logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.clear();
    }
  }

  // =========================
  // CLEAR AUTH DATA
  // =========================
  public clearAuthData(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.clear();
    }
  }

  // =========================
  // GET TOKEN
  // =========================
  public getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('token');
    }
    return null;
  }

  // =========================
  // CHECK LOGIN
  // =========================
  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // =========================
  // DECODE TOKEN
  // =========================
  public decodeToken(): JwtPayload | null {
  if (!isPlatformBrowser(this.platformId)) {
    return null;
  }
  const token = sessionStorage.getItem('token');
  if (!token) {
    return null;
  }
  return jwtDecode<JwtPayload>(token);
}

  // =========================
  // GET USER ROLE
  // =========================
  public getRole(): string {
    const decodedToken = this.decodeToken();
    if (!decodedToken) {
      return '';
    }
    console.log('DECODED TOKEN:', decodedToken);
    if (decodedToken?.['role']) {
      return decodedToken['role'];
    }
    return decodedToken?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
  }
}