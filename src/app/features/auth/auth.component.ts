/**
 * BINOVA — Smart Waste Management
 * Fichier : src/app/features/auth/auth.component.ts
 * Auteur  : SGAO-SARL © 2026
 * Rôle    : Login + Register avec validation temps réel, indicateur force MDP
 */

import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="auth-wrap">
  <!-- Logo -->
  <div class="auth-logo animate-pop-in">
    <div class="logo-circle">
      <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#2D7D2D"/>
        <path d="M12 28V18c0-1 .5-2 1.5-2.5L20 12l6.5 3.5c1 .5 1.5 1.5 1.5 2.5v10H12z" fill="white" opacity=".9"/>
        <circle cx="20" cy="20" r="3" fill="#2D7D2D"/>
      </svg>
    </div>
    <div>
      <h1 class="logo-title">BINOVA</h1>
      <p class="logo-sub">Yaoundé — Gestion intelligente des déchets</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="auth-tabs">
    <button class="tab-btn" [class.active]="mode() === 'login'" (click)="mode.set('login')">Connexion</button>
    <button class="tab-btn" [class.active]="mode() === 'register'" (click)="mode.set('register')">Inscription</button>
  </div>

  <!-- LOGIN FORM -->
  <form *ngIf="mode() === 'login'" [formGroup]="loginForm" (ngSubmit)="doLogin()" class="auth-form animate-slide-up">
    <div class="form-group">
      <label>Email</label>
      <input formControlName="email" type="email" class="form-control"
             placeholder="vous@example.cm"
             [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
      <span class="field-error" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
        Email invalide
      </span>
    </div>
    <div class="form-group">
      <label>Mot de passe</label>
      <div class="input-password">
        <input formControlName="password" [type]="showPwd() ? 'text' : 'password'"
               class="form-control" placeholder="••••••••"
               [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
        <button type="button" class="pwd-toggle" (click)="toggleShowPwd()">
          {{ showPwd() ? '🙈' : '👁️' }}
        </button>
      </div>
    </div>
    <a routerLink="/auth/forgot-password" class="forgot-link">Mot de passe oublié ?</a>
    <button type="submit" class="btn btn-primary btn-full" [disabled]="loading() || loginForm.invalid">
      <span *ngIf="loading()" class="spinner"></span>
      {{ loading() ? 'Connexion...' : 'Se connecter' }}
    </button>
  </form>

  <!-- REGISTER FORM -->
  <form *ngIf="mode() === 'register'" [formGroup]="registerForm" (ngSubmit)="doRegister()" class="auth-form animate-slide-up">
    <div class="form-group">
      <label>Nom complet</label>
      <input formControlName="name" type="text" class="form-control" placeholder="Marie Atangana"
             [class.error]="registerForm.get('name')?.invalid && registerForm.get('name')?.touched">
    </div>
    <div class="form-group">
      <label>Email</label>
      <input formControlName="email" type="email" class="form-control" placeholder="vous@example.cm"
             [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
    </div>
    <div class="form-group">
      <label>Téléphone (optionnel)</label>
      <input formControlName="phone" type="tel" class="form-control" placeholder="+237 6XX XXX XXX">
    </div>
    <div class="form-group">
      <label>Quartier</label>
      <select formControlName="zone" class="form-control">
        <option value="">-- Choisir votre zone --</option>
        <option *ngFor="let z of zones" [value]="z">{{ z }}</option>
      </select>
    </div>
    <div class="form-group">
      <label>Mot de passe</label>
      <div class="input-password">
        <input formControlName="password" [type]="showPwd() ? 'text' : 'password'"
               class="form-control" placeholder="Min. 8 caractères"
               [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
        <button type="button" class="pwd-toggle" (click)="toggleShowPwd()">
          {{ showPwd() ? '🙈' : '👁️' }}
        </button>
      </div>
      <!-- Indicateur force MDP -->
      <div class="pwd-strength" *ngIf="registerForm.get('password')?.value">
        <div class="strength-bar" [style.width]="passwordStrength() + '%'"
             [ngClass]="'strength-' + passwordLevel()"></div>
        <span class="strength-label">{{ passwordLabel() }}</span>
      </div>
    </div>
    <button type="submit" class="btn btn-primary btn-full" [disabled]="loading() || registerForm.invalid">
      <span *ngIf="loading()" class="spinner"></span>
      {{ loading() ? 'Inscription...' : "S'inscrire" }}
    </button>
    <p class="terms-note">En vous inscrivant, vous acceptez nos
      <a href="/terms">Conditions d'utilisation</a> et notre
      <a href="/privacy">Politique de confidentialité</a>.
    </p>
  </form>
</div>
  `,
  styles: [`
    .auth-wrap {
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 2rem 1rem; background: linear-gradient(160deg, #f0faf0 0%, #fff 60%);
    }
    .auth-logo {
      display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;
    }
    .logo-circle {
      width: 56px; height: 56px; border-radius: 50%;
      box-shadow: 0 4px 20px rgba(45,125,45,0.3);
    }
    .logo-title { font-size: 1.75rem; color: #2D7D2D; margin: 0; }
    .logo-sub { font-size: 0.8rem; color: #666; margin: 0; }
    .auth-tabs {
      display: flex; background: #e8f5e8; border-radius: 50px; padding: 4px;
      margin-bottom: 1.5rem; width: 100%; max-width: 420px;
    }
    .tab-btn {
      flex: 1; padding: 0.6rem; border: none; border-radius: 50px; cursor: pointer;
      font-weight: 500; background: transparent; color: #555; transition: all 0.25s;
      &.active { background: white; color: #2D7D2D; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    }
    .auth-form {
      width: 100%; max-width: 420px;
      background: white; border-radius: 20px; padding: 2rem;
      box-shadow: 0 8px 40px rgba(45,125,45,0.12);
    }
    .input-password { position: relative; }
    .input-password .form-control { padding-right: 2.5rem; }
    .pwd-toggle {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 1rem;
    }
    .pwd-strength { margin-top: 0.4rem; display: flex; align-items: center; gap: 0.5rem; }
    .strength-bar {
      height: 4px; border-radius: 4px; transition: width 0.3s ease, background 0.3s ease;
      &.strength-weak   { background: #C0392B; }
      &.strength-medium { background: #E67E22; }
      &.strength-strong { background: #27AE60; }
    }
    .strength-label { font-size: 0.75rem; color: #666; }
    .forgot-link { display: block; text-align: right; color: #1A3A6B; font-size: 0.875rem; margin-bottom: 1rem; text-decoration: none; }
    .terms-note { font-size: 0.75rem; color: #888; text-align: center; margin-top: 1rem; a { color: #2D7D2D; } }
    .field-error { color: #C0392B; font-size: 0.75rem; margin-top: 0.25rem; display: block; }
    .spinner {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.5); border-top-color: white;
      border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  mode = signal<'login' | 'register'>('login');
  loading = signal(false);
  showPwd = signal(false);

  zones = ['Bastos', 'Ngousso', 'Biyem-Assi', 'Essos', 'Cité Verte', 'Mvan',
    'Marché Central', 'Nlongkak', 'Ekounou', 'Tsinga', 'Mfandena'];

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    zone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  passwordStrength(): number {
    const pwd = this.registerForm.get('password')?.value || '';
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pwd)) score += 25;
    return score;
  }

  passwordLevel(): string {
    const s = this.passwordStrength();
    if (s <= 25) return 'weak';
    if (s <= 50) return 'medium';
    return 'strong';
  }

  passwordLabel(): string {
    return { weak: 'Faible', medium: 'Moyen', strong: 'Fort' }[this.passwordLevel()] || '';
  }

  toggleShowPwd(): void {
    this.showPwd.update(v => !v);
  }

  doLogin(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    const { email, password } = this.loginForm.value;
    this.auth.login(email!, password!).subscribe({
      next: (res: any) => {
        if (res.data?.requires_2fa) {
          this.router.navigate(['/auth/2fa'], { queryParams: { email } });
        } else {
          this.toast.success('Bienvenue !', `Connecté en tant que ${res.data?.user?.name}`);
          const role = res.data?.user?.role;
          this.router.navigate(role === 'citizen' ? ['/app/map'] : ['/admin/dashboard']);
        }
      },
      error: (err: any) => { this.toast.error('Connexion échouée', err.message); this.loading.set(false); },
      complete: () => this.loading.set(false),
    });
  }

  doRegister(): void {
    if (this.registerForm.invalid) return;
    this.loading.set(true);
    this.auth.register(this.registerForm.value).subscribe({
      next: () => {
        this.toast.success('Inscription réussie !', 'Vérifiez votre email pour activer votre compte.');
        this.router.navigate(['/app/map']);
      },
      error: (err: any) => { this.toast.error('Erreur inscription', err.message); this.loading.set(false); },
      complete: () => this.loading.set(false),
    });
  }
}
