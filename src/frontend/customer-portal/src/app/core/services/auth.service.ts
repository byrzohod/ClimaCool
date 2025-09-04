import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  User,
  ApiError
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/api/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private refreshTokenTimeout?: any;

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      this.scheduleTokenRefresh();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        map(response => {
          this.handleAuthResponse(response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        map(response => {
          this.handleAuthResponse(response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    
    return this.http.post<void>(`${this.API_URL}/logout`, { refreshToken })
      .pipe(
        tap(() => this.clearAuth()),
        catchError(error => {
          this.clearAuth();
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    if (!token || !refreshToken) {
      this.clearAuth();
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = {
      token,
      refreshToken
    };

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh-token`, request)
      .pipe(
        map(response => {
          this.handleAuthResponse(response);
          return response;
        }),
        catchError(error => {
          this.clearAuth();
          return throwError(() => error);
        })
      );
  }

  forgotPassword(email: string): Observable<void> {
    const request: ForgotPasswordRequest = { email };
    return this.http.post<void>(`${this.API_URL}/forgot-password`, request)
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, newPassword: string, confirmNewPassword: string): Observable<void> {
    const request: ResetPasswordRequest = {
      token,
      newPassword,
      confirmNewPassword
    };
    return this.http.post<void>(`${this.API_URL}/reset-password`, request)
      .pipe(catchError(this.handleError));
  }

  verifyEmail(token: string): Observable<void> {
    const request: VerifyEmailRequest = { token };
    return this.http.post<void>(`${this.API_URL}/verify-email`, request)
      .pipe(catchError(this.handleError));
  }

  resendVerificationEmail(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/resend-verification`, {})
      .pipe(catchError(this.handleError));
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.roles.includes(role) : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.some(role => user.roles.includes(role)) : false;
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
    
    this.scheduleTokenRefresh();
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    this.stopTokenRefresh();
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private scheduleTokenRefresh(): void {
    this.stopTokenRefresh();
    
    const token = this.getToken();
    if (!token) return;

    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return;

    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const delay = expiresAt - now - 60000; // Refresh 1 minute before expiry

    if (delay > 0) {
      this.refreshTokenTimeout = timer(delay).pipe(
        switchMap(() => this.refreshToken())
      ).subscribe({
        error: () => this.clearAuth()
      });
    }
  }

  private stopTokenRefresh(): void {
    if (this.refreshTokenTimeout) {
      this.refreshTokenTimeout.unsubscribe();
      this.refreshTokenTimeout = undefined;
    }
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.errors && Array.isArray(error.error.errors)) {
        errorMessage = error.error.errors.join(', ');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    const apiError: ApiError = {
      message: errorMessage,
      errors: error.error?.errors,
      statusCode: error.status || 0
    };

    return throwError(() => apiError);
  }
}