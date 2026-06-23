import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-header">
        <h1>Nouveau mot de passe</h1>
      </div>
      <div class="auth-body">
        @if (!done()) {
          <div class="icon-wrap">🔐</div>
          <h2>Réinitialiser</h2>
          <p>Choisissez un nouveau mot de passe sécurisé.</p>

          @if (error()) {
            <div class="alert-error">{{ error() }}</div>
          }

          <div class="form-group" style="margin-top: 32px; text-align: left">
            <label>Nouveau mot de passe</label>
            <input class="form-control" type="password" [(ngModel)]="password"
                   placeholder="Minimum 8 caractères">
          </div>
          <div class="form-group" style="text-align: left">
            <label>Confirmer le mot de passe</label>
            <input class="form-control" type="password" [(ngModel)]="confirmPassword"
                   placeholder="Répéter">
          </div>

          <button class="btn btn-primary btn-full" [disabled]="loading() || !password || password !== confirmPassword" (click)="reset()">
            @if (loading()) { <span class="spinner-sm"></span> }
            Réinitialiser
          </button>
        } @else {
          <div class="success-state animate-pop-in">
            <div class="success-icon">✅</div>
            <h2>Mot de passe modifié !</h2>
            <p>Votre mot de passe a été réinitialisé avec succès. Reconnectez-vous.</p>
            <a routerLink="/auth/login" class="btn btn-primary btn-full" style="margin-top: 32px">
              Se connecter
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100dvh; background: var(--bg); display: flex; flex-direction: column; }
    .auth-header { padding: 24px; border-bottom: 1px solid var(--border-light); text-align: center; h1 { font-size: 20px; } }
    .auth-body { padding: 40px 24px; text-align: center; }
    .icon-wrap { font-size: 56px; margin-bottom: 16px; }
    h2 { font-size: 22px; margin-bottom: 10px; }
    p { color: var(--text-muted); font-size: 15px; }
    .alert-error { background: #FEF2F2; color: #DC2626; padding: 12px; border-radius: 12px; font-size: 13px; margin-top: 16px; }
    .success-icon { font-size: 80px; margin-bottom: 24px; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  token = '';
  loading = signal(false);
  done = signal(false);
  error = signal('');

  constructor(private authService: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.token = this.route.snapshot.params['token'];
  }

  reset() {
    this.loading.set(true);
    this.authService.resetPassword(this.token, this.password, this.confirmPassword).subscribe({
      next: () => { this.loading.set(false); this.done.set(true); },
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message || 'Token invalide ou expiré'); }
    });
  }
}
