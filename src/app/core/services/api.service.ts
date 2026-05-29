/**
 * BINOVA — Smart Waste Management
 * Fichier : src/app/core/services/api.service.ts
 * Auteur  : SGAO-SARL © 2026
 * Rôle    : Service HTTP central avec gestion JWT, offline cache, intercepteurs
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, filter } from 'rxjs/operators';
import { HttpEventType } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { total: number; page: number; limit: number; pages: number };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  get<T>(path: string, params?: any): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => params[k] != null && (httpParams = httpParams.set(k, params[k])));
    return this.http.get<ApiResponse<T>>(`${this.base}${path}`, { params: httpParams, observe: 'response' })
      .pipe(
        map((response: HttpResponse<ApiResponse<T>>) => response.body!),
        catchError(this.handleError)
      );
  }

  post<T>(path: string, body: any, options?: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.base}${path}`, body, { ...options, observe: 'response' })
      .pipe(
        map((response: any) => response.body!),
        catchError(this.handleError)
      );
  }

  put<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.base}${path}`, body, { observe: 'response' })
      .pipe(
        map((response: any) => response.body!),
        catchError(this.handleError)
      );
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.base}${path}`, { observe: 'response' })
      .pipe(
        map((response: any) => response.body!),
        catchError(this.handleError)
      );
  }

  upload<T>(path: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.base}${path}`, formData, { observe: 'response' })
      .pipe(
        map((response: any) => response.body!),
        catchError(this.handleError)
      );
  }

  private handleError(err: any): Observable<never> {
    const msg = err.error?.message || err.message || 'Erreur serveur';
    console.error('[ApiService]', err);
    return throwError(() => ({ status: err.status, message: msg, errors: err.error?.errors }));
  }
}
