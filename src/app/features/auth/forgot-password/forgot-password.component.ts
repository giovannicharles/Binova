import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-header">
        <button class="back-btn" routerLink="/auth/login">
          <i class="ri-arrow-left-line" style="font-size: 20px;"></i>
        </button>
        <h1>Mot de passe oublié</h1>
      </div>

      <div class="auth-body">
        @if (!sent()) {
          <div class="icon-wrap">
            <i class="ri-lock-line" style="font-size: 64px;"></i>
          </div>
          <h2>Récupérer l'accès</h2>
          <p>Entrez votre email ou téléphone. Nous vous enverrons un lien de réinitialisation.</p>

          @if (error()) {
            <div class="alert-error">{{ error() }}</div>
          }

          <div class="form-group" style="margin-top: 32px">
            <label>Email ou téléphone</label>
            <input class="form-control" type="text" [(ngModel)]="identifier"
                   placeholder="email@exemple.cm ou +237...">
          </div>

          <button class="btn btn-primary btn-full" [disabled]="loading() || !identifier" (click)="send()">
            @if (loading()) { <span class="spinner-sm"></span> }
            Envoyer le lien
          </button>
        } @else {
          <div class="success-state animate-pop-in">
            <div class="success-icon">
              <i class="ri-mail-send-line" style="font-size: 80px;"></i>
            </div>
            <h2>Email envoyé !</h2>
            <p>Si ce compte existe, vous recevrez un email avec les instructions de réinitialisation dans quelques minutes.</p>
            <p class="check-spam">Vérifiez aussi votre dossier spam.</p>
            <a routerLink="/auth/login" class="btn btn-primary btn-full" style="margin-top: 32px">
              Retour à la connexion
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100dvh; background: var(--bg); display: flex; flex-direction: column; }
    .auth-header {
      display: flex; align-items: center; gap: 12px;
      padding: 20px 16px; padding-top: calc(20px + env(safe-area-inset-top));
      border-bottom: 1px solid var(--border-light);
      h1 { font-size: 18px; }
    }
    .back-btn {
      width: 40px; height: 40px; border-radius: 12px;
      background: var(--bg-soft); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; color: var(--text-muted);
    }
    .auth-body { padding: 40px 24px; text-align: center; }
    .icon-wrap { font-size: 64px; margin-bottom: 20px; }
    h2 { font-size: 22px; margin-bottom: 12px; }
    p { color: var(--text-muted); font-size: 15px; line-height: 1.7; }
    .alert-error { background: #FEF2F2; color: #DC2626; padding: 12px; border-radius: 12px; font-size: 13px; margin-top: 16px; }
    .success-icon { font-size: 80px; margin-bottom: 24px; animation: bounce 1s ease; }
    .check-spam { font-size: 13px; color: var(--text-light); margin-top: 12px; }
    .spinner-sm {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }
  `]
})
export class ForgotPasswordComponent {
  identifier = '';
  loading = signal(false);
  sent = signal(false);
  error = signal('');

  constructor(private authService: AuthService) { }

  send() {
    this.loading.set(true);
    this.authService.forgotPassword(this.identifier).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message || 'Erreur'); }
    });
  }
}
