/**
 * BINOVA — Intercepteur JWT
 * Fichier : src/app/core/interceptors/auth.interceptor.ts
 */

import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError, catchError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token() || localStorage.getItem('binova_token');

  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && err.error?.code === 'TOKEN_EXPIRED') {
        return auth.refreshToken().pipe(
          switchMap(() => {
            const newToken = auth.token();
            const retryReq = req.clone({ headers: req.headers.set('Authorization', `Bearer ${newToken}`) });
            return next(retryReq);
          }),
          catchError(() => { auth.logout(); return throwError(() => err); })
        );
      }
      return throwError(() => err);
    })
  );
};
