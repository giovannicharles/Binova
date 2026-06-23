import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BinService } from '../../../core/services/api.services';
import { MockDataService } from '../../../core/services/mock-data.service';

@Component({
  selector: 'app-bin-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bin-detail-page">
      <!-- Header -->
      <div class="detail-header">
        <a class="back-btn" routerLink="/bins">
          <i class="ri-arrow-left-line" style="font-size: 20px;"></i>
        </a>
        <div class="header-content">
          <h1>{{ bin()?.name || 'Chargement...' }}</h1>
          <p class="subtitle">{{ bin()?.address }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="shimmer" style="height: 200px; border-radius: var(--radius-lg); margin-bottom: 16px;"></div>
          <div class="shimmer" style="height: 150px; border-radius: var(--radius-lg);"></div>
        </div>
      } @else if (bin()) {
        <!-- Status Card -->
        <div class="status-card" [class.status-critical]="bin().fillLevel >= 80">
          <div class="status-icon">
            <i [class]="statusIcon()" style="font-size: 32px;"></i>
          </div>
          <div class="status-content">
            <div class="status-label">État actuel</div>
            <div class="status-text">{{ statusLabel() }}</div>
          </div>
          <div class="fill-percentage" [style.color]="binColor()">
            {{ bin().fillLevel }}%
          </div>
        </div>

        <!-- Fill Level Chart -->
        <div class="info-card">
          <h3 class="card-title">Niveau de remplissage</h3>
          <div class="fill-visual">
            <div class="fill-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" stroke-width="8"/>
                <circle cx="50" cy="50" r="40" fill="none" [attr.stroke]="binColor()" stroke-width="8"
                        stroke-dasharray="251.2"
                        [attr.stroke-dashoffset]="251.2 - (251.2 * bin().fillLevel / 100)"
                        transform="rotate(-90 50 50)"
                        class="fill-progress"/>
              </svg>
              <div class="fill-center">
                <span class="fill-number">{{ bin().fillLevel }}%</span>
                <span class="fill-text">rempli</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="info-card">
          <h3 class="card-title">Informations</h3>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-icon">
                <i class="ri-map-pin-line" style="font-size: 20px;"></i>
              </div>
              <div class="detail-content">
                <div class="detail-label">Zone</div>
                <div class="detail-value">{{ bin().zone }}</div>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">
                <i class="ri-delete-bin-line" style="font-size: 20px;"></i>
              </div>
              <div class="detail-content">
                <div class="detail-label">Type de déchet</div>
                <div class="detail-value">{{ bin().wasteType }}</div>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">
                <i class="ri-battery-line" style="font-size: 20px;"></i>
              </div>
              <div class="detail-content">
                <div class="detail-label">Batterie</div>
                <div class="detail-value">{{ bin().battery }}%</div>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">
                <i class="ri-database-2-line" style="font-size: 20px;"></i>
              </div>
              <div class="detail-content">
                <div class="detail-label">Capacité</div>
                <div class="detail-value">{{ bin().capacity }}L</div>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">
                <i class="ri-time-line" style="font-size: 20px;"></i>
              </div>
              <div class="detail-content">
                <div class="detail-label">Dernière lecture</div>
                <div class="detail-value">{{ formatTime(bin().lastReading) }}</div>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">
                <i class="ri-barcode-line" style="font-size: 20px;"></i>
              </div>
              <div class="detail-content">
                <div class="detail-label">ID Bac</div>
                <div class="detail-value">{{ bin().binId }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alert Thresholds -->
        <div class="info-card">
          <h3 class="card-title">Seuils d'alerte</h3>
          <div class="thresholds">
            <div class="threshold-item">
              <div class="threshold-label">Attention</div>
              <div class="threshold-bar">
                <div class="threshold-fill warning" [style.width.%]="(bin().thresholdAttention / bin().capacity) * 100"></div>
              </div>
              <div class="threshold-value">{{ bin().thresholdAttention }}%</div>
            </div>
            <div class="threshold-item">
              <div class="threshold-label">Critique</div>
              <div class="threshold-bar">
                <div class="threshold-fill critical" [style.width.%]="(bin().thresholdCritical / bin().capacity) * 100"></div>
              </div>
              <div class="threshold-value">{{ bin().thresholdCritical }}%</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-card">
          <a class="action-btn primary" routerLink="/map">
            <i class="ri-map-pin-line" style="font-size: 20px;"></i>
            Voir sur la carte
          </a>
          <a class="action-btn secondary" routerLink="/reports/new">
            <i class="ri-clipboard-line" style="font-size: 20px;"></i>
            Signaler un problème
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .bin-detail-page {
      padding: 16px;
      min-height: 100dvh;
      background: var(--bg-soft);
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
      text-decoration: none;
      box-shadow: var(--shadow-sm);
    }

    .header-content {
      flex: 1;
      h1 { font-size: 20px; font-weight: 800; margin: 0 0 4px 0; }
      .subtitle { font-size: 13px; color: var(--text-muted); margin: 0; }
    }

    .status-card {
      background: var(--bg);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      box-shadow: var(--shadow-sm);

      &.status-critical {
        border: 2px solid var(--error);
      }
    }

    .status-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primary-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }

    .status-content {
      flex: 1;
      .status-label { font-size: 12px; color: var(--text-muted); font-weight: 600; }
      .status-text { font-size: 16px; font-weight: 700; color: var(--text); }
    }

    .fill-percentage {
      font-size: 28px;
      font-weight: 800;
    }

    .info-card {
      background: var(--bg);
      border-radius: var(--radius-lg);
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: var(--shadow-sm);
    }

    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin: 0 0 16px 0;
    }

    .fill-visual {
      display: flex;
      justify-content: center;
      padding: 20px 0;
    }

    .fill-circle {
      position: relative;
      width: 150px;
      height: 150px;
    }

    .fill-progress {
      transition: stroke-dashoffset 0.5s ease;
    }

    .fill-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      .fill-number { font-size: 28px; font-weight: 800; display: block; }
      .fill-text { font-size: 12px; color: var(--text-muted); }
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .detail-item {
      display: flex;
      gap: 12px;
    }

    .detail-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--primary-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      flex-shrink: 0;
    }

    .detail-content {
      .detail-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }
      .detail-value { font-size: 14px; font-weight: 600; color: var(--text); }
    }

    .thresholds {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .threshold-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .threshold-label {
      width: 80px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .threshold-bar {
      flex: 1;
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
    }

    .threshold-fill {
      height: 100%;
      border-radius: 4px;
      &.warning { background: var(--warning); }
      &.critical { background: var(--error); }
    }

    .threshold-value {
      width: 40px;
      font-size: 13px;
      font-weight: 700;
      text-align: right;
    }

    .actions-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px;
      border-radius: var(--radius-lg);
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition);

      &.primary {
        background: var(--primary);
        color: #fff;
        &:hover { opacity: 0.9; }
      }

      &.secondary {
        background: var(--bg);
        color: var(--text);
        border: 1px solid var(--border);
        &:hover { background: var(--bg-soft); }
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .shimmer {
      background: linear-gradient(90deg, var(--bg-soft) 25%, var(--border) 50%, var(--bg-soft) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class BinDetailComponent implements OnInit {
  bin = signal<any>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private binService: BinService,
    private mockDataService: MockDataService
  ) { }

  ngOnInit() {
    const binId = this.route.snapshot.paramMap.get('id');
    if (binId) {
      this.loadBin(binId);
    }
  }

  loadBin(id: string) {
    this.binService.getBin(id).subscribe({
      next: (res: any) => {
        this.bin.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        // Use mock data
        const mockBins = this.mockDataService.getMockBins();
        const bin = mockBins.find(b => b._id === id) || mockBins[0];
        this.bin.set(bin);
        this.loading.set(false);
      }
    });
  }

  statusIcon(): string {
    if (!this.bin()) return 'ri-loader-line';
    if (this.bin().status === 'offline') return 'ri-wifi-off-line';
    if (this.bin().fillLevel >= 95) return 'ri-error-warning-line';
    if (this.bin().fillLevel >= 80) return 'ri-alarm-warning-line';
    return 'ri-checkbox-circle-line';
  }

  statusLabel(): string {
    if (!this.bin()) return 'Chargement...';
    if (this.bin().status === 'offline') return 'Hors ligne';
    if (this.bin().fillLevel >= 95) return 'Critique';
    if (this.bin().fillLevel >= 80) return 'Attention';
    return 'Normal';
  }

  binColor(): string {
    if (!this.bin()) return 'var(--text-muted)';
    if (this.bin().status === 'offline') return '#94A3B8';
    if (this.bin().fillLevel >= 95) return 'var(--error)';
    if (this.bin().fillLevel >= 80) return 'var(--warning)';
    return 'var(--primary)';
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)} h`;
    return `Il y a ${Math.floor(diff / 1440)} j`;
  }
}
