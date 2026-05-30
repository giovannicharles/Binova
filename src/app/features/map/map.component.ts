import { Component, OnInit, OnDestroy, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BinService } from '../../core/services/api.services';
import { SocketService } from '../../core/services/socket.service';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="map-page">
      <!-- Header -->
      <div class="map-header">
        <h1>Carte des bacs</h1>
        <div class="live-badge">
          <span class="live-dot"></span> EN DIRECT
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        @for (f of filters; track f.value) {
          <button class="filter-chip" [class.active]="activeFilter() === f.value"
                  (click)="setFilter(f.value)">
            <i [class]="f.icon" style="font-size: 16px; margin-right: 4px;"></i>
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Map -->
      <div id="map-container" class="map-container"></div>

      <!-- Selected bin panel -->
      @if (selectedBin()) {
        <div class="bin-panel animate-slide-up">
          <div class="panel-handle"></div>
          <div class="panel-header">
            <div class="status-dot" [style.background]="binColor(selectedBin())"></div>
            <div>
              <h3>{{ selectedBin().name }}</h3>
              <p>{{ selectedBin().zone }} · {{ selectedBin().address }}</p>
            </div>
            <button class="close-btn" (click)="selectedBin.set(null)">
              <i class="ri-close-line" style="font-size: 18px;"></i>
            </button>
          </div>

          <div class="panel-stats">
            <div class="stat-item">
              <span class="stat-val">{{ selectedBin().fillLevel }}%</span>
              <span class="stat-lbl">Niveau</span>
            </div>
            <div class="stat-item">
              <span class="stat-val">{{ selectedBin().openingsToday }}</span>
              <span class="stat-lbl">Ouvertures/j</span>
            </div>
            <div class="stat-item">
              <span class="stat-val">{{ selectedBin().battery }}%</span>
              <span class="stat-lbl">Batterie</span>
            </div>
          </div>

          <div class="fill-bar" style="margin: 0 0 12px">
            <div class="fill-bar-inner" [class]="fillClass(selectedBin().fillLevel)"
                 [style.width.%]="selectedBin().fillLevel"></div>
          </div>

          <div class="panel-badges">
            <span class="badge" [ngClass]="statusBadge(selectedBin()).class">
              {{ statusBadge(selectedBin()).label }}
            </span>
            @if (selectedBin().fillLevel >= 80) {
              <span class="badge badge-warning">
                <i class="ri-alarm-warning-line" style="font-size: 12px; margin-right: 2px;"></i>
                Attention
              </span>
            }
            @if (selectedBin().fillLevel >= 95) {
              <span class="badge badge-danger">
                <i class="ri-error-warning-line" style="font-size: 12px; margin-right: 2px;"></i>
                Critique
              </span>
            }
          </div>
        </div>
      }

      <!-- Legend -->
      <div class="map-legend">
        <span class="legend-item"><span class="legend-dot green"></span> OK</span>
        <span class="legend-item"><span class="legend-dot orange"></span> Attention</span>
        <span class="legend-item"><span class="legend-dot red"></span> Critique</span>
        <span class="legend-item"><span class="legend-dot gray"></span> Hors ligne</span>
      </div>
    </div>
  `,
  styles: [`
    .map-page { height: 100dvh; display: flex; flex-direction: column; position: relative; }

    .map-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: var(--bg);
      border-bottom: 1px solid var(--border-light);
      z-index: 10;

      h1 { font-size: 18px; font-weight: 800; }
    }

    .live-badge {
      display: flex; align-items: center; gap: 6px;
      background: var(--primary-50);
      color: var(--primary);
      font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 20px;
    }

    .live-dot {
      width: 8px; height: 8px;
      border-radius: 50%; background: var(--primary);
      animation: pulse-green 1.5s infinite;
    }

    .filter-bar {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      overflow-x: auto;
      background: var(--bg);
      z-index: 10;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar { display: none; }
    }

    .filter-chip {
      display: flex; align-items: center; gap: 4px;
      white-space: nowrap;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--border);
      background: var(--bg);
      color: var(--text-muted);
      font-size: 13px; font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      flex-shrink: 0;

      &.active {
        background: var(--primary);
        border-color: var(--primary);
        color: #fff;
      }
    }

    .map-container {
      flex: 1;
      z-index: 1;
    }

    .bin-panel {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: var(--bg);
      border-radius: 24px 24px 0 0;
      padding: 12px 20px 32px;
      z-index: 500;
      box-shadow: 0 -8px 40px rgba(0,0,0,0.15);
    }

    .panel-handle {
      width: 40px; height: 4px;
      background: var(--border);
      border-radius: 2px;
      margin: 0 auto 16px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;

      h3 { font-size: 16px; font-weight: 700; }
      p { font-size: 12px; color: var(--text-muted); }

      .status-dot {
        width: 12px; height: 12px;
        border-radius: 50%; flex-shrink: 0;
      }
    }

    .close-btn {
      margin-left: auto;
      background: var(--bg-soft);
      border: none;
      width: 32px; height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .panel-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 16px;
    }

    .stat-item { text-align: center; }
    .stat-val { display: block; font-size: 22px; font-weight: 800; color: var(--text); }
    .stat-lbl { font-size: 11px; color: var(--text-muted); font-weight: 500; }

    .panel-badges { display: flex; gap: 8px; flex-wrap: wrap; }

    .map-legend {
      position: absolute;
      bottom: 12px; right: 12px;
      background: rgba(255,255,255,0.95);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 10;
      box-shadow: var(--shadow);
      font-size: 12px;
      backdrop-filter: blur(8px);
    }

    .legend-item { display: flex; align-items: center; gap: 6px; color: var(--text-muted); }
    .legend-dot {
      width: 10px; height: 10px; border-radius: 50%;
      &.green { background: #16A34A; }
      &.orange { background: #FF9500; }
      &.red { background: #FF3B30; }
      &.gray { background: #94A3B8; }
    }
  `]
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedBin = signal<any>(null);
  activeFilter = signal('all');
  private map!: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private userMarker!: L.Marker;
  private subs: Subscription[] = [];

  filters = [
    { value: 'all', label: 'Tous', icon: 'ri-map-2-line' },
    { value: 'critical', label: 'Critiques', icon: 'ri-error-warning-line' },
    { value: 'attention', label: 'Attention', icon: 'ri-alarm-warning-line' },
    { value: 'ok', label: 'OK', icon: 'ri-check-line' },
    { value: 'offline', label: 'Hors ligne', icon: 'ri-wifi-off-line' }
  ];

  constructor(
    private binService: BinService,
    private socketService: SocketService
  ) { }

  ngOnInit() {
    this.socketService.connect();
    this.subs.push(
      this.socketService.on<any>('bin:update').subscribe(({ bin }) => {
        this.updateMarker(bin);
      })
    );
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.map?.remove();
  }

  initMap() {
    this.map = L.map('map-container', {
      center: [3.8667, 11.5167], // Yaoundé
      zoom: 13,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Add user position
    this.addUserPosition();

    this.loadBins();
  }

  addUserPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          const userIcon = L.divIcon({
            className: '',
            html: `
              <div style="
                width: 24px; height: 24px;
                background: #2C7A3E;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(44, 122, 62, 0.4);
                display: flex; align-items: center; justify-content: center;
              ">
                <div style="
                  width: 8px; height: 8px;
                  background: white;
                  border-radius: 50%;
                "></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          this.userMarker = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(this.map)
            .bindPopup('Votre position');
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }

  loadBins() {
    this.binService.getGeoJSON().subscribe({
      next: (res) => {
        const features = res.data?.features || [];
        features.forEach((f: any) => this.addMarker(f));
      }
    });
  }

  addMarker(feature: any) {
    const { coordinates } = feature.geometry;
    const props = feature.properties;
    const color = this.getColor(props);

    const icon = L.divIcon({
      className: '',
      html: `
        <div style="
          width: 36px; height: 36px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          display: flex; align-items: center; justify-content: center;
          ${props.fillLevel >= 80 ? 'animation: pulse-green 1.5s infinite;' : ''}
        ">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
            <div style="width: 12px; height: 12px; background: white; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -40]
    });

    const marker = L.marker([coordinates[1], coordinates[0]], { icon })
      .addTo(this.map)
      .on('click', () => {
        this.selectedBin.set(props);
      });

    this.markers.set(props.binId, marker);
  }

  updateMarker(bin: any) {
    const marker = this.markers.get(bin.binId);
    if (!marker) return;

    const color = this.binColor(bin);
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25)"><div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%"><div style="width:12px;height:12px;background:white;border-radius:50%;"></div></div></div>`,
      iconSize: [36, 36], iconAnchor: [18, 36]
    });
    marker.setIcon(icon);

    if (this.selectedBin()?.binId === bin.binId) {
      this.selectedBin.set({ ...this.selectedBin(), ...bin });
    }
  }

  getColor(props: any): string {
    if (props.status === 'offline' || props.status === 'maintenance') return '#94A3B8';
    if (props.fillLevel >= 95) return '#FF3B30';
    if (props.fillLevel >= 80) return '#FF9500';
    return '#16A34A';
  }

  binColor(bin: any): string {
    if (bin.status === 'offline' || bin.status === 'maintenance') return '#94A3B8';
    if (bin.fillLevel >= 95) return '#FF3B30';
    if (bin.fillLevel >= 80) return '#FF9500';
    return '#16A34A';
  }

  fillClass(level: number): string {
    if (level >= 80) return 'fill-bar-inner fill-high';
    if (level >= 50) return 'fill-bar-inner fill-medium';
    return 'fill-bar-inner fill-low';
  }

  statusBadge(bin: any): { label: string; class: string } {
    if (bin.status === 'offline') return { label: 'Hors ligne', class: 'badge-gray' };
    if (bin.status === 'maintenance') return { label: 'Maintenance', class: 'badge-info' };
    if (bin.status === 'full') return { label: 'Plein', class: 'badge-danger' };
    return { label: 'Actif', class: 'badge-success' };
  }

  setFilter(value: string) {
    this.activeFilter.set(value);
    this.markers.forEach((marker, binId) => {
      const bin = (marker as any)._binProps;
      // Show/hide based on filter
    });
  }
}
