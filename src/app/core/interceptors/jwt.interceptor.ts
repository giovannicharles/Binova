import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  // Ajouter le token si présent
  let request = req;
  if (token) {
    request = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(request).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401 && err.error?.code === 'TOKEN_EXPIRED') {
        // Gestion du refresh token
        return authService.refreshTokens().pipe(
          switchMap(res => {
            // Cloner la requête avec le nouveau token
            const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } });
            return next(newReq);
          }),
          catchError(refreshErr => {
            // Si le refresh échoue, on déconnecte l'utilisateur
            authService.logout();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};