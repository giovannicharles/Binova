/**
 * BINOVA — Smart Waste Management
 * Fichier : src/app/features/sensibilisation/sensibilisation.component.ts
 * Auteur  : SGAO-SARL © 2026
 * Rôle    : Articles/vidéos/infographies de sensibilisation, likes
 */

import { Component, OnInit, signal, inject as inj } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-sensibilisation',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="sensi-wrap">
  <h2 class="page-title">🌿 Sensibilisation</h2>
  <p class="page-sub">Informations & conseils pour une meilleure gestion des déchets à Yaoundé</p>

  <!-- Filtres -->
  <div class="filter-chips">
    <button class="chip" [class.active]="filter() === ''" (click)="filter.set('')">Tout</button>
    <button class="chip" [class.active]="filter() === 'article'" (click)="filter.set('article')">📰 Articles</button>
    <button class="chip" [class.active]="filter() === 'video'" (click)="filter.set('video')">🎬 Vidéos</button>
    <button class="chip" [class.active]="filter() === 'infographic'" (click)="filter.set('infographic')">📊 Infographies</button>
  </div>

  <!-- Skeleton -->
  <div *ngIf="loading()">
    <div class="sensi-skeleton" *ngFor="let _ of [1,2,3]"></div>
  </div>

  <!-- Cartes campagnes -->
  <div class="campaigns-grid" *ngIf="!loading()">
    <div class="campaign-card animate-slide-up" *ngFor="let c of filtered(); let i = index"
         [class]="'stagger-' + (i + 1)">
      <!-- Badge type -->
      <div class="campaign-type-badge" [ngClass]="'type-' + c.type">
        {{ typeIcon(c.type) }} {{ typeLabel(c.type) }}
      </div>
      <!-- Thumbnail -->
      <div class="campaign-thumb" *ngIf="c.thumbnail_url">
        <img [src]="c.thumbnail_url" [alt]="c.title">
      </div>
      <div class="campaign-thumb campaign-thumb-placeholder" *ngIf="!c.thumbnail_url">
        {{ typeIcon(c.type) }}
      </div>
      <!-- Contenu -->
      <div class="campaign-content">
        <h3 class="campaign-title">{{ c.title }}</h3>
        <p class="campaign-excerpt">{{ c.content | slice:0:120 }}...</p>
        <div class="campaign-meta">
          <span>👁️ {{ c.views_count }}</span>
          <button class="like-btn" (click)="like(c)" [class.liked]="c._liked">
            {{ c._liked ? '❤️' : '🤍' }} {{ c.likes_count }}
          </button>
          <span *ngIf="c.target_zone !== 'all'">📍 {{ c.target_zone }}</span>
        </div>
      </div>
    </div>
  </div>

  <div *ngIf="!loading() && filtered().length === 0" class="empty">
    <p>Aucun contenu disponible pour ce filtre.</p>
  </div>
</div>
  `,
  styles: [`
    .sensi-wrap { padding: 1rem; max-width: 640px; margin: 0 auto; padding-bottom: 5rem; }
    .page-title { font-size: 1.375rem; margin: 0 0 0.25rem; }
    .page-sub { color: #666; font-size: 0.875rem; margin-bottom: 1.25rem; }

    .filter-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .chip {
      padding: 0.35rem 1rem; border-radius: 50px; border: 1.5px solid #c8e6c8;
      background: white; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;
      &.active { background: #2D7D2D; color: white; border-color: #2D7D2D; }
    }

    .sensi-skeleton { height: 160px; border-radius: 16px; margin-bottom: 1rem; background: linear-gradient(90deg, #e8f5e8 25%, #f0faf0 50%, #e8f5e8 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

    .campaigns-grid { display: flex; flex-direction: column; gap: 1rem; }
    .campaign-card {
      background: white; border-radius: 16px; overflow: hidden;
      box-shadow: 0 2px 12px rgba(45,125,45,0.08); transition: all 0.25s;
      &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(45,125,45,0.15); }
    }
    .campaign-type-badge {
      padding: 0.35rem 1rem; font-size: 0.75rem; font-weight: 600;
      &.type-article     { background: #e8f5fb; color: #1A3A6B; }
      &.type-video       { background: #fdecea; color: #C0392B; }
      &.type-infographic { background: #f0faf0; color: #2D7D2D; }
      &.type-notification { background: #fef9e7; color: #E67E22; }
    }
    .campaign-thumb {
      height: 140px; overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .campaign-thumb-placeholder {
      background: #f0faf0; display: flex; align-items: center; justify-content: center;
      font-size: 3rem;
    }
    .campaign-content { padding: 1rem; }
    .campaign-title { font-size: 1rem; font-weight: 700; margin: 0 0 0.5rem; color: #1A1A1A; }
    .campaign-excerpt { font-size: 0.875rem; color: #666; margin: 0 0 0.75rem; line-height: 1.5; }
    .campaign-meta { display: flex; align-items: center; gap: 1rem; font-size: 0.8rem; color: #888; }
    .like-btn {
      background: none; border: none; cursor: pointer; font-size: 0.875rem; padding: 0;
      transition: transform 0.2s; &.liked { animation: pop-in 0.3s both; }
    }
    .empty { text-align: center; color: #888; padding: 2rem; }
  `]
})
export class SensibilisationComponent implements OnInit {
  private api = inj(ApiService);
  private toast = inj(ToastService);

  campaigns = signal<any[]>([]);
  filter = signal('');
  loading = signal(true);

  filtered() { return this.filter() ? this.campaigns().filter(c => c.type === this.filter()) : this.campaigns(); }
  typeIcon(t: string): string { return { article: '📰', video: '🎬', infographic: '📊', notification: '🔔' }[t] || '📄'; }
  typeLabel(t: string): string { return { article: 'Article', video: 'Vidéo', infographic: 'Infographie', notification: 'Notification' }[t] || t; }

  ngOnInit(): void {
    this.api.get('/campaigns').subscribe({
      next: (res: any) => { this.campaigns.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  like(c: any): void {
    c._liked = !c._liked;
    c.likes_count += c._liked ? 1 : -1;
  }
}
