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
            <div class="report-icon">
              <i [class]="categoryIcon(report.category)" style="font-size: 28px;"></i>
            </div>
            <div class="report-info">
              <h4>{{ report.title }}</h4>
              <p>{{ report.zone }} · {{ formatDate(report.createdAt) }}</p>
              <div class="report-meta">
                <span class="badge" [ngClass]="priorityClass(report.priority)">{{ report.priority }}</span>
                <span class="badge" [ngClass]="statusClass(report.status)">{{ statusLabel(report.status) }}</span>
              </div>
            </div>
            <i class="ri-arrow-right-line" style="font-size: 16px; color: var(--text-light);"></i>
          </a>
        } @empty {
          <div class="empty-state">
            <i class="ri-clipboard-line" style="font-size: 56px;"></i>
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

  constructor(private reportService: ReportService) { }

  ngOnInit() {
    this.reportService.getReports().subscribe({
      next: (res) => { this.reports.set(res.data || []); this.loading.set(false); },
      error: () => {
        // Mock data fallback for demo
        this.reports.set([
          { _id: '1', title: 'Débordement bac central', category: 'overflow', zone: 'Bastos', priority: 'high', status: 'pending', createdAt: new Date().toISOString() },
          { _id: '2', title: 'Dépôt sauvage rue 12', category: 'illegal_dump', zone: 'Mvan', priority: 'medium', status: 'in_progress', createdAt: new Date(Date.now() - 86400000).toISOString() },
          { _id: '3', title: 'Odeur nauséabonde', category: 'odor', zone: 'Bastos', priority: 'low', status: 'resolved', createdAt: new Date(Date.now() - 172800000).toISOString() }
        ]);
        this.loading.set(false);
      }
    });
  }

  categoryIcon(cat: string): string {
    return { overflow: 'ri-delete-bin-line', damage: 'ri-hammer-line', illegal_dump: 'ri-landscape-line', odor: 'ri-mask-line', pest: 'ri-bug-line', other: 'ri-question-line' }[cat] || 'ri-clipboard-line';
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
