import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <!-- Background -->
      <div class="login-bg">
        <div class="bg-circle bg-circle-1"></div>
        <div class="bg-circle bg-circle-2"></div>
      </div>

      <!-- Header -->
      <div class="login-header">
        <div class="logo-wrap">
          <svg width="56" height="56" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
            <path d="M40 18C40 18 22 29 22 44C22 54 30 62 40 62C50 62 58 54 58 44C58 29 40 18 40 18Z" fill="white"/>
            <path d="M32 52L40 37L48 52" stroke="#2C7A3E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="40" cy="34" r="3.5" fill="#2C7A3E"/>
          </svg>
        </div>
        <h1>Bienvenue</h1>
        <p>Connectez-vous à votre compte BINOVA</p>
      </div>

      <!-- Form Card -->
      <div class="login-card animate-slide-up">
        @if (error()) {
          <div class="alert-error animate-pop-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error() }}
          </div>
        }

        <!-- 2FA Step -->
        @if (requires2FA()) {
          <div class="two-fa-step animate-pop-in">
            <div class="two-fa-icon">🔐</div>
            <h3>Vérification 2FA</h3>
            <p>Entrez le code de votre application d'authentification</p>
            <div class="form-group">
              <input class="otp-input form-control" type="text" inputmode="numeric"
                     [(ngModel)]="totpCode" maxlength="6" placeholder="000000"
                     (keyup.enter)="login()" autofocus>
            </div>
            <button class="btn btn-primary btn-full" [disabled]="loading() || totpCode.length < 6" (click)="login()">
              @if (loading()) { <span class="spinner"></span> } Vérifier
            </button>
            <button class="btn-text" (click)="requires2FA.set(false)">← Retour</button>
          </div>
        } @else {
          <form (ngSubmit)="login()" #loginForm="ngForm">
            <!-- Identifier -->
            <div class="form-group">
              <label>Email ou téléphone</label>
              <div class="input-group">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input class="form-control" type="text" name="identifier"
                       [(ngModel)]="identifier" required
                       placeholder="email@exemple.cm ou +237...">
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label>Mot de passe</label>
              <div class="input-group">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input class="form-control" [type]="showPassword() ? 'text' : 'password'"
                       name="password" [(ngModel)]="password" required placeholder="••••••••">
                <button type="button" class="input-suffix" (click)="toggleShowPassword()">
                  @if (showPassword()) {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  } @else {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <!-- Forgot -->
            <div class="forgot-link">
              <a routerLink="/auth/forgot-password">Mot de passe oublié ?</a>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-primary btn-full"
                    [disabled]="loading() || !identifier || !password">
              @if (loading()) {
                <span class="spinner"></span>
              }
              Se connecter
            </button>
          </form>

          <!-- Register link -->
          <div class="register-link">
            <span>Pas encore de compte ?</span>
            <a routerLink="/auth/register">Créer un compte</a>
          </div>
        }
      </div>

      <div class="login-footer">
        <p>🌿 BINOVA • SGAO-SARL, Yaoundé 2026</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 20px 40px;
      position: relative;
      overflow: hidden;
      background: linear-gradient(160deg, #2C7A3E 0%, #16A34A 40%, #F8FAFC 70%);
    }

    .login-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .bg-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
    }

    .bg-circle-1 {
      width: 320px; height: 320px;
      top: -80px; right: -80px;
    }

    .bg-circle-2 {
      width: 200px; height: 200px;
      bottom: 20%; left: -60px;
    }

    .login-header {
      text-align: center;
      padding: 60px 0 32px;
      color: #fff;
      position: relative;
      z-index: 1;
    }

    .logo-wrap {
      display: inline-flex;
      background: rgba(255,255,255,0.15);
      border-radius: 24px;
      padding: 12px;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
      animation: pop-in 0.5s ease;
    }

    .login-header h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 6px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .login-header p {
      font-size: 14px;
      opacity: 0.85;
    }

    .login-card {
      background: var(--bg);
      border-radius: 28px;
      padding: 28px 24px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      position: relative;
      z-index: 1;
    }

    .alert-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #DC2626;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 20px;
    }

    .two-fa-step {
      text-align: center;
      padding: 8px 0;

      .two-fa-icon { font-size: 56px; margin-bottom: 16px; }
      h3 { font-size: 20px; margin-bottom: 8px; color: var(--text); }
      p { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
    }

    .otp-input {
      text-align: center;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 12px;
      padding: 16px;
    }

    .btn-text {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 14px;
      cursor: pointer;
      margin-top: 12px;
      display: block;
      width: 100%;
      text-align: center;
      padding: 8px;

      &:hover { color: var(--primary); }
    }

    .forgot-link {
      text-align: right;
      margin: -8px 0 20px;

      a {
        font-size: 13px;
        color: var(--primary);
        font-weight: 600;
      }
    }

    .register-link {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      a { color: var(--primary); font-weight: 700; }
    }

    .login-footer {
      margin-top: 32px;
      text-align: center;
      color: rgba(255,255,255,0.6);
      font-size: 12px;
      position: relative;
      z-index: 1;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
  `]
})
export class LoginComponent {
  identifier = '';
  password = '';
  totpCode = '';
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);
  requires2FA = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  toggleShowPassword() {
    this.showPassword.update(v => !v);
  }

  login() {
    if (!this.identifier || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.authService.login(
      this.identifier,
      this.password,
      this.requires2FA() ? this.totpCode : undefined
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.requiresTwoFactor) {
          this.requires2FA.set(true);
          return;
        }
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigate([returnUrl]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erreur de connexion');
      }
    });
  }
}