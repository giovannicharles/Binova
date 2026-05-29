/**
 * BINOVA — Service Authentification
 * Fichier : src/app/core/services/auth.service.ts
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface User {
  id: string; name: string; email: string; phone?: string;
  role: 'citizen' | 'partner' | 'admin_municipal' | 'admin' | 'super_admin';
  avatar_url?: string; zone?: string; eco_points: number; is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => ['admin', 'super_admin', 'admin_municipal'].includes(this._user()?.role || ''));

  constructor() { this.restoreSession(); }

  private restoreSession(): void {
    try {
      const token = localStorage.getItem('binova_token');
      const user = localStorage.getItem('binova_user');
      if (token && user) {
        this._token.set(token);
        this._user.set(JSON.parse(user));
      }
    } catch {}
  }

  login(email: string, password: string, fcm_token?: string): Observable<any> {
    return this.api.post('/auth/login', { email, password, fcm_token }).pipe(
      tap((res: any) => {
        if (res.data?.access_token) {
          this._token.set(res.data.access_token);
          this._user.set(res.data.user);
          localStorage.setItem('binova_token', res.data.access_token);
          localStorage.setItem('binova_refresh', res.data.refresh_token);
          localStorage.setItem('binova_user', JSON.stringify(res.data.user));
        }
      })
    );
  }

  register(data: any): Observable<any> {
    return this.api.post('/auth/register', data).pipe(
      tap((res: any) => {
        if (res.data?.access_token) {
          this._token.set(res.data.access_token);
          this._user.set(res.data.user);
          localStorage.setItem('binova_token', res.data.access_token);
          localStorage.setItem('binova_refresh', res.data.refresh_token);
          localStorage.setItem('binova_user', JSON.stringify(res.data.user));
        }
      })
    );
  }

  logout(): void {
    const refresh = localStorage.getItem('binova_refresh');
    this.api.post('/auth/logout', { refresh_token: refresh }).subscribe();
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem('binova_token');
    localStorage.removeItem('binova_refresh');
    localStorage.removeItem('binova_user');
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<any> {
    const refresh = localStorage.getItem('binova_refresh');
    return this.api.post('/auth/refresh', { refresh_token: refresh }).pipe(
      tap((res: any) => {
        if (res.data?.access_token) {
          this._token.set(res.data.access_token);
          localStorage.setItem('binova_token', res.data.access_token);
        }
      })
    );
  }

  updateUser(user: Partial<User>): void {
    const current = this._user();
    if (current) {
      const updated = { ...current, ...user };
      this._user.set(updated);
      localStorage.setItem('binova_user', JSON.stringify(updated));
    }
  }
}
