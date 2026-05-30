import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReportService } from '../../../core/services/api.services';

@Component({ selector: 'app-report-detail', standalone: true, imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <a routerLink="/reports" class="back-link">← Mes signalements</a>
      @if (report()) {
        <div class="card" style="margin-top:16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <span style="font-size:32px">{{ categoryIcon(report().category) }}</span>
            <div><h3>{{ report().title }}</h3><p style="color:var(--text-muted);font-size:13px">{{ report().reportId }}</p></div>
          </div>
          <p style="color:var(--text-muted);font-size:14px;line-height:1.7;margin-bottom:16px">{{ report().description }}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="badge" [ngClass]="statusClass(report().status)">{{ statusLabel(report().status) }}</span>
            <span class="badge badge-gray">{{ report().zone }}</span>
          </div>
          @if (report().photos?.length) {
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
              @for (p of report().photos; track p) {
                <img [src]="p" style="width:80px;height:80px;border-radius:10px;object-fit:cover" [alt]="report().title">
              }
            </div>
          }
          <div style="margin-top:20px;border-top:1px solid var(--border-light);padding-top:16px">
            <h4 style="font-size:14px;margin-bottom:12px">Historique</h4>
            @for (h of report().statusHistory; track h.timestamp) {
              <div style="display:flex;gap:10px;margin-bottom:10px">
                <div style="width:8px;height:8px;border-radius:50%;background:var(--primary);margin-top:5px;flex-shrink:0"></div>
                <div><strong style="font-size:13px">{{ statusLabel(h.status) }}</strong><p style="font-size:12px;color:var(--text-muted)">{{ h.note }}</p></div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`.back-link{color:var(--primary);font-size:14px;font-weight:600;text-decoration:none}`]
})
export class ReportDetailComponent implements OnInit {
  report = signal<any>(null);
  constructor(private reportService: ReportService, private route: ActivatedRoute) {}
  ngOnInit() {
    this.reportService.getReport(this.route.snapshot.params['id']).subscribe({
      next: (res) => this.report.set(res.data)
    });
  }
  categoryIcon(cat: string): string {
    return { overflow: '🗑️', damage: '🔨', illegal_dump: '🚯', odor: '😷', pest: '🐀', other: '❓' }[cat] || '📋';
  }
  statusLabel(s: string): string {
    return { pending: 'En attente', assigned: 'Assigné', in_progress: 'En cours', resolved: 'Résolu', cancelled: 'Annulé' }[s] || s;
  }
  statusClass(s: string): string {
    return { pending: 'badge-warning', assigned: 'badge-info', in_progress: 'badge-info', resolved: 'badge-success', cancelled: 'badge-gray' }[s] || 'badge-gray';
  }
}
