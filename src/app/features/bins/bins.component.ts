import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BinService } from '../../core/services/api.services';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-bins',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bins-page">
      <!-- Header -->
      <div class="page-header">
        <h1>Bacs dans votre zone</h1>
        <p class="subtitle">{{ bins().length }} bacs disponibles</p>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        <button class="filter-tab" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
          Tous
        </button>
        <button class="filter-tab" [class.active]="activeFilter() === 'nearby'" (click)="setFilter('nearby')">
          Proches
        </button>
        <button class="filter-tab" [class.active]="activeFilter() === 'critical'" (click)="setFilter('critical')">
          Critiques
        </button>
      </div>

      <!-- Bins list -->
      @if (loading()) {
        <div class="bins-list">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="bin-card skeleton"></div>
          }
        </div>
      } @else {
        <div class="bins-list">
          @for (bin of filteredBins(); track bin._id) {
            <div class="bin-card" [class.bin-critical]="bin.fillLevel >= 80" routerLink="/bins/{{ bin._id }}">
              <div class="bin-header">
                <div class="bin-name">{{ bin.name }}</div>
                <div class="bin-status" [class]="statusClass(bin)">
                  {{ statusLabel(bin) }}
                </div>
              </div>
              
              <div class="bin-info">
                <div class="info-row">
                  <i class="ri-map-pin-line" style="font-size: 16px; color: var(--text-muted);"></i>
                  <span>{{ bin.address }}</span>
                </div>
                <div class="info-row">
                  <i class="ri-delete-bin-line" style="font-size: 16px; color: var(--text-muted);"></i>
                  <span>{{ bin.wasteType }}</span>
                </div>
              </div>

              <div class="fill-section">
                <div class="fill-label">
                  <span>Niveau de remplissage</span>
                  <span class="fill-value" [style.color]="binColor(bin)">{{ bin.fillLevel }}%</span>
                </div>
                <div class="fill-bar">
                  <div class="fill-bar-inner" 
                       [class]="fillClass(bin.fillLevel)"
                       [style.width.%]="bin.fillLevel"></div>
                </div>
              </div>

              <div class="bin-footer">
                <div class="stat">
                  <i class="ri-battery-line" style="font-size: 14px;"></i>
                  <span>{{ bin.battery }}%</span>
                </div>
                <div class="stat">
                  <i class="ri-time-line" style="font-size: 14px;"></i>
                  <span>{{ formatTime(bin.lastReading) }}</span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <i class="ri-delete-bin-line" style="font-size: 48px; color: var(--text-muted);"></i>
              <p>Aucun bac trouvé</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .bins-page {
      padding: 16px;
      min-height: 100dvh;
      background: var(--bg-soft);
    }

    .page-header {
      margin-bottom: 20px;
      h1 { font-size: 24px; font-weight: 800; margin: 0 0 4px 0; }
      .subtitle { font-size: 14px; color: var(--text-muted); margin: 0; }
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .filter-tab {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition);

      &.active {
        background: var(--primary);
        color: #fff;
        border-color: var(--primary);
      }
    }

    .bins-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bin-card {
      background: var(--bg);
      border-radius: var(--radius-lg);
      padding: 16px;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: all var(--transition);
      text-decoration: none;
      display: block;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow);
      }

      &.bin-critical {
        border: 2px solid var(--error);
      }
    }

    .bin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .bin-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
    }

    .bin-status {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 12px;
      text-transform: uppercase;

      &.status-ok {
        background: var(--success-soft);
        color: var(--success);
      }

      &.status-attention {
        background: var(--warning-soft);
        color: var(--warning);
      }

      &.status-critical {
        background: var(--error-soft);
        color: var(--error);
      }

      &.status-offline {
        background: var(--border);
        color: var(--text-muted);
      }
    }

    .bin-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-muted);
    }

    .fill-section {
      margin-bottom: 12px;
    }

    .fill-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .fill-value {
      font-weight: 700;
    }

    .fill-bar {
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
    }

    .fill-bar-inner {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .fill-low { background: var(--primary); }
    .fill-medium { background: var(--warning); }
    .fill-high { background: var(--error); }

    .bin-footer {
      display: flex;
      gap: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--border-light);
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .skeleton {
      height: 140px;
      background: linear-gradient(90deg, var(--bg-soft) 25%, var(--border) 50%, var(--bg-soft) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: var(--text-muted);
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class BinsComponent implements OnInit {
  bins = signal<any[]>([]);
  loading = signal(true);
  activeFilter = signal('all');

  constructor(
    private binService: BinService,
    private mockDataService: MockDataService
  ) { }

  ngOnInit() {
    this.loadBins();
  }

  loadBins() {
    this.binService.getBins().subscribe({
      next: (res) => {
        this.bins.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        // Use mock data
        this.bins.set(this.mockDataService.getMockBins());
        this.loading.set(false);
      }
    });
  }

  setFilter(filter: string) {
    this.activeFilter.set(filter);
  }

  filteredBins() {
    const bins = this.bins();
    const filter = this.activeFilter();

    if (filter === 'all') return bins;
    if (filter === 'critical') return bins.filter(b => b.fillLevel >= 80);
    if (filter === 'nearby') return bins.filter(b => b.fillLevel < 50);
    return bins;
  }

  statusClass(bin: any): string {
    if (bin.status === 'offline') return 'status-offline';
    if (bin.fillLevel >= 95) return 'status-critical';
    if (bin.fillLevel >= 80) return 'status-attention';
    return 'status-ok';
  }

  statusLabel(bin: any): string {
    if (bin.status === 'offline') return 'Hors ligne';
    if (bin.fillLevel >= 95) return 'Critique';
    if (bin.fillLevel >= 80) return 'Attention';
    return 'OK';
  }

  fillClass(level: number): string {
    if (level >= 80) return 'fill-high';
    if (level >= 50) return 'fill-medium';
    return 'fill-low';
  }

  binColor(bin: any): string {
    if (bin.status === 'offline') return '#94A3B8';
    if (bin.fillLevel >= 95) return 'var(--error)';
    if (bin.fillLevel >= 80) return 'var(--warning)';
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
