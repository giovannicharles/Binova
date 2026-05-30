import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-page">
      <!-- Header -->
      <div class="reg-header">
        <button class="back-btn" routerLink="/auth/login">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div class="header-text">
          <h1>Créer un compte</h1>
          <p>Rejoignez la communauté BINOVA</p>
        </div>
      </div>

      <!-- Step indicator -->
      <div class="steps">
        @for (s of [1,2]; track s) {
          <div class="step-item" [class.active]="step() >= s" [class.done]="step() > s">
            <div class="step-num">{{ step() > s ? '✓' : s }}</div>
            <span>{{ s === 1 ? 'Identité' : 'Sécurité' }}</span>
          </div>
          @if (s < 2) { <div class="step-line" [class.done]="step() > s"></div> }
        }
      </div>

      <div class="reg-form">
        @if (error()) {
          <div class="alert-error animate-pop-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error() }}
          </div>
        }

        @if (step() === 1) {
          <div class="animate-slide-up">
            <div class="form-group">
              <label>Nom complet *</label>
              <div class="input-group">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input class="form-control" type="text" [(ngModel)]="form.name" placeholder="Jean Dupont">
              </div>
            </div>

            <div class="form-group">
              <label>Numéro CNI *</label>
              <div class="input-group">
                <span class="input-icon">🪪</span>
                <input class="form-control" type="text" [(ngModel)]="form.cni"
                       placeholder="CM-XXXXXXXXX" style="text-transform: uppercase">
              </div>
            </div>

            <div class="form-group">
              <label>Téléphone *</label>
              <div class="input-group">
                <span class="input-icon">📱</span>
                <input class="form-control" type="tel" [(ngModel)]="form.phone"
                       placeholder="+237 6XX XXX XXX">
              </div>
            </div>

            <div class="form-group">
              <label>Email *</label>
              <div class="input-group">
                <span class="input-icon">✉️</span>
                <input class="form-control" type="email" [(ngModel)]="form.email"
                       placeholder="email@exemple.cm">
              </div>
            </div>

            <div class="form-group">
              <label>Quartier / Zone *</label>
              <div class="input-group">
                <span class="input-icon">📍</span>
                <select class="form-control" [(ngModel)]="form.zone">
                  <option value="">Sélectionner votre quartier</option>
                  @for (z of zones; track z) {
                    <option [value]="z">{{ z }}</option>
                  }
                </select>
              </div>
            </div>

            <button class="btn btn-primary btn-full" (click)="nextStep()"
                    [disabled]="!form.name || !form.cni || !form.phone || !form.email || !form.zone">
              Continuer
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        }

        @if (step() === 2) {
          <div class="animate-slide-up">
            <div class="form-group">
              <label>Mot de passe *</label>
              <div class="input-group">
                <span class="input-icon">🔐</span>
                <input class="form-control" [type]="showPwd() ? 'text' : 'password'"
                       [(ngModel)]="form.password" placeholder="Minimum 8 caractères">
                <button type="button" class="input-suffix" (click)="toggleShowPwd()">
                  {{ showPwd() ? '🙈' : '👁️' }}
                </button>
              </div>
              <!-- Password strength -->
              @if (form.password) {
                <div class="pwd-strength">
                  <div class="pwd-bar">
                    <div class="pwd-bar-fill" [style.width.%]="pwdStrength()" [class]="pwdClass()"></div>
                  </div>
                  <span class="pwd-label" [class]="pwdClass()">{{ pwdLabel() }}</span>
                </div>
              }
            </div>

            <div class="form-group">
              <label>Confirmer le mot de passe *</label>
              <div class="input-group">
                <span class="input-icon">🔒</span>
                <input class="form-control" [type]="showPwd() ? 'text' : 'password'"
                       [(ngModel)]="form.confirmPassword" placeholder="Répéter le mot de passe">
              </div>
              @if (form.confirmPassword && form.password !== form.confirmPassword) {
                <p class="error-msg">❌ Les mots de passe ne correspondent pas</p>
              }
            </div>

            <div class="cgu">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="acceptCGU">
                <span>J'accepte les <a href="#">Conditions d'utilisation</a> et la <a href="#">Politique de confidentialité</a> de BINOVA</span>
              </label>
            </div>

            <div class="btn-group-reg">
              <button class="btn btn-outline" (click)="step.set(1)">← Retour</button>
              <button class="btn btn-primary" (click)="register()"
                      [disabled]="loading() || !form.password || form.password !== form.confirmPassword || !acceptCGU">
                @if (loading()) { <span class="spinner"></span> }
                Créer mon compte
              </button>
            </div>
          </div>
        }

        <div class="login-link">
          Déjà inscrit ? <a routerLink="/auth/login">Se connecter</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
    }

    .reg-header {
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      padding: 20px 16px 28px;
      padding-top: calc(20px + env(safe-area-inset-top));
      display: flex;
      align-items: center;
      gap: 16px;
      color: #fff;

      .back-btn {
        width: 40px; height: 40px;
        border-radius: 12px;
        background: rgba(255,255,255,0.2);
        border: none;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }

      h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
      p { font-size: 13px; opacity: 0.85; }
    }

    .steps {
      display: flex;
      align-items: center;
      padding: 20px 24px;
      background: var(--bg);
      border-bottom: 1px solid var(--border-light);
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .step-num {
        width: 28px; height: 28px;
        border-radius: 14px;
        background: var(--border);
        color: var(--text-muted);
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700;
        transition: all 0.3s;
      }

      span { font-size: 13px; color: var(--text-muted); font-weight: 500; }

      &.active .step-num { background: var(--primary); color: #fff; }
      &.active span { color: var(--primary); font-weight: 700; }
      &.done .step-num { background: var(--success); color: #fff; }
    }

    .step-line {
      height: 2px;
      width: 40px;
      background: var(--border);
      margin: 0 8px;
      transition: background 0.3s;
      &.done { background: var(--success); }
    }

    .reg-form {
      padding: 24px 20px;
      flex: 1;
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
      margin-bottom: 20px;
    }

    .pwd-strength {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pwd-bar {
      flex: 1;
      height: 4px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
    }

    .pwd-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s, background 0.3s;
      &.weak { background: var(--error); }
      &.medium { background: var(--warning); }
      &.strong { background: var(--success); }
    }

    .pwd-label {
      font-size: 12px; font-weight: 600;
      &.weak { color: var(--error); }
      &.medium { color: var(--warning); }
      &.strong { color: var(--success); }
    }

    .cgu {
      margin-bottom: 24px;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.6;

      input[type="checkbox"] { margin-top: 2px; accent-color: var(--primary); }
      a { color: var(--primary); font-weight: 600; }
    }

    .btn-group-reg {
      display: flex;
      gap: 12px;

      .btn { flex: 1; }
    }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    .login-link {
      text-align: center;
      margin-top: 32px;
      font-size: 14px;
      color: var(--text-muted);

      a { color: var(--primary); font-weight: 700; margin-left: 4px; }
    }
  `]
})
export class RegisterComponent {
  step = signal(1);
  loading = signal(false);
  error = signal('');
  showPwd = signal(false);
  acceptCGU = false;

  form = {
    name: '', cni: '', phone: '', email: '', zone: '',
    password: '', confirmPassword: ''
  };

  zones = [
    'Bastos', 'Nlongkak', 'Melen', 'Essos', 'Mvog-Ada',
    'Biyem-Assi', 'Mendong', 'Mimboman', 'Nsimeyong', 'Ekounou',
    'Nkomo', 'Obili', 'Etoa-Meki', 'Messa', 'Damas'
  ];

  constructor(private authService: AuthService, private router: Router) {}

  toggleShowPwd() {
    this.showPwd.update(v => !v);
  }

  pwdStrength(): number {
    const pwd = this.form.password;
    let score = 0;
    if (pwd.length >= 8) score += 30;
    if (pwd.length >= 12) score += 20;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;
    return Math.min(100, score);
  }

  pwdClass(): string {
    const s = this.pwdStrength();
    if (s >= 70) return 'strong';
    if (s >= 40) return 'medium';
    return 'weak';
  }

  pwdLabel(): string {
    const c = this.pwdClass();
    return c === 'strong' ? 'Fort' : c === 'medium' ? 'Moyen' : 'Faible';
  }

  nextStep() {
    this.error.set('');
    this.step.set(2);
  }

  register() {
    if (this.form.password !== this.form.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.authService.register(this.form).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erreur lors de la création du compte');
      }
    });
  }
}