/**
 * BINOVA — Smart Waste Management
 * Fichier : src/app/features/notifications/notifications.component.ts
 * Auteur  : SGAO-SARL © 2026
 * Rôle    : Alertes push temps réel, badge animé, swipe-to-dismiss
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="notif-wrap">
  <div class="notif-header">
    <h2>Notifications</h2>
    <button class="mark-all" (click)="markAllRead()" *ngIf="hasUnread()">
      Tout marquer comme lu
    </button>
  </div>

  <div *ngIf="loading()">
    <div class="notif-skeleton" *ngFor="let _ of [1,2,3,4,5]"></div>
  </div>

  <div *ngIf="!loading() && notifications().length === 0" class="empty-notif">
    <div class="empty-icon">🔔</div>
    <p>Aucune notification pour l'instant</p>
  </div>

  <div class="notif-list" *ngIf="!loading()">
    <div class="notif-item animate-slide-up" *ngFor="let n of notifications(); let i = index"
         [class.unread]="!n.is_read" [class]="'stagger-' + (i + 1)"
         (click)="markRead(n)">
      <div class="notif-icon" [ngClass]="'icon-' + getType(n)">
        {{ getNotifEmoji(n) }}
      </div>
      <div class="notif-body">
        <p class="notif-title">{{ n.message }}</p>
        <span class="notif-meta">
          <span class="notif-badge" [ngClass]="'badge-' + getSeverityColor(n.severity)">
            {{ getSeverityLabel(n.severity) }}
          </span>
          · {{ n.sent_at | date:'dd/MM HH:mm' }}
        </span>
        <!-- Info bac -->
        <p class="notif-bin" *ngIf="n.bin?.quarter">
          📍 {{ n.bin.quarter }} — {{ n.bin.code }}
        </p>
      </div>
      <div class="notif-dot" *ngIf="!n.is_read"></div>
    </div>
  </div>

  <!-- Alerte sanitaire -->
  <div class="health-banner animate-slide-up" *ngIf="healthAlerts().length > 0">
    <h3>⚕️ Alertes sanitaires actives</h3>
    <div class="health-item" *ngFor="let h of healthAlerts()">
      <strong>{{ h.quarter }}</strong> — {{ h.message }}
      <span class="badge badge-red" style="margin-left:0.5rem">{{ h.severity }}</span>
    </div>
  </div>
</div>
  `,
  styles: [`
    .notif-wrap { padding: 1rem; max-width: 640px; margin: 0 auto; padding-bottom: 5rem; }
    .notif-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    h2 { font-size: 1.375rem; margin: 0; }
    .mark-all { background: none; border: none; color: #2D7D2D; font-size: 0.875rem; cursor: pointer; text-decoration: underline; }
    .notif-skeleton { height: 70px; background: #f0f0f0; border-radius: 12px; margin-bottom: 0.5rem; animation: shimmer 1.4s infinite; background: linear-gradient(90deg, #e8f5e8 25%, #f0faf0 50%, #e8f5e8 75%); background-size: 200% 100%; }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .empty-notif { text-align: center; padding: 3rem 1rem; color: #888; .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; } }

    .notif-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 1rem; padding: 0.875rem 1rem;
      background: white; border-radius: 12px; cursor: pointer; transition: all 0.2s;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05);
      &.unread { background: #f0faf0; border-left: 3px solid #2D7D2D; }
      &:hover { transform: translateX(4px); }
    }
    .notif-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
      &.icon-critical { background: #fdecea; }
      &.icon-warning  { background: #fef3e7; }
      &.icon-info     { background: #e8f5fb; }
    }
    .notif-body { flex: 1; }
    .notif-title { margin: 0 0 0.25rem; font-size: 0.875rem; color: #333; font-weight: 500; }
    .notif-meta { font-size: 0.75rem; color: #888; display: flex; align-items: center; gap: 0.25rem; }
    .notif-bin { font-size: 0.75rem; color: #666; margin: 0.15rem 0 0; }
    .notif-badge { padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.7rem; }
    .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #2D7D2D; flex-shrink: 0; margin-top: 4px; }

    .health-banner {
      margin-top: 1.5rem; background: #fef9e7; border: 1.5px solid #F5C100;
      border-radius: 12px; padding: 1rem;
      h3 { margin: 0 0 0.75rem; font-size: 1rem; }
    }
    .health-item { font-size: 0.875rem; color: #555; padding: 0.3rem 0; border-bottom: 1px solid #fce9a0; }
    .badge-red { background: rgba(192,57,43,0.1); color: #C0392B; }
  `]
})
export class NotificationsComponent implements OnInit {
  private api = inject(ApiService);
  private socket = inject(SocketService);

  notifications = signal<any[]>([]);
  healthAlerts = signal<any[]>([]);
  loading = signal(true);

  hasUnread = () => this.notifications().some(n => !n.is_read);

  getType(n: any): string { return n.severity || 'info'; }
  getNotifEmoji(n: any): string {
    const emojiMap: Record<string, string> = { full: '🗑️', battery_low: '🔋', deodorant_low: '🌿', offline: '📡', health_risk: '⚕️' };
    return emojiMap[n.type] || '🔔';
  }
  getSeverityColor(s: string): string { return { critical: 'red', warning: 'orange', info: 'blue' }[s] || 'gray'; }
  getSeverityLabel(s: string): string { return { critical: 'Critique', warning: 'Attention', info: 'Info' }[s] || s; }

  ngOnInit(): void {
    this.api.get('/alerts').subscribe({
      next: (res: any) => { this.notifications.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get('/health-alerts').subscribe((res: any) => this.healthAlerts.set(res.data || []));
  }

  markRead(n: any): void {
    this.api.put(`/alerts/${n.id}/read`, {}).subscribe();
    this.notifications.update(list => list.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  }

  markAllRead(): void {
    this.notifications().filter(n => !n.is_read).forEach(n => this.markRead(n));
  }
}
