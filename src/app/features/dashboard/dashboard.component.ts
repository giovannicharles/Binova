import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatsService } from '../../core/services/api.services';
import { BinService } from '../../core/services/api.services';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/auth/auth.service';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Welcome Banner -->
      <div class="welcome-banner animate-slide-up">
        <div class="welcome-text">
          <span class="greeting">{{ greeting() }}</span>
          <h2>{{ user()?.name?.split(' ')?.[0] }}</h2>
          <p>{{ user()?.zone }} · Niveau {{ user()?.level }}</p>
        </div>
        <div class="points-pill">
          <i class="ri-star-line points-icon" style="font-size: 20px;"></i>
          <span class="points-val">{{ user()?.points || 0 }}</span>
          <span class="points-label">pts</span>
        </div>
      </div>

      <!-- Alert Banner (si bacs critiques) -->
      @if (criticalCount() > 0) {
        <div class="alert-banner animate-pop-in" routerLink="/map">
          <span class="alert-pulse"></span>
          <div>
            <strong>
              <i class="ri-error-warning-line" style="font-size: 18px;"></i>
              {{ criticalCount() }} bac{{ criticalCount() > 1 ? 's critiques' : ' critique' }}
            </strong>
            <p>dans votre zone — Voir la carte</p>
          </div>
          <i class="ri-arrow-right-line" style="font-size: 20px;"></i>
        </div>
      }

      <!-- KPI Grid -->
      <div class="kpi-grid">
        @if (loading()) {
          @for (s of [1,2,3,4]; track s) {
            <div class="shimmer kpi-skeleton"></div>
          }
        } @else {
          <div class="kpi-card delay-1">
            <div class="kpi-icon" style="background: #DCFCE7; color: #16A34A">
              <i class="ri-delete-bin-line" style="font-size: 28px;"></i>
            </div>
            <div class="kpi-value">{{ stats()?.bins?.total || 0 }}</div>
            <div class="kpi-label">Bacs connectés</div>
          </div>
          <div class="kpi-card delay-2">
            <div class="kpi-icon" style="background: #FEF3C7; color: #D97706">
              <i class="ri-bar-chart-box-line" style="font-size: 28px;"></i>
            </div>
            <div class="kpi-value">{{ stats()?.bins?.avgFillLevel || 0 }}<span class="kpi-unit">%</span></div>
            <div class="kpi-label">Remplissage moyen</div>
          </div>
          <div class="kpi-card delay-3">
            <div class="kpi-icon" style="background: #FEE2E2; color: #DC2626">
              <i class="ri-alarm-warning-line" style="font-size: 28px;"></i>
            </div>
            <div class="kpi-value">{{ stats()?.reports?.pending || 0 }}</div>
            <div class="kpi-label">Signalements en attente</div>
          </div>
          <div class="kpi-card delay-4">
            <div class="kpi-icon" style="background: #DBEAFE; color: #2563EB">
              <i class="ri-check-double-line" style="font-size: 28px;"></i>
            </div>
            <div class="kpi-value">{{ stats()?.reports?.resolvedToday || 0 }}</div>
            <div class="kpi-label">Résolus aujourd'hui</div>
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div class="section-title">Actions rapides</div>
      <div class="quick-actions">
        <a class="action-card" routerLink="/map">
          <div class="action-icon" style="background: var(--primary-100); color: var(--primary)">
            <i class="ri-map-pin-line" style="font-size: 28px;"></i>
          </div>
          <span>Voir la carte</span>
        </a>
        <a class="action-card" routerLink="/reports">
          <div class="action-icon" style="background: var(--warning-soft); color: var(--warning)">
            <i class="ri-file-list-3-line" style="font-size: 28px;"></i>
          </div>
          <span>Mes signalements</span>
        </a>
        <a class="action-card" routerLink="/awareness">
          <div class="action-icon" style="background: var(--info-soft); color: var(--info)">
            <i class="ri-book-open-line" style="font-size: 28px;"></i>
          </div>
          <span>Sensibilisation</span>
        </a>
        <a class="action-card" routerLink="/chat">
          <div class="action-icon" style="background: var(--purple-soft); color: var(--purple)">
            <i class="ri-chat-3-line" style="font-size: 28px;"></i>
          </div>
          <span>Support</span>
        </a>
      </div>

      <!-- Floating Action Button -->
      <a class="fab" routerLink="/reports/new" aria-label="Créer un signalement">
        <i class="ri-add-line" style="font-size: 32px;"></i>
      </a>

      <!-- Bacs proches -->
      <div class="section-title">
        Bacs dans votre zone
        <a routerLink="/map" class="see-all">Voir tout →</a>
      </div>

      @if (binsLoading()) {
        <div class="bins-list">
          @for (s of [1,2,3]; track s) {
            <div class="shimmer bin-skeleton"></div>
          }
        </div>
      } @else {
        <div class="bins-list">
          @for (bin of nearbyBins(); track bin._id) {
            <div class="bin-card animate-slide-up" [class.bin-alert]="bin.fillLevel >= 80">
              <div class="bin-status-dot" [style.background]="binColor(bin)"></div>
              <div class="bin-info">
                <div class="bin-name">{{ bin.name }}</div>
                <div class="bin-zone">{{ bin.zone }} · {{ bin.wasteType }}</div>
                <div class="fill-bar" style="margin-top: 8px">
                  <div class="fill-bar-inner"
                       [class]="fillClass(bin.fillLevel)"
                       [style.width.%]="bin.fillLevel">
                  </div>
                </div>
              </div>
              <div class="bin-level" [style.color]="binColor(bin)">
                {{ bin.fillLevel }}<span style="font-size:11px">%</span>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <span>🗑️</span>
              <p>Aucun bac trouvé dans votre zone</p>
            </div>
          }
        </div>
      }

      <!-- Fill 7 days chart -->
      <div class="section-title">
        Remplissage — 7 derniers jours
      </div>
      <div class="chart-card">
        @if (fillTrend().length > 0) {
          <div class="chart-container">
            <canvas #fillTrendChart></canvas>
          </div>
        } @else {
          <div class="no-data">Données insuffisantes</div>
        }
      </div>

      <!-- Contribution chart -->
      <div class="section-title">
        Vos contributions
      </div>
      <div class="chart-card">
        <div class="chart-container">
          <canvas #contributionChart></canvas>
        </div>
      </div>

      <div style="height: 24px"></div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 16px 16px 24px; }

    .welcome-banner {
      background: var(--primary);
      border-radius: var(--radius-xl);
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      color: #fff;
    }

    .greeting { font-size: 13px; opacity: 0.85; display: block; margin-bottom: 4px; }
    .welcome-banner h2 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    .welcome-banner p { font-size: 13px; opacity: 0.8; }

    .points-pill {
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 10px 16px;
      text-align: center;
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 64px;
    }

    .points-icon { font-size: 20px; }
    .points-val { font-size: 22px; font-weight: 800; line-height: 1.2; }
    .points-label { font-size: 11px; opacity: 0.8; }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #FF9500, #FF3B30);
      border-radius: var(--radius-lg);
      padding: 14px 16px;
      color: #fff;
      margin-bottom: 20px;
      cursor: pointer;
      position: relative;
      overflow: hidden;

      p { font-size: 12px; opacity: 0.9; margin-top: 2px; }
      strong { font-size: 14px; }

      svg { margin-left: auto; flex-shrink: 0; }
    }

    .alert-pulse {
      width: 12px; height: 12px;
      border-radius: 50%;
      background: #fff;
      animation: pulse-green 1.5s infinite;
      flex-shrink: 0;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .kpi-skeleton {
      height: 100px;
      border-radius: var(--radius-lg);
    }

    .kpi-card {
      background: var(--bg);
      border-radius: var(--radius-lg);
      padding: 16px;
      box-shadow: var(--shadow-sm);
      animation: slide-up 0.4s ease both;

      .kpi-icon {
        width: 40px; height: 40px;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        margin-bottom: 10px;
      }

      .kpi-value {
        font-size: 26px; font-weight: 800;
        color: var(--text); line-height: 1;
        margin-bottom: 4px;
      }

      .kpi-unit { font-size: 14px; font-weight: 600; color: var(--text-muted); }
      .kpi-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 12px;
    }

    .see-all { font-size: 13px; color: var(--primary); font-weight: 600; }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: var(--text);
      cursor: pointer;

      .action-icon {
        width: 56px; height: 56px;
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 26px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        transition: transform 0.2s;

        &:active { transform: scale(0.92); }
      }

      span { font-size: 11px; font-weight: 600; color: var(--text-muted); }
    }

    .bins-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }

    .bin-skeleton { height: 80px; border-radius: var(--radius); }

    .bin-card {
      background: var(--bg);
      border-radius: var(--radius);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition);

      &.bin-alert { border-left: 3px solid var(--alert-orange); }
    }

    .bin-status-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .bin-info { flex: 1; min-width: 0; }
    .bin-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bin-zone { font-size: 12px; color: var(--text-muted); text-transform: capitalize; }

    .bin-level {
      font-size: 18px; font-weight: 800;
      flex-shrink: 0;
      min-width: 48px;
      text-align: right;
    }

    .empty-state {
      text-align: center; padding: 32px;
      span { font-size: 48px; display: block; margin-bottom: 12px; }
      p { color: var(--text-muted); font-size: 14px; }
    }

    .chart-card {
      background: var(--bg);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      margin-bottom: 8px;
    }

    .mini-chart {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 100px;
    }

    .chart-bar-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      gap: 6px;
    }

    .chart-bar {
      width: 100%;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.8s cubic-bezier(0.4,0,0.2,1);
    }

    .fill-low { background: var(--primary); }
    .fill-medium { background: var(--warning); }
    .fill-high { background: var(--error); }

    .chart-label { font-size: 10px; color: var(--text-muted); font-weight: 500; }
    .no-data { text-align: center; color: var(--text-muted); font-size: 14px; padding: 24px; }

    .chart-container {
      position: relative;
      height: 200px;
      padding: 10px;
    }

    .fab {
      position: fixed;
      bottom: calc(80px + var(--safe-bottom));
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(44, 122, 62, 0.4);
      transition: all var(--transition);
      z-index: 100;
      text-decoration: none;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 24px rgba(44, 122, 62, 0.5);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  user = this.authService.user;
  stats = signal<any>(null);
  nearbyBins = signal<any[]>([]);
  fillTrend = signal<any[]>([]);
  loading = signal(true);
  binsLoading = signal(true);
  criticalCount = signal(0);

  @ViewChild('fillTrendChart') fillTrendChart!: ElementRef;
  @ViewChild('contributionChart') contributionChart!: ElementRef;

  private fillTrendChartInstance: any;
  private contributionChartInstance: any;

  private subs: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private statsService: StatsService,
    private binService: BinService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
    this.socketService.connect();

    // Écouter les mises à jour en temps réel
    this.subs.push(
      this.socketService.on<any>('bin:update').subscribe(({ bin }) => {
        const bins = this.nearbyBins();
        const idx = bins.findIndex(b => b._id === bin._id);
        if (idx !== -1) {
          const updated = [...bins];
          updated[idx] = bin;
          this.nearbyBins.set(updated);
        }
        this.updateCriticalCount();
      }),
      this.socketService.on<any>('stats:live').subscribe((data) => {
        this.criticalCount.set(data.binsAlert || 0);
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  ngAfterViewInit() {
    if (!this.loading()) {
      this.initCharts();
    }
  }

  initCharts() {
    // Initialize fill trend chart
    if (this.fillTrendChart && this.fillTrend().length > 0) {
      const ctx = this.fillTrendChart.nativeElement.getContext('2d');
      this.fillTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.fillTrend().map(p => this.formatDay(p.date)),
          datasets: [{
            label: 'Remplissage moyen (%)',
            data: this.fillTrend().map(p => p.avgFill),
            borderColor: '#2C7A3E',
            backgroundColor: 'rgba(44, 122, 62, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => ` Remplissage: ${ctx.parsed.y}%`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: {
                font: { family: 'Plus Jakarta Sans', size: 11 },
                callback: (value: any) => value + '%'
              }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
            }
          }
        }
      });
    }

    // Initialize contribution chart
    if (this.contributionChart) {
      const ctx = this.contributionChart.nativeElement.getContext('2d');
      this.contributionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Signalements', 'Collectes', 'Sensibilisation'],
          datasets: [{
            data: [12, 8, 5],
            backgroundColor: [
              'rgba(44, 122, 62, 0.85)',
              'rgba(0, 210, 255, 0.85)',
              'rgba(245, 158, 11, 0.85)'
            ],
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: 'Plus Jakarta Sans', size: 11 },
                padding: 12,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  const total = (ctx.dataset.data as number[]).reduce((a, v) => a + v, 0);
                  const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
                  return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  loadData() {
    this.loading.set(true);
    this.binsLoading.set(true);

    this.statsService.getDashboard().subscribe({
      next: (res) => { this.stats.set(res.data); this.loading.set(false); },
      error: () => {
        // Mock data fallback for demo
        this.stats.set({
          bins: { total: 42, avgFillLevel: 67, critical: 3 },
          reports: { pending: 5, resolvedToday: 12 }
        });
        this.loading.set(false);
      }
    });

    const zone = this.user()?.zone;
    this.binService.getBins(zone ? { zone } : {}).subscribe({
      next: (res) => {
        this.nearbyBins.set(res.data?.slice(0, 5) || []);
        this.binsLoading.set(false);
        this.updateCriticalCount();
      },
      error: () => {
        // Mock data fallback for demo
        this.nearbyBins.set([
          { _id: '1', name: 'BAC-001', fillLevel: 85, status: 'online', zone: 'Bastos' },
          { _id: '2', name: 'BAC-002', fillLevel: 45, status: 'online', zone: 'Bastos' },
          { _id: '3', name: 'BAC-003', fillLevel: 97, status: 'online', zone: 'Bastos' },
          { _id: '4', name: 'BAC-004', fillLevel: 32, status: 'online', zone: 'Bastos' },
          { _id: '5', name: 'BAC-005', fillLevel: 68, status: 'offline', zone: 'Bastos' }
        ]);
        this.binsLoading.set(false);
        this.updateCriticalCount();
      }
    });

    this.statsService.getFillTrend(7).subscribe({
      next: (res) => {
        this.fillTrend.set(res.data || []);
        this.loading.set(false);
        this.binsLoading.set(false);
        this.cdr.detectChanges();
        setTimeout(() => this.initCharts(), 100);
      },
      error: () => {
        // Mock data fallback for demo
        const today = new Date();
        this.fillTrend.set(Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split('T')[0],
            avgFill: Math.floor(Math.random() * 40) + 50
          };
        }));
        this.loading.set(false);
        this.binsLoading.set(false);
        this.cdr.detectChanges();
        setTimeout(() => this.initCharts(), 100);
      }
    });
  }

  updateCriticalCount() {
    this.criticalCount.set(
      this.nearbyBins().filter(b => b.fillLevel >= 95 || b.status === 'offline').length
    );
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bonne après-midi';
    return 'Bonsoir';
  }

  binColor(bin: any): string {
    if (bin.status === 'offline' || bin.status === 'maintenance') return '#94A3B8';
    if (bin.fillLevel >= 95) return '#FF3B30';
    if (bin.fillLevel >= 80) return '#FF9500';
    return '#16A34A';
  }

  fillClass(level: number): string {
    if (level >= 80) return 'fill-high';
    if (level >= 50) return 'fill-medium';
    return 'fill-low';
  }

  formatDay(dateStr: string): string {
    const days = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
    return days[new Date(dateStr).getDay()];
  }
}
