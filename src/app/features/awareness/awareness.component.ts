import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AwarenessService } from '../../core/services/api.services';

@Component({
  selector: 'app-awareness',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <h2 style="font-size:20px; margin-bottom:16px">Sensibilisation 🌿</h2>

      <!-- Filtres -->
      <div class="filter-scroll">
        @for (f of filters; track f.value) {
          <button class="filter-chip" [class.active]="activeFilter() === f.value" (click)="setFilter(f.value)">
            {{ f.icon }} {{ f.label }}
          </button>
        }
      </div>

      <!-- Health alerts -->
      @if (healthAlerts().length > 0) {
        <div class="health-banner animate-pop-in">
          <span>🚨</span>
          <div>
            <strong>Alerte santé publique</strong>
            <p>{{ healthAlerts()[0].title }}</p>
          </div>
          <a [routerLink]="'/awareness/' + healthAlerts()[0]._id">→</a>
        </div>
      }

      @if (loading()) {
        <div style="display:flex;flex-direction:column;gap:12px">
          @for (s of [1,2,3,4]; track s) { <div class="shimmer" style="height:100px;border-radius:16px"></div> }
        </div>
      } @else {
        <div class="articles-list">
          @for (article of articles(); track article._id) {
            <a class="article-card animate-slide-up" [routerLink]="'/awareness/' + article._id">
              @if (article.imageUrl) {
                <img [src]="article.imageUrl" class="article-img" [alt]="article.title">
              } @else {
                <div class="article-img-placeholder">{{ typeIcon(article.type) }}</div>
              }
              <div class="article-content">
                <div class="article-meta">
                  <span class="article-type">{{ typeLabel(article.type) }}</span>
                  @if (article.isHealthAlert) { <span class="badge badge-danger">Alerte</span> }
                </div>
                <h3>{{ article.title }}</h3>
                <p>{{ article.summary }}</p>
                <span class="article-date">{{ formatDate(article.publishedAt) }}</span>
              </div>
            </a>
          }
          @empty {
            <div class="empty-state">
              <span>📰</span>
              <p>Aucun article disponible pour l'instant</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .filter-scroll { display:flex;gap:8px;overflow-x:auto;padding-bottom:16px;-webkit-overflow-scrolling:touch;&::-webkit-scrollbar{display:none} }
    .filter-chip { white-space:nowrap;padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg);color:var(--text-muted);font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;&.active{background:var(--primary);border-color:var(--primary);color:#fff} }
    .health-banner { display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#FF3B30,#FF9500);color:#fff;border-radius:16px;padding:14px 16px;margin-bottom:16px;span:first-child{font-size:28px} strong{display:block;font-size:14px} p{font-size:12px;opacity:0.9} a{color:#fff;font-size:18px;font-weight:700;margin-left:auto} }
    .articles-list { display:flex;flex-direction:column;gap:14px; }
    .article-card { background:var(--bg);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden;display:flex;gap:0;text-decoration:none;color:var(--text);flex-direction:column;transition:transform 0.2s;&:active{transform:scale(0.98)} }
    .article-img { width:100%;height:160px;object-fit:cover; }
    .article-img-placeholder { width:100%;height:100px;background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:48px; }
    .article-content { padding:14px 16px; }
    .article-meta { display:flex;align-items:center;gap:8px;margin-bottom:8px; }
    .article-type { font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px; }
    .article-card h3 { font-size:15px;line-height:1.4;margin-bottom:6px; }
    .article-card p { font-size:13px;color:var(--text-muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
    .article-date { font-size:11px;color:var(--text-light);margin-top:8px;display:block; }
    .empty-state { text-align:center;padding:40px;span{font-size:48px;display:block;margin-bottom:12px}p{color:var(--text-muted)} }
  `]
})
export class AwarenessComponent implements OnInit {
  articles = signal<any[]>([]);
  healthAlerts = signal<any[]>([]);
  loading = signal(true);
  activeFilter = signal('all');

  filters = [
    { value: 'all', label: 'Tout', icon: '📋' },
    { value: 'article', label: 'Articles', icon: '📰' },
    { value: 'video', label: 'Vidéos', icon: '🎥' },
    { value: 'alert', label: 'Alertes', icon: '🚨' },
    { value: 'tip', label: 'Conseils', icon: '💡' }
  ];

  constructor(private awarenessService: AwarenessService) {}

  ngOnInit() { this.loadArticles(); }

  loadArticles() {
    this.loading.set(true);
    const params: any = {};
    if (this.activeFilter() !== 'all') params.type = this.activeFilter();

    this.awarenessService.getArticles(params).subscribe({
      next: (res) => {
        this.articles.set(res.data || []);
        this.healthAlerts.set((res.data || []).filter((a: any) => a.isHealthAlert));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFilter(value: string) {
    this.activeFilter.set(value);
    this.loadArticles();
  }

  typeIcon(type: string): string {
    return { article: '📰', video: '🎥', alert: '🚨', tip: '💡' }[type] || '📋';
  }

  typeLabel(type: string): string {
    return { article: 'Article', video: 'Vidéo', alert: 'Alerte', tip: 'Conseil' }[type] || type;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
