/**
 * BINOVA — Smart Waste Management
 * Fichier : src/app/features/dashboard/dashboard-citizen.component.ts
 * Auteur  : SGAO-SARL © 2026
 * Rôle    : Dashboard citoyen — stats éco-points, badges, map mini, alertes sanitaires
 */

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';

interface Badge {
  type: string; name: string; description: string; earned_at: string; points: number;
}

@Component({
  selector: 'app-dashboard-citizen',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="dash-wrap">
  <!-- Header Hero -->
  <div class="dash-hero animate-slide-up">
    <div class="hero-content">
      <div class="hero-avatar">
        <img *ngIf="user()?.avatar_url" [src]="user()!.avatar_url" alt="Avatar">
        <span *ngIf="!user()?.avatar_url">{{ initials() }}</span>
      </div>
      <div>
        <p class="hero-greeting">Bonjour,</p>
        <h2 class="hero-name">{{ user()?.name }}</h2>
        <p class="hero-zone">📍 {{ user()?.zone || 'Yaoundé' }}</p>
      </div>
    </div>
    <div class="hero-points">
      <span class="points-value">{{ user()?.eco_points || 0 }}</span>
      <span class="points-label">éco-points</span>
    </div>
  </div>

  <!-- Stats KPIs -->
  <div class="stats-grid animate-slide-up stagger-1">
    <div class="stat-card" *ngFor="let s of statsCards()">
      <div class="stat-icon">{{ s.icon }}</div>
      <div class="stat-num">{{ s.value }}</div>
      <div class="stat-lbl">{{ s.label }}</div>
    </div>
  </div>

  <!-- Actions rapides -->
  <div class="quick-actions animate-slide-up stagger-2">
    <h3 class="section-title">Actions rapides</h3>
    <div class="actions-grid">
      <a routerLink="/app/report" class="action-card">
        <div class="action-icon action-report">📢</div>
        <span>Signaler</span>
      </a>
      <a routerLink="/app/map" class="action-card">
        <div class="action-icon action-map">🗺️</div>
        <span>Carte bacs</span>
      </a>
      <a routerLink="/app/chat" class="action-card">
        <div class="action-icon action-chat">💬</div>
        <span>Chat</span>
      </a>
      <a routerLink="/app/sensibilisation" class="action-card">
        <div class="action-icon action-eco">🌿</div>
        <span>S'informer</span>
      </a>
    </div>
  </div>

  <!-- Badges éco -->
  <div class="badges-section animate-slide-up stagger-3">
    <h3 class="section-title">Mes badges éco</h3>
    <div class="badges-row" *ngIf="badges().length > 0; else noBadge">
      <div class="badge-item animate-pop-in" *ngFor="let b of badges(); let i = index"
           [class]="'stagger-' + (i + 1)">
        <div class="badge-icon">{{ getBadgeEmoji(b.type) }}</div>
        <p class="badge-name">{{ b.name }}</p>
        <span class="badge-pts">+{{ b.points }} pts</span>
      </div>
    </div>
    <ng-template #noBadge>
      <div class="no-badge">
        <p>🌱 Créez votre premier signalement pour débloquer votre badge <strong>Éco Starter</strong> !</p>
        <a routerLink="/app/report" class="btn btn-primary btn-sm">Signaler maintenant</a>
      </div>
    </ng-template>
  </div>

  <!-- Mes signalements récents -->
  <div class="reports-section animate-slide-up stagger-4">
    <div class="section-header">
      <h3 class="section-title">Mes signalements</h3>
      <a routerLink="/app/reports" class="see-all">Voir tout →</a>
    </div>
    <div *ngIf="recentReports().length > 0; else noReports">
      <div class="report-item" *ngFor="let r of recentReports()">
        <div class="report-dot" [ngClass]="'dot-' + r.status"></div>
        <div class="report-info">
          <p class="report-desc">{{ r.description | slice:0:60 }}...</p>
          <span class="badge" [ngClass]="getBadgeColor(r.status)">{{ getStatusLabel(r.status) }}</span>
        </div>
        <span class="report-date">{{ r.createdAt | date:'dd MMM' }}</span>
      </div>
    </div>
    <ng-template #noReports>
      <p class="empty-text">Aucun signalement pour l'instant.</p>
    </ng-template>
  </div>

  <!-- Alerte sanitaire si existante -->
  <div class="health-alert animate-slide-up stagger-5" *ngIf="healthAlert()">
    <div class="health-icon">⚕️</div>
    <div>
      <p class="health-title">Alerte sanitaire — {{ healthAlert().quarter }}</p>
      <p class="health-msg">{{ healthAlert().message }}</p>
    </div>
  </div>
</div>
  `,
  styles: [`
    .dash-wrap { padding: 1rem; padding-bottom: 5rem; max-width: 640px; margin: 0 auto; }

    .dash-hero {
      background: linear-gradient(135deg, #2D7D2D, #1A3A6B);
      border-radius: 20px; padding: 1.5rem; color: white;
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.5rem; box-shadow: 0 8px 24px rgba(45,125,45,0.25);
    }
    .hero-content { display: flex; align-items: center; gap: 1rem; }
    .hero-avatar {
      width: 52px; height: 52px; border-radius: 50%;
      background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 700; overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .hero-greeting { opacity: 0.8; font-size: 0.875rem; margin: 0; }
    .hero-name { font-family: var(--font-title); font-size: 1.25rem; margin: 0; }
    .hero-zone { opacity: 0.7; font-size: 0.8rem; margin: 0.15rem 0 0; }
    .hero-points { text-align: center; }
    .points-value { display: block; font-size: 2rem; font-weight: 700; font-family: var(--font-title); }
    .points-label { opacity: 0.8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem;
    }
    .stat-card {
      background: white; border-radius: 12px; padding: 1rem; text-align: center;
      box-shadow: 0 2px 12px rgba(45,125,45,0.08);
    }
    .stat-icon { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .stat-num { font-size: 1.75rem; font-weight: 700; color: #2D7D2D; font-family: var(--font-title); }
    .stat-lbl { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.04em; }

    .section-title { font-size: 1rem; font-weight: 700; color: #1A1A1A; margin: 0 0 1rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .see-all { color: #2D7D2D; font-size: 0.875rem; text-decoration: none; }

    .quick-actions { margin-bottom: 1.5rem; }
    .actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
    .action-card {
      background: white; border-radius: 12px; padding: 1rem 0.5rem; text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06); text-decoration: none; color: #333;
      transition: all 0.25s; font-size: 0.75rem; font-weight: 500;
      &:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(45,125,45,0.15); }
    }
    .action-icon { font-size: 1.75rem; margin-bottom: 0.5rem; }

    .badges-section { margin-bottom: 1.5rem; }
    .badges-row { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; }
    .badge-item {
      flex-shrink: 0; background: white; border-radius: 12px; padding: 1rem;
      text-align: center; box-shadow: 0 2px 12px rgba(45,125,45,0.08); min-width: 90px;
    }
    .badge-icon { font-size: 2rem; margin-bottom: 0.25rem; }
    .badge-name { font-size: 0.75rem; font-weight: 600; color: #333; margin: 0 0 0.15rem; }
    .badge-pts { font-size: 0.7rem; color: #2D7D2D; font-weight: 600; }
    .no-badge {
      background: #f0faf0; border-radius: 12px; padding: 1.25rem; text-align: center;
      p { margin-bottom: 1rem; font-size: 0.9rem; color: #555; }
    }

    .reports-section { margin-bottom: 1.5rem; }
    .report-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem; background: white; border-radius: 10px; margin-bottom: 0.5rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    }
    .report-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .dot-pending   { background: #E67E22; }
    .dot-processing { background: #1A3A6B; }
    .dot-resolved  { background: #27AE60; }
    .dot-closed    { background: #95A5A6; }
    .report-info { flex: 1; }
    .report-desc { font-size: 0.85rem; color: #333; margin: 0 0 0.25rem; }
    .report-date { font-size: 0.75rem; color: #888; white-space: nowrap; }
    .empty-text { color: #888; font-size: 0.9rem; text-align: center; padding: 1rem; }

    .health-alert {
      display: flex; gap: 1rem; align-items: flex-start;
      background: #fef9e7; border: 1.5px solid #F5C100; border-radius: 12px; padding: 1rem;
    }
    .health-icon { font-size: 1.5rem; }
    .health-title { font-weight: 600; color: #1A1A1A; margin: 0 0 0.25rem; font-size: 0.9rem; }
    .health-msg { color: #555; font-size: 0.85rem; margin: 0; }
  `]
})
export class DashboardCitizenComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  user = this.authService.user;
  badges = signal<Badge[]>([]);
  recentReports = signal<any[]>([]);
  healthAlert = signal<any>(null);
  statsCards = signal<any[]>([]);
  private statsData = { totalReports: 0, resolvedReports: 0, ecoPoints: 0 };

  initials(): string {
    const name = this.user()?.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getBadgeEmoji(type: string): string {
    return { eco_starter: '🌱', recycler: '♻️', champion_vert: '🏆', gardien_urbain: '🛡️', ambassadeur: '🌍', analyste: '📊' }[type] || '🎖️';
  }

  getBadgeColor(status: string): string {
    return { pending: 'badge-orange', processing: 'badge-blue', resolved: 'badge-green', closed: 'badge-gray' }[status] || 'badge-gray';
  }

  getStatusLabel(status: string): string {
    return { pending: 'En attente', processing: 'En cours', resolved: 'Résolu', closed: 'Clôturé' }[status] || status;
  }

  ngOnInit(): void {
    this.api.get('/auth/me').subscribe((res: any) => {
      if (res.data) {
        this.badges.set(res.data.badges || []);
        const { totalReports, resolvedReports, ecoPoints } = res.data.stats || {};
        this.statsCards.set([
          { icon: '📋', value: totalReports || 0, label: 'Signalements' },
          { icon: '✅', value: resolvedReports || 0, label: 'Résolus' },
          { icon: '🌿', value: ecoPoints || 0, label: 'Éco-points' },
          { icon: '🏅', value: this.badges().length, label: 'Badges' },
        ]);
      }
    });
    this.api.get('/reports', { limit: 5 }).subscribe((res: any) => {
      this.recentReports.set(res.data || []);
    });
    this.api.get('/health-alerts').subscribe((res: any) => {
      const alerts = res.data || [];
      this.healthAlert.set(alerts.find((a: any) => a.zone === this.user()?.zone) || null);
    });
  }

  ngOnDestroy(): void { }
}
