import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cniMasked: string;
  role: 'citizen' | 'collector' | 'admin_municipal' | 'admin' | 'super_admin';
  zone: string;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
  level: string;
  points: number;
  badges: any[];
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signal pour accès réactif
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  private loadStoredUser() {
    try {
      const stored = localStorage.getItem('binova_user');
      if (stored) {
        const user = JSON.parse(stored);
        this.currentUserSubject.next(user);
        this.user.set(user);
        this.isLoggedIn.set(true);
      }
    } catch {}
  }

  register(data: {
    cni: string; phone: string; email: string;
    password: string; confirmPassword: string; name: string; zone: string;
  }): Observable<any> {
    return this.http.post(`${this.API}/register`, data).pipe(
      tap((res: any) => { if (res.success) this.handleAuthResponse(res); })
    );
  }

  login(identifier: string, password: string, totpCode?: string): Observable<any> {
    return this.http.post(`${this.API}/login`, { identifier, password, totpCode }).pipe(
      tap((res: any) => { if (res.success && !res.requiresTwoFactor) this.handleAuthResponse(res); })
    );
  }

  logout(): void {
    const refreshToken = localStorage.getItem('binova_refresh');
    this.http.post(`${this.API}/logout`, { refreshToken }).subscribe();
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(identifier: string): Observable<any> {
    return this.http.post(`${this.API}/forgot-password`, { identifier });
  }

  resetPassword(token: string, password: string, confirmPassword: string): Observable<any> {
    return this.http.post(`${this.API}/reset-password/${token}`, { password, confirmPassword });
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.patch(`${this.API}/change-password`, { currentPassword, newPassword, confirmPassword });
  }

  enable2FA(): Observable<any> {
    return this.http.post(`${this.API}/enable-2fa`, {});
  }

  verify2FA(token: string): Observable<any> {
    return this.http.post(`${this.API}/verify-2fa`, { token });
  }

  disable2FA(password: string): Observable<any> {
    return this.http.post(`${this.API}/disable-2fa`, { password });
  }

  refreshTokens(): Observable<any> {
    const refreshToken = localStorage.getItem('binova_refresh');
    return this.http.post(`${this.API}/refresh`, { refreshToken }).pipe(
      tap((res: any) => {
        if (res.accessToken) {
          localStorage.setItem('binova_token', res.accessToken);
          localStorage.setItem('binova_refresh', res.refreshToken);
        }
      }),
      catchError(err => {
        this.clearSession();
        this.router.navigate(['/auth/login']);
        return throwError(() => err);
      })
    );
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.API}/me`).pipe(
      tap((res: any) => {
        if (res.success) {
          this.currentUserSubject.next(res.user);
          this.user.set(res.user);
          localStorage.setItem('binova_user', JSON.stringify(res.user));
        }
      })
    );
  }

  private handleAuthResponse(res: any) {
    if (res.accessToken) localStorage.setItem('binova_token', res.accessToken);
    if (res.refreshToken) localStorage.setItem('binova_refresh', res.refreshToken);
    if (res.user) {
      localStorage.setItem('binova_user', JSON.stringify(res.user));
      this.currentUserSubject.next(res.user);
      this.user.set(res.user);
      this.isLoggedIn.set(true);
    }
  }

  private clearSession() {
    localStorage.removeItem('binova_token');
    localStorage.removeItem('binova_refresh');
    localStorage.removeItem('binova_user');
    this.currentUserSubject.next(null);
    this.user.set(null);
    this.isLoggedIn.set(false);
  }

  get token(): string | null {
    return localStorage.getItem('binova_token');
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const role = this.currentUser?.role;
    return ['admin', 'super_admin', 'admin_municipal'].includes(role || '');
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentUser?.role || '');
  }
}
