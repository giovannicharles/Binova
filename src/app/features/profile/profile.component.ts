import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/api.services';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="profile-page">
      <!-- Header -->
      <div class="profile-header">
        <div class="avatar-section">
          @if (user()?.avatarUrl) {
            <img [src]="user()?.avatarUrl" class="avatar-large" [alt]="user()?.name">
          } @else {
            <div class="avatar-placeholder-large">
              {{ user()?.name?.charAt(0)?.toUpperCase() }}
            </div>
          }
          <div class="level-badge">{{ user()?.level || 'Bronze' }}</div>
        </div>
        <h2>{{ user()?.name }}</h2>
        <p class="user-zone">📍 {{ user()?.zone }}</p>
        <div class="role-chip">{{ roleLabel() }}</div>

        <!-- Points bar -->
        <div class="points-section">
          <div class="points-display">
            <span class="pts-num">{{ user()?.points || 0 }}</span>
            <span class="pts-label">points</span>
          </div>
          <div class="fill-bar" style="margin-top: 8px">
            <div class="fill-bar-inner fill-low" [style.width.%]="pointsProgress()"></div>
          </div>
          <div class="level-labels">
            <span>{{ user()?.level }}</span>
            <span>{{ nextLevel() }}</span>
          </div>
        </div>
      </div>

      <!-- Badges -->
      <div class="section">
        <h3 class="section-title">Mes badges</h3>
        <div class="badges-grid">
          @for (badge of allBadges; track badge.id) {
            <div class="badge-item" [class.earned]="hasBadge(badge.id)">
              <div class="badge-icon">{{ badge.icon }}</div>
              <span class="badge-name">{{ badge.name }}</span>
              @if (!hasBadge(badge.id)) {
                <span class="badge-locked">🔒</span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Info personnelles -->
      <div class="section">
        <h3 class="section-title">Informations personnelles</h3>
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">CNI</span>
            <span class="info-value cni">{{ user()?.cniMasked || '***' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Téléphone</span>
            <span class="info-value">{{ maskPhone(user()?.phone) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">{{ user()?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Zone</span>
            <span class="info-value">{{ user()?.zone }}</span>
          </div>
        </div>
      </div>

      <!-- Sécurité -->
      <div class="section">
        <h3 class="section-title">Sécurité</h3>

        <!-- Change password -->
        <div class="settings-card">
          <button class="settings-row" (click)="toggleChangePwd()">
            <span class="settings-icon">🔐</span>
            <span class="settings-label">Changer le mot de passe</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path [attr.d]="showChangePwd() ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'"/>
            </svg>
          </button>

          @if (showChangePwd()) {
            <div class="pwd-form animate-slide-up">
              @if (pwdError()) {
                <div class="alert-error-sm">{{ pwdError() }}</div>
              }
              @if (pwdSuccess()) {
                <div class="alert-success-sm">✅ Mot de passe modifié !</div>
              }
              <input class="form-control" type="password" [(ngModel)]="pwdForm.current" placeholder="Mot de passe actuel">
              <input class="form-control" type="password" [(ngModel)]="pwdForm.new" placeholder="Nouveau mot de passe">
              <input class="form-control" type="password" [(ngModel)]="pwdForm.confirm" placeholder="Confirmer">
              <button class="btn btn-primary btn-sm btn-full" (click)="changePassword()" [disabled]="pwdLoading()">
                Modifier
              </button>
            </div>
          }
        </div>

        <!-- 2FA (admins/collecteurs) -->
        @if (canUse2FA()) {
          <div class="settings-card" style="margin-top: 12px">
            <div class="settings-row">
              <span class="settings-icon">🛡️</span>
              <span class="settings-label">Authentification 2FA</span>
              <div class="toggle" [class.on]="user()?.twoFactorEnabled" (click)="toggle2FA()"></div>
            </div>
            @if (qrCode()) {
              <div class="qr-section animate-pop-in">
                <img [src]="qrCode()" class="qr-code" alt="QR Code 2FA">
                <p>Scannez avec Google Authenticator ou Authy</p>
                <input class="form-control" type="text" [(ngModel)]="totpCode" placeholder="Entrez le code (6 chiffres)" maxlength="6" inputmode="numeric">
                <button class="btn btn-primary btn-sm btn-full" (click)="confirm2FA()" [disabled]="totpCode.length < 6">
                  Confirmer l'activation
                </button>
              </div>
            }
            @if (backupCodes().length > 0) {
              <div class="backup-codes animate-slide-up">
                <p><strong>Codes de sauvegarde (à conserver précieusement) :</strong></p>
                <div class="codes-grid">
                  @for (code of backupCodes(); track code) {
                    <code>{{ code }}</code>
                  }
                </div>
                <button class="btn btn-outline btn-sm btn-full" style="margin-top: 12px" (click)="copyBackupCodes()">
                  Copier les codes
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Préférences -->
      <div class="section">
        <h3 class="section-title">Notifications</h3>
        <div class="settings-card">
          @for (pref of notifPrefs; track pref.key) {
            <div class="settings-row">
              <span class="settings-icon">{{ pref.icon }}</span>
              <span class="settings-label">{{ pref.label }}</span>
              <div class="toggle" [class.on]="getNotifPref(pref.key)"
                   (click)="toggleNotifPref(pref.key)"></div>
            </div>
          }
        </div>
      </div>

      <!-- Classement opt-in -->
      <div class="section">
        <div class="settings-card">
          <div class="settings-row">
            <span class="settings-icon">🏆</span>
            <span class="settings-label">Participer au classement du quartier</span>
            <div class="toggle" [class.on]="rankingOptIn()" (click)="toggleRanking()"></div>
          </div>
        </div>
      </div>

      <!-- Déconnexion -->
      <div class="section" style="padding-bottom: 40px">
        <button class="btn btn-danger btn-full" (click)="logout()">
          Se déconnecter
        </button>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { background: var(--bg-soft); min-height: 100dvh; }

    .profile-header {
      background: linear-gradient(160deg, var(--primary) 0%, var(--primary-light) 60%, #00D2FF 100%);
      padding: 32px 24px 40px;
      text-align: center; color: #fff;
    }

    .avatar-section { position: relative; display: inline-block; margin-bottom: 16px; }

    .avatar-large, .avatar-placeholder-large {
      width: 88px; height: 88px; border-radius: 50%;
      border: 4px solid rgba(255,255,255,0.5);
      object-fit: cover;
    }

    .avatar-placeholder-large {
      background: rgba(255,255,255,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 36px; font-weight: 800;
    }

    .level-badge {
      position: absolute; bottom: 0; right: -8px;
      background: linear-gradient(135deg, #F59E0B, #FCD34D);
      color: #fff; font-size: 11px; font-weight: 800;
      padding: 4px 8px; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .profile-header h2 { font-size: 24px; font-weight: 800; }
    .user-zone { font-size: 14px; opacity: 0.85; margin: 6px 0; }

    .role-chip {
      display: inline-block; background: rgba(255,255,255,0.2);
      padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
      margin-bottom: 20px;
    }

    .points-section { max-width: 280px; margin: 0 auto; }

    .points-display {
      display: flex; align-items: baseline; gap: 6px; justify-content: center;
      .pts-num { font-size: 32px; font-weight: 800; }
      .pts-label { font-size: 14px; opacity: 0.8; }
    }

    .level-labels {
      display: flex; justify-content: space-between;
      font-size: 11px; opacity: 0.8; margin-top: 4px;
    }

    .section { padding: 20px 16px 0; }

    .section-title {
      font-size: 14px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;
    }

    .badges-grid {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
    }

    .badge-item {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      position: relative; opacity: 0.4;
      &.earned { opacity: 1; }
    }

    .badge-icon {
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--primary-50); border: 2px solid var(--primary-100);
      display: flex; align-items: center; justify-content: center; font-size: 24px;
      transition: all 0.3s;
      .badge-item.earned & { background: linear-gradient(135deg, var(--primary), var(--primary-light)); border-color: transparent; animation: pop-in 0.4s ease; }
    }

    .badge-name { font-size: 10px; font-weight: 600; color: var(--text-muted); text-align: center; }
    .badge-locked { position: absolute; top: 0; right: 0; font-size: 12px; }

    .info-card, .settings-card {
      background: var(--bg); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm); overflow: hidden;
    }

    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid var(--border-light);
      &:last-child { border-bottom: none; }
    }

    .info-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
    .info-value { font-size: 14px; font-weight: 600; color: var(--text); }
    .info-value.cni { font-family: monospace; letter-spacing: 2px; }

    .settings-row {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; width: 100%; text-align: left;
      background: none; border: none; border-bottom: 1px solid var(--border-light);
      cursor: pointer; transition: background 0.2s;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--bg-soft); }
    }

    .settings-icon { font-size: 20px; flex-shrink: 0; }
    .settings-label { flex: 1; font-size: 14px; font-weight: 600; color: var(--text); }

    .toggle {
      width: 48px; height: 28px; border-radius: 14px; background: var(--border);
      position: relative; cursor: pointer; transition: background 0.3s; flex-shrink: 0;
      &::after {
        content: ''; position: absolute; top: 3px; left: 3px;
        width: 22px; height: 22px; border-radius: 50%;
        background: #fff; transition: transform 0.3s;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
      &.on { background: var(--primary); &::after { transform: translateX(20px); } }
    }

    .pwd-form {
      padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      border-top: 1px solid var(--border-light);
    }

    .alert-error-sm {
      background: #FEF2F2; color: #DC2626;
      padding: 8px 12px; border-radius: 8px; font-size: 12px;
    }

    .alert-success-sm {
      background: #DCFCE7; color: #166534;
      padding: 8px 12px; border-radius: 8px; font-size: 12px;
    }

    .qr-section {
      padding: 16px; text-align: center; border-top: 1px solid var(--border-light);
      .qr-code { width: 180px; height: 180px; border-radius: 12px; margin: 0 auto 12px; display: block; }
      p { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
    }

    .backup-codes {
      padding: 16px; border-top: 1px solid var(--border-light);
      p { font-size: 13px; color: var(--text); margin-bottom: 10px; }
    }

    .codes-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
      code {
        background: var(--bg-soft); padding: 8px 12px; border-radius: 8px;
        font-size: 13px; font-family: monospace; text-align: center;
        color: var(--primary); font-weight: 700;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  user = this.authService.user;
  showChangePwd = signal(false);
  qrCode = signal('');
  backupCodes = signal<string[]>([]);
  totpCode = '';
  pwdLoading = signal(false);
  pwdError = signal('');
  pwdSuccess = signal(false);
  rankingOptIn = signal(false);

  pwdForm = { current: '', new: '', confirm: '' };

  allBadges = [
    { id: 'eco-starter', name: 'Éco Starter', icon: '🌱' },
    { id: 'recycleur', name: 'Recycleur', icon: '♻️' },
    { id: 'champion-vert', name: 'Champion Vert', icon: '🏆' },
    { id: 'gardien-urbain', name: 'Gardien Urbain', icon: '🛡️' },
    { id: 'ambassadeur', name: 'Ambassadeur', icon: '🌍' }
  ];

  notifPrefs = [
    { key: 'binAlerts', label: 'Alertes bacs', icon: '🗑️' },
    { key: 'reportUpdates', label: 'Mises à jour signalements', icon: '📋' },
    { key: 'collections', label: 'Passages collecte', icon: '🚛' },
    { key: 'awareness', label: 'Sensibilisation', icon: '📰' }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.rankingOptIn.set((this.user() as any)?.rankingOptIn || false);
  }

  toggleChangePwd() {
    this.showChangePwd.update(v => !v);
  }

  roleLabel(): string {
    const roles: Record<string, string> = {
      citizen: 'Citoyen',
      collector: 'Collecteur',
      admin_municipal: 'Admin Municipal',
      admin: 'Administrateur',
      super_admin: 'Super Admin'
    };
    return roles[this.user()?.role || ''] || 'Citoyen';
  }

  pointsProgress(): number {
    const pts = this.user()?.points || 0;
    if (pts >= 5000) return 100;
    if (pts >= 2000) return ((pts - 2000) / 3000) * 100;
    if (pts >= 500) return ((pts - 500) / 1500) * 100;
    return (pts / 500) * 100;
  }

  nextLevel(): string {
    const lvl = this.user()?.level;
    return { Bronze: 'Argent', Argent: 'Or', Or: 'Platine', Platine: '🏅' }[lvl || 'Bronze'] || 'Argent';
  }

  hasBadge(id: string): boolean {
    return (this.user()?.badges || []).some((b: any) => b.id === id);
  }

  maskPhone(phone?: string): string {
    if (!phone) return '—';
    return phone.substring(0, 6) + '****' + phone.substring(phone.length - 2);
  }

  canUse2FA(): boolean {
    return this.authService.hasRole('admin', 'super_admin', 'collector', 'admin_municipal');
  }

  changePassword() {
    if (this.pwdForm.new !== this.pwdForm.confirm) {
      this.pwdError.set('Les mots de passe ne correspondent pas');
      return;
    }
    this.pwdLoading.set(true);
    this.pwdError.set('');
    this.authService.changePassword(this.pwdForm.current, this.pwdForm.new, this.pwdForm.confirm).subscribe({
      next: () => {
        this.pwdLoading.set(false);
        this.pwdSuccess.set(true);
        this.pwdForm = { current: '', new: '', confirm: '' };
        setTimeout(() => this.pwdSuccess.set(false), 3000);
      },
      error: (err) => {
        this.pwdLoading.set(false);
        this.pwdError.set(err.error?.message || 'Erreur');
      }
    });
  }

  toggle2FA() {
    if ((this.user() as any)?.twoFactorEnabled) {
      const pwd = prompt('Entrez votre mot de passe pour désactiver la 2FA :');
      if (!pwd) return;
      this.authService.disable2FA(pwd).subscribe({
        next: () => this.authService.getMe().subscribe()
      });
    } else {
      this.authService.enable2FA().subscribe({
        next: (res) => this.qrCode.set(res.qrCode)
      });
    }
  }

  confirm2FA() {
    this.authService.verify2FA(this.totpCode).subscribe({
      next: (res) => {
        this.qrCode.set('');
        this.backupCodes.set(res.backupCodes);
        this.authService.getMe().subscribe();
      }
    });
  }

  copyBackupCodes() {
    navigator.clipboard.writeText(this.backupCodes().join('\n'));
  }

  getNotifPref(key: string): boolean {
    return (this.user() as any)?.notificationPreferences?.[key] ?? true;
  }

  toggleNotifPref(key: string) {
    const prefs = { ...((this.user() as any)?.notificationPreferences || {}), [key]: !this.getNotifPref(key) };
    this.userService.updateProfile({ notificationPreferences: prefs }).subscribe({
      next: () => this.authService.getMe().subscribe()
    });
  }

  toggleRanking() {
    this.rankingOptIn.update(v => !v);
    this.userService.updateProfile({ rankingOptIn: this.rankingOptIn() }).subscribe();
  }

  logout() {
    this.authService.logout();
  }
}