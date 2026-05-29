/**
 * BINOVA — App Shell Citoyen
 * Fichier : src/app/shared/components/app-shell.component.ts
 */

import { Component, inject as inj, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="shell">
  <!-- Toast notifications -->
  <div class="toast-container">
    <div class="toast" *ngFor="let t of toastService.toasts()" [class]="t.type"
         (click)="toastService.remove(t.id)">
      <span class="toast-icon">{{ toastIcons[t.type] }}</span>
      <div>
        <p class="toast-title">{{ t.title }}</p>
        <p class="toast-body" *ngIf="t.body">{{ t.body }}</p>
      </div>
    </div>
  </div>

  <!-- Vue principale -->
  <main class="shell-main">
    <router-outlet></router-outlet>
  </main>

  <!-- Barre de navigation bottom -->
  <nav class="bottom-nav">
    <a routerLink="/app/map" routerLinkActive="active" class="nav-item">
      <div class="nav-icon">🗺️</div>
      <span>Carte</span>
    </a>
    <a routerLink="/app/dashboard" routerLinkActive="active" class="nav-item">
      <div class="nav-icon">🏠</div>
      <span>Accueil</span>
    </a>
    <a routerLink="/app/report" routerLinkActive="active" class="nav-item nav-item-report">
      <div class="nav-fab">📢</div>
    </a>
    <a routerLink="/app/notifications" routerLinkActive="active" class="nav-item">
      <div class="nav-icon">
        🔔
        <span class="notif-badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
      </div>
      <span>Alertes</span>
    </a>
    <a routerLink="/app/sensibilisation" routerLinkActive="active" class="nav-item">
      <div class="nav-icon">🌿</div>
      <span>Infos</span>
    </a>
  </nav>
</div>
  `,
  styles: [`
    .shell { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .shell-main { flex: 1; overflow-y: auto; }

    .bottom-nav {
      height: 68px; background: white; border-top: 1px solid #e8f5e8;
      display: grid; grid-template-columns: repeat(5, 1fr); align-items: center;
      padding: 0 0.5rem; box-shadow: 0 -4px 20px rgba(45,125,45,0.08); z-index: 100;
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
      text-decoration: none; color: #888; font-size: 0.65rem; padding: 0.5rem 0;
      transition: all 0.2s;
      &.active { color: #2D7D2D; }
      &.active .nav-icon { transform: translateY(-2px); }
    }
    .nav-icon { font-size: 1.375rem; position: relative; }
    .notif-badge {
      position: absolute; top: -4px; right: -6px;
      background: #C0392B; color: white; border-radius: 50%;
      width: 16px; height: 16px; font-size: 10px;
      display: flex; align-items: center; justify-content: center;
      animation: badge-count 0.3s both;
    }
    .nav-item-report { position: relative; }
    .nav-fab {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #2D7D2D, #1A3A6B);
      box-shadow: 0 4px 16px rgba(45,125,45,0.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; margin-top: -16px; transition: all 0.2s;
      &:hover { transform: scale(1.1) translateY(-2px); }
    }

    .toast-container {
      position: fixed; top: 1rem; right: 1rem; z-index: 9999;
      display: flex; flex-direction: column; gap: 0.5rem; max-width: 320px;
    }
    .toast {
      background: white; border-radius: 12px; padding: 0.875rem 1rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; gap: 0.75rem;
      cursor: pointer; animation: slide-in-right 0.3s both; border-left: 3px solid;
      &.success { border-color: #27AE60; }
      &.warning { border-color: #E67E22; }
      &.error   { border-color: #C0392B; }
      &.info    { border-color: #1A3A6B; }
    }
    .toast-icon { font-size: 1.25rem; flex-shrink: 0; }
    .toast-title { font-size: 0.875rem; font-weight: 600; margin: 0; }
    .toast-body { font-size: 0.8rem; color: #666; margin: 0.1rem 0 0; }
    @keyframes slide-in-right { from { opacity:0; transform: translateX(100%); } to { opacity:1; transform: translateX(0); } }
    @keyframes badge-count { 0%{transform:scale(1)} 30%{transform:scale(1.4)} 60%{transform:scale(0.9)} 100%{transform:scale(1)} }
  `]
})
export class AppShellComponent {
  readonly toastService = inj(ToastService);
  private auth = inj(AuthService);
  unreadCount = signal(0);
  readonly toastIcons: Record<string, string> = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
}
