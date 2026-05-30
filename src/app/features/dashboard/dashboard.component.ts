import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatsService } from '../../core/services/api.services';
import { BinService } from '../../core/services/api.services';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/auth/auth.service';
import { Subscription } from 'rxjs';

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
          <h2>{{ user()?.name?.split(' ')?.[0] }} 👋</h2>
          <p>{{ user()?.zone }} · Niveau {{ user()?.level }}</p>
        </div>
        <div class="points-pill">
          <span class="points-icon">⭐</span>
          <span class="points-val">{{ user()?.points || 0 }}</span>
          <span class="points-label">pts</span>
        </div>
      </div>

      <!-- Alert Banner (si bacs critiques) -->
      @if (criticalCount() > 0) {
        <div class="alert-banner animate-pop-in" routerLink="/map">
          <span class="alert-pulse"></span>
          <div>
            <strong>⚠️ {{ criticalCount() }} bac{{ criticalCount() > 1 ? 's critiques' : ' critique' }}</strong>
            <p>dans votre zone — Voir la carte</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
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
            <div class="kpi-icon" style="background: #DCFCE7; color: #16A34A">🗑️</div>
            <div class="kpi-value">{{ stats()?.bins?.total || 0 }}</div>
            <div class="kpi-label">Bacs connectés</div>
          </div>
          <div class="kpi-card delay-2">
            <div class="kpi-icon" style="background: #FEF3C7; color: #D97706">📊</div>
            <div class="kpi-value">{{ stats()?.bins?.avgFillLevel || 0 }}<span class="kpi-unit">%</span></div>
            <div class="kpi-label">Remplissage moyen</div>
          </div>
          <div class="kpi-card delay-3">
            <div class="kpi-icon" style="background: #FEE2E2; color: #DC2626">🚨</div>
            <div class="kpi-value">{{ stats()?.reports?.pending || 0 }}</div>
            <div class="kpi-label">Signalements en attente</div>
          </div>
          <div class="kpi-card delay-4">
            <div class="kpi-icon" style="background: #DBEAFE; color: #2563EB">✅</div>
            <div class="kpi-value">{{ stats()?.reports?.resolvedToday || 0 }}</div>
            <div class="kpi-label">Résolus aujourd'hui</div>
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div class="section-title">Actions rapides</div>
      <div class="quick-actions">
        <a class="action-card" routerLink="/reports/new">
          <div class="action-icon" style="background: linear-gradient(135deg, #2C7A3E, #16A34A)">📋</div>
          <span>Signaler</span>
        </a>
        <a class="action-card" routerLink="/map">
          <div class="action-icon" style="background: linear-gradient(135deg, #00A0C6, #00D2FF)">🗺️</div>
          <span>Carte</span>
        </a>
        <a class="action-card" routerLink="/chat">
          <div class="action-icon" style="background: linear-gradient(135deg, #7C3AED, #A78BFA)">💬</div>
          <span>Support</span>
        </a>
        <a class="action-card" routerLink="/awareness">
          <div class="action-icon" style="background: linear-gradient(135deg, #D97706, #F59E0B)">📰</div>
          <span>Sensibilisation</span>
        </a>
      </div>

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
          <div class="mini-chart">
            @for (point of fillTrend(); track point.date) {
              <div class="chart-bar-wrap">
                <div class="chart-bar" [style.height.%]="point.avgFill"
                     [class]="fillClass(point.avgFill)">
                </div>
                <span class="chart-label">{{ formatDay(point.date) }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="no-data">Données insuffisantes</div>
        }
      </div>

      <div style="height: 24px"></div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 16px 16px 24px; }

    .welcome-banner {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 60%, #00D2FF 100%);
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

    .fill-low { background: linear-gradient(180deg, var(--primary-light), var(--primary)); }
    .fill-medium { background: linear-gradient(180deg, #FCD34D, var(--warning)); }
    .fill-high { background: linear-gradient(180deg, #F87171, var(--error)); }

    .chart-label { font-size: 10px; color: var(--text-muted); font-weight: 500; }
    .no-data { text-align: center; color: var(--text-muted); font-size: 14px; padding: 24px; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  user = this.authService.user;
  stats = signal<any>(null);
  nearbyBins = signal<any[]>([]);
  fillTrend = signal<any[]>([]);
  loading = signal(true);
  binsLoading = signal(true);
  criticalCount = signal(0);

  private subs: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private statsService: StatsService,
    private binService: BinService,
    private socketService: SocketService
  ) {}

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

  loadData() {
    this.loading.set(true);
    this.binsLoading.set(true);

    this.statsService.getDashboard().subscribe({
      next: (res) => { this.stats.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });

    const zone = this.user()?.zone;
    this.binService.getBins(zone ? { zone } : {}).subscribe({
      next: (res) => {
        this.nearbyBins.set(res.data?.slice(0, 5) || []);
        this.binsLoading.set(false);
        this.updateCriticalCount();
      },
      error: () => this.binsLoading.set(false)
    });

    this.statsService.getFillTrend(7).subscribe({
      next: (res) => this.fillTrend.set(res.data || [])
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
