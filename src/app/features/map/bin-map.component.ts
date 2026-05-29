/**
 * BINOVA — Smart Waste Management
 * Fichier : src/app/features/map/bin-map.component.ts
 * Auteur  : SGAO-SARL © 2026
 * Rôle    : Carte Leaflet temps réel, marqueurs colorés, popup détail, GPS
 */

import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';
import { Subscription } from 'rxjs';

declare const L: any;

interface Bin {
  id: string; code: string; name: string; quarter: string;
  lat: number; lng: number; fill_level: number; status: string;
  battery_level: number; deodorant_level: number; waste_type: string;
  zone: string; address: string; last_seen: string; open_count_daily: number;
}

@Component({
  selector: 'app-bin-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <!-- Carte plein écran -->
      <div id="binova-map"></div>

      <!-- Filtres flottants -->
      <div class="map-filters animate-slide-up">
        <button class="filter-btn" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">Tous</button>
        <button class="filter-btn filter-full" [class.active]="activeFilter() === 'full'" (click)="setFilter('full')">Pleins</button>
        <button class="filter-btn filter-offline" [class.active]="activeFilter() === 'offline'" (click)="setFilter('offline')">Hors ligne</button>
        <button class="filter-btn filter-warning" [class.active]="activeFilter() === 'warning'" (click)="setFilter('warning')">Attention</button>
      </div>

      <!-- Bouton GPS -->
      <button class="gps-btn" (click)="locateMe()" title="Ma position">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
        </svg>
      </button>

      <!-- Légende -->
      <div class="map-legend">
        <div class="legend-item"><span class="dot dot-green"></span>Normal (0–59%)</div>
        <div class="legend-item"><span class="dot dot-orange"></span>Attention (60–84%)</div>
        <div class="legend-item"><span class="dot dot-red"></span>Plein (85–100%)</div>
        <div class="legend-item"><span class="dot dot-gray"></span>Hors ligne</div>
      </div>

      <!-- Compteur bacs -->
      <div class="map-counter" *ngIf="bins().length > 0">
        <strong>{{ filteredBins().length }}</strong> bac{{ filteredBins().length > 1 ? 's' : '' }}
        <span *ngIf="activeFilter() !== 'all'"> ({{ activeFilter() }})</span>
      </div>

      <!-- Panel détail bac (slide-in) -->
      <div class="bin-detail-panel" [class.open]="selectedBin()" *ngIf="selectedBin()">
        <button class="panel-close" (click)="selectedBin.set(null)">✕</button>
        <div class="panel-header">
          <div class="panel-badge" [ngClass]="getBadgeClass(selectedBin()!)">
            {{ selectedBin()!.fill_level }}%
          </div>
          <div>
            <h3>{{ selectedBin()!.name }}</h3>
            <p class="text-gray">{{ selectedBin()!.quarter }} — {{ selectedBin()!.code }}</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="fill-gauge-wrap" style="margin-bottom:1rem">
            <div class="fill-gauge-bar" [ngClass]="getGaugeClass(selectedBin()!)"
                 [style.--fill-pct]="selectedBin()!.fill_level + '%'"></div>
          </div>
          <div class="panel-stats">
            <div class="stat-item">
              <span class="stat-label">🔋 Batterie</span>
              <span class="stat-value">{{ selectedBin()!.battery_level }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🌿 Déodorant</span>
              <span class="stat-value">{{ selectedBin()!.deodorant_level }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📦 Type déchet</span>
              <span class="stat-value">{{ selectedBin()!.waste_type }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🔄 Ouvertures</span>
              <span class="stat-value">{{ selectedBin()!.open_count_daily }}/j</span>
            </div>
          </div>
          <button class="btn btn-primary btn-full" style="margin-top:1rem" (click)="reportBin(selectedBin()!)">
            📢 Signaler ce bac
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-container { position: relative; height: 100vh; width: 100%; }
    #binova-map { height: 100%; width: 100%; z-index: 1; }

    .map-filters {
      position: absolute; top: 1rem; left: 50%; transform: translateX(-50%);
      z-index: 1000; display: flex; gap: 0.5rem;
      background: white; border-radius: 50px; padding: 0.4rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .filter-btn {
      padding: 0.4rem 1rem; border-radius: 50px; border: none;
      cursor: pointer; font-size: 0.85rem; font-weight: 500;
      background: transparent; color: #555; transition: all 0.2s;
      white-space: nowrap;
      &.active, &:hover { background: #2D7D2D; color: white; }
      &.filter-full.active  { background: #C0392B; }
      &.filter-offline.active { background: #95A5A6; }
      &.filter-warning.active { background: #E67E22; }
    }

    .gps-btn {
      position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
      z-index: 1000; background: white; border: none; border-radius: 50%;
      width: 48px; height: 48px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15); color: #2D7D2D; transition: all 0.2s;
      &:hover { background: #2D7D2D; color: white; transform: translateY(-50%) scale(1.1); }
    }

    .map-legend {
      position: absolute; bottom: 2rem; left: 1rem; z-index: 1000;
      background: white; border-radius: 12px; padding: 0.75rem 1rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12); font-size: 0.8rem;
    }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; &:last-child { margin-bottom: 0; } }
    .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
    .dot-green  { background: #27AE60; }
    .dot-orange { background: #E67E22; }
    .dot-red    { background: #C0392B; }
    .dot-gray   { background: #95A5A6; }

    .map-counter {
      position: absolute; top: 4.5rem; left: 50%; transform: translateX(-50%);
      background: rgba(26,58,107,0.9); color: white; padding: 0.3rem 1rem;
      border-radius: 50px; font-size: 0.8rem; z-index: 1000;
    }

    .bin-detail-panel {
      position: absolute; bottom: 0; left: 0; right: 0; z-index: 1001;
      background: white; border-radius: 20px 20px 0 0;
      padding: 1.5rem; box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
      transform: translateY(100%); transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      max-height: 70vh; overflow-y: auto;
      &.open { transform: translateY(0); }
    }
    .panel-close {
      position: absolute; top: 1rem; right: 1rem;
      background: #f5f5f5; border: none; border-radius: 50%;
      width: 32px; height: 32px; cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .panel-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .panel-badge {
      min-width: 56px; height: 56px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 700; font-family: var(--font-title);
      &.badge-normal  { background: #eafbe7; color: #27AE60; }
      &.badge-warning { background: #fef3e7; color: #E67E22; }
      &.badge-critical { background: #fdecea; color: #C0392B; }
      &.badge-offline { background: #f0f3f4; color: #95A5A6; }
    }
    .panel-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .stat-item { background: #f8fdf8; border-radius: 8px; padding: 0.6rem 0.8rem; }
    .stat-label { display: block; font-size: 0.75rem; color: #666; margin-bottom: 0.15rem; }
    .stat-value { font-size: 1rem; font-weight: 600; color: #1A1A1A; }
    .text-gray { color: #666; font-size: 0.875rem; }
  `]
})
export class BinMapComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private socket = inject(SocketService);
  private toast = inject(ToastService);

  bins = signal<Bin[]>([]);
  activeFilter = signal<string>('all');
  selectedBin = signal<Bin | null>(null);

  private map: any;
  private markerLayer: any;
  private markers: Map<string, any> = new Map();
  private subs: Subscription[] = [];

  filteredBins() {
    const f = this.activeFilter();
    const all = this.bins();
    if (f === 'all') return all;
    if (f === 'full') return all.filter(b => b.fill_level >= 85 || b.status === 'full');
    if (f === 'offline') return all.filter(b => b.status === 'offline');
    if (f === 'warning') return all.filter(b => b.fill_level >= 60 && b.fill_level < 85);
    return all;
  }

  ngOnInit(): void {
    this.initMap();
    this.loadBins();
    this.subscribeToSocket();
  }

  private initMap(): void {
    this.map = L.map('binova-map', { center: [3.8667, 11.5167], zoom: 13, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    this.markerLayer = (L as any).markerClusterGroup({ chunkedLoading: true, showCoverageOnHover: false });
    this.map.addLayer(this.markerLayer);
  }

  private loadBins(): void {
    this.api.get<any>('/bins/map/geojson').subscribe({
      next: (res) => {
        const bins = res.data.features.map((f: any) => ({
          ...f.properties,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }));
        this.bins.set(bins);
        this.renderMarkers(bins);
      },
      error: () => this.toast.error('Erreur chargement carte'),
    });
  }

  private renderMarkers(bins: Bin[]): void {
    this.markerLayer.clearLayers();
    this.markers.clear();
    bins.forEach(bin => this.addMarker(bin));
  }

  private addMarker(bin: Bin): void {
    const color = this.getMarkerColor(bin);
    const isPulsing = bin.fill_level >= 85 || bin.status === 'offline';
    const svgIcon = L.divIcon({
      html: `
        <div class="binova-marker ${isPulsing ? 'pulsing' : ''}" style="background:${color};border-color:${color}">
          <span>${bin.fill_level >= 0 && bin.status !== 'offline' ? bin.fill_level + '%' : '⚡'}</span>
        </div>
        <style>
          .binova-marker {
            width: 44px; height: 44px; border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
            border: 3px solid; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .binova-marker span { transform: rotate(45deg); font-size: 11px; font-weight: 700; color: white; }
          .binova-marker.pulsing { animation: pulse-green 2s infinite; }
          @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(0,0,0,0.3)} 50%{box-shadow:0 0 0 10px rgba(0,0,0,0)} }
        </style>
      `,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });

    const marker = L.marker([bin.lat, bin.lng], { icon: svgIcon })
      .on('click', () => this.selectedBin.set(bin));
    this.markerLayer.addLayer(marker);
    this.markers.set(bin.id, marker);
  }

  private subscribeToSocket(): void {
    this.socket.connect();
    const sub = this.socket.binUpdate.subscribe((data: any) => {
      this.bins.update(bins => bins.map(b => b.id === data.binId ? { ...b, fill_level: data.fillLevel, battery_level: data.battery } : b));
      // Mettre à jour le marqueur
      const bin = this.bins().find(b => b.id === data.binId);
      if (bin) { this.removeMarker(data.binId); this.addMarker(bin); }
    });
    const alertSub = this.socket.binAlert.subscribe((data: any) => {
      if (data.severity === 'critical') this.toast.warning(`⚠️ Bac ${data.binId.slice(-6)}`, data.message);
    });
    this.subs.push(sub, alertSub);
  }

  private removeMarker(binId: string): void {
    const marker = this.markers.get(binId);
    if (marker) { this.markerLayer.removeLayer(marker); this.markers.delete(binId); }
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
    this.renderMarkers(this.filteredBins());
  }

  locateMe(): void {
    navigator.geolocation?.getCurrentPosition(
      pos => this.map.setView([pos.coords.latitude, pos.coords.longitude], 16),
      () => this.toast.warning('Géolocalisation non disponible')
    );
  }

  reportBin(bin: Bin): void {
    // Navigation vers formulaire signalement avec bac pré-sélectionné
    window.location.href = `/report?bin_id=${bin.id}&bin_code=${bin.code}`;
  }

  getBadgeClass(bin: Bin): string {
    if (bin.status === 'offline') return 'badge-offline';
    if (bin.fill_level >= 85) return 'badge-critical';
    if (bin.fill_level >= 60) return 'badge-warning';
    return 'badge-normal';
  }

  getGaugeClass(bin: Bin): string {
    if (bin.fill_level >= 85) return 'critical';
    if (bin.fill_level >= 60) return 'warning';
    return 'normal';
  }

  private getMarkerColor(bin: Bin): string {
    if (bin.status === 'offline') return '#95A5A6';
    if (bin.fill_level >= 85) return '#C0392B';
    if (bin.fill_level >= 60) return '#E67E22';
    return '#27AE60';
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}
