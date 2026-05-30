import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../core/services/api.services';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h2 style="font-size:20px">Mes signalements</h2>
        <a routerLink="/reports/new" class="btn btn-primary btn-sm">+ Nouveau</a>
      </div>

      @if (loading()) {
        @for (s of [1,2,3]; track s) { <div class="shimmer" style="height:90px;border-radius:14px;margin-bottom:12px"></div> }
      } @else {
        @for (report of reports(); track report._id) {
          <a class="report-card animate-slide-up" [routerLink]="'/reports/' + report._id">
            <div class="report-icon">{{ categoryIcon(report.category) }}</div>
            <div class="report-info">
              <h4>{{ report.title }}</h4>
              <p>{{ report.zone }} · {{ formatDate(report.createdAt) }}</p>
              <div class="report-meta">
                <span class="badge" [ngClass]="priorityClass(report.priority)">{{ report.priority }}</span>
                <span class="badge" [ngClass]="statusClass(report.status)">{{ statusLabel(report.status) }}</span>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        } @empty {
          <div class="empty-state">
            <span>📋</span>
            <p>Aucun signalement. <a routerLink="/reports/new">Créer le premier</a></p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .report-card { display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:14px;padding:14px 16px;box-shadow:var(--shadow-sm);margin-bottom:12px;text-decoration:none;color:var(--text);transition:all var(--transition);&:active{transform:scale(0.98)} }
    .report-icon { font-size:28px;flex-shrink:0; }
    .report-info { flex:1;min-width:0; h4{font-size:14px;font-weight:700;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} p{font-size:12px;color:var(--text-muted);margin-bottom:6px} }
    .report-meta { display:flex;gap:6px; }
    .empty-state { text-align:center;padding:60px 20px;span{font-size:56px;display:block;margin-bottom:16px}p{color:var(--text-muted)} a{color:var(--primary);font-weight:600} }
  `]
})
export class ReportsComponent implements OnInit {
  reports = signal<any[]>([]);
  loading = signal(true);

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.reportService.getReports().subscribe({
      next: (res) => { this.reports.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  categoryIcon(cat: string): string {
    return { overflow: '🗑️', damage: '🔨', illegal_dump: '🚯', odor: '😷', pest: '🐀', other: '❓' }[cat] || '📋';
  }

  priorityClass(p: string): string {
    return { low: 'badge-success', medium: 'badge-info', high: 'badge-warning', critical: 'badge-danger' }[p] || 'badge-gray';
  }

  statusClass(s: string): string {
    return { pending: 'badge-warning', assigned: 'badge-info', in_progress: 'badge-info', resolved: 'badge-success', cancelled: 'badge-gray' }[s] || 'badge-gray';
  }

  statusLabel(s: string): string {
    return { pending: 'En attente', assigned: 'Assigné', in_progress: 'En cours', resolved: 'Résolu', cancelled: 'Annulé' }[s] || s;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}
