import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReportService } from '../../../core/services/api.services';

@Component({
  selector: 'app-report-detail', standalone: true, imports: [CommonModule, RouterLink],
  template: `
    <div class="report-detail-page">
      <!-- Header -->
      <div class="detail-header">
        <button class="back-btn" routerLink="/reports">
          <i class="ri-arrow-left-line" style="font-size: 20px;"></i>
        </button>
        <h1>Détails du signalement</h1>
      </div>

      @if (report()) {
        <div class="detail-content">
          <!-- Main info card -->
          <div class="info-card">
            <div class="card-header">
              <div class="category-icon" [style.background-color]="categoryColor(report().category)">
                <i [class]="categoryIcon(report().category)" style="font-size: 24px; color: #fff;"></i>
              </div>
              <div class="header-text">
                <h2>{{ report().title }}</h2>
                <p class="report-id">#{{ report().reportId }}</p>
              </div>
            </div>

            <p class="description">{{ report().description }}</p>

            <div class="badges">
              <span class="badge" [ngClass]="statusClass(report().status)">
                <i [class]="statusIcon(report().status)" style="font-size: 12px; margin-right: 4px;"></i>
                {{ statusLabel(report().status) }}
              </span>
              <span class="badge badge-gray">
                <i class="ri-map-pin-line" style="font-size: 12px; margin-right: 4px;"></i>
                {{ report().zone }}
              </span>
              <span class="badge badge-gray">
                <i class="ri-calendar-line" style="font-size: 12px; margin-right: 4px;"></i>
                {{ formatDate(report().createdAt) }}
              </span>
            </div>

            @if (report().photos?.length) {
              <div class="photos-section">
                <h4>Photos</h4>
                <div class="photos-grid">
                  @for (p of report().photos; track p) {
                    <img [src]="p" class="photo-thumb" [alt]="report().title">
                  }
                </div>
              </div>
            }

            <!-- Location info -->
            <div class="location-section">
              <h4>
                <i class="ri-map-pin-2-line" style="font-size: 18px; margin-right: 8px;"></i>
                Localisation
              </h4>
              <p>{{ report().address || 'Adresse non spécifiée' }}</p>
              @if (report().coordinates) {
                <p class="coordinates">
                  {{ report().coordinates.lat }}, {{ report().coordinates.lng }}
                </p>
              }
            </div>
          </div>

          <!-- Status history -->
          <div class="history-card">
            <h3>Historique du statut</h3>
            <div class="timeline">
              @for (h of report().statusHistory; track h.timestamp) {
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <strong>{{ statusLabel(h.status) }}</strong>
                      <span class="timeline-date">{{ formatDateTime(h.timestamp) }}</span>
                    </div>
                    @if (h.note) {
                      <p class="timeline-note">{{ h.note }}</p>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="actions-card">
            <button class="action-btn primary">
              <i class="ri-chat-3-line" style="font-size: 18px; margin-right: 8px;"></i>
              Contacter le support
            </button>
            <button class="action-btn secondary">
              <i class="ri-share-line" style="font-size: 18px; margin-right: 8px;"></i>
              Partager
            </button>
          </div>
        </div>
      } @else {
        <div class="loading-state">
          <i class="ri-loader-4-line" style="font-size: 48px; color: var(--primary);"></i>
          <p>Chargement...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .report-detail-page {
      min-height: 100vh;
      background: var(--bg-soft);
      padding-bottom: 24px;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      padding-top: calc(16px + env(safe-area-inset-top));
      background: var(--bg);
      border-bottom: 1px solid var(--border-light);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--bg-soft);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text);
    }

    .detail-header h1 {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }

    .detail-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-card, .history-card, .actions-card {
      background: var(--bg);
      border-radius: 16px;
      padding: 20px;
      box-shadow: var(--shadow-soft);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .category-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-text h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }

    .report-id {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    .description {
      font-size: 15px;
      line-height: 1.7;
      color: var(--text);
      margin-bottom: 16px;
    }

    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-success { background: var(--success-soft); color: var(--success); }
    .badge-warning { background: var(--warning-soft); color: var(--warning); }
    .badge-info { background: var(--info-soft); color: var(--info); }
    .badge-danger { background: var(--error-soft); color: var(--error); }
    .badge-gray { background: var(--bg-soft); color: var(--text-muted); }

    .photos-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--border-light);
    }

    .photos-section h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .photos-grid {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .photo-thumb {
      width: 100px;
      height: 100px;
      border-radius: 12px;
      object-fit: cover;
      cursor: pointer;
    }

    .location-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-light);
    }

    .location-section h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }

    .location-section p {
      font-size: 14px;
      color: var(--text-muted);
      margin: 4px 0;
    }

    .coordinates {
      font-size: 12px;
      font-family: monospace;
    }

    .history-card h3 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .timeline-item {
      display: flex;
      gap: 12px;
    }

    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--primary);
      flex-shrink: 0;
      margin-top: 4px;
    }

    .timeline-content {
      flex: 1;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .timeline-header strong {
      font-size: 14px;
      font-weight: 600;
    }

    .timeline-date {
      font-size: 12px;
      color: var(--text-muted);
    }

    .timeline-note {
      font-size: 13px;
      color: var(--text-muted);
      margin: 4px 0 0 0;
    }

    .actions-card {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all var(--transition);
    }

    .action-btn.primary {
      background: var(--primary);
      color: #fff;
    }

    .action-btn.primary:hover {
      opacity: 0.9;
    }

    .action-btn.secondary {
      background: var(--bg-soft);
      color: var(--text);
      border: 1px solid var(--border);
    }

    .action-btn.secondary:hover {
      background: var(--border);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;
    }

    .loading-state p {
      font-size: 14px;
      color: var(--text-muted);
    }
  `]
})
export class ReportDetailComponent implements OnInit {
  report = signal<any>(null);
  constructor(private reportService: ReportService, private route: ActivatedRoute) { }
  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.reportService.getReport(id).subscribe({
      next: (res) => this.report.set(res.data),
      error: () => {
        // Fallback to mock data
        this.report.set(this.getMockReport(id));
      }
    });
  }

  getMockReport(id: string) {
    return {
      _id: id,
      reportId: 'REP-' + id,
      title: 'Poubelle débordante',
      description: 'La poubelle située près du marché central est pleine et déborde sur la voie publique. Cela crée une nuisance olfactive et risque de propagation de maladies.',
      category: 'overflow',
      status: 'pending',
      zone: 'Centre-ville',
      address: 'Marché Central, Yaoundé',
      coordinates: { lat: 3.8667, lng: 11.5167 },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      photos: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200'],
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Signalement créé' },
        { status: 'assigned', timestamp: new Date(Date.now() - 43200000).toISOString(), note: 'Assigné à l\'équipe de collecte' }
      ]
    };
  }

  categoryIcon(cat: string): string {
    const icons: any = {
      overflow: 'ri-delete-bin-2-line',
      damage: 'ri-hammer-line',
      illegal_dump: 'ri-prohibited-line',
      odor: 'ri-mask-line',
      pest: 'ri-bug-line',
      other: 'ri-file-list-line'
    };
    return icons[cat] || 'ri-file-list-line';
  }

  categoryColor(cat: string): string {
    const colors: any = {
      overflow: '#FF9500',
      damage: '#FF3B30',
      illegal_dump: '#AF52DE',
      odor: '#5856D6',
      pest: '#8E8E93',
      other: '#2C7A3E'
    };
    return colors[cat] || '#2C7A3E';
  }

  statusIcon(s: string): string {
    const icons: any = {
      pending: 'ri-time-line',
      assigned: 'ri-user-follow-line',
      in_progress: 'ri-loader-4-line',
      resolved: 'ri-check-line',
      cancelled: 'ri-close-line'
    };
    return icons[s] || 'ri-question-line';
  }

  statusLabel(s: string): string {
    const labels: any = {
      pending: 'En attente',
      assigned: 'Assigné',
      in_progress: 'En cours',
      resolved: 'Résolu',
      cancelled: 'Annulé'
    };
    return labels[s] || s;
  }

  statusClass(s: string): string {
    const classes: any = {
      pending: 'badge-warning',
      assigned: 'badge-info',
      in_progress: 'badge-info',
      resolved: 'badge-success',
      cancelled: 'badge-gray'
    };
    return classes[s] || 'badge-gray';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
