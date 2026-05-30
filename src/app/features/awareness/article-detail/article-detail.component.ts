import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AwarenessService } from '../../../core/services/api.services';

@Component({ selector: 'app-article-detail', standalone: true, imports: [CommonModule, RouterLink],
  template: `
    <div class="article-detail">
      <div class="detail-header">
        <a routerLink="/awareness" class="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </a>
      </div>
      @if (article()) {
        @if (article().imageUrl) {
          <img [src]="article().imageUrl" class="detail-img" [alt]="article().title">
        }
        <div class="detail-body">
          <div class="detail-meta">
            <span class="article-type">{{ article().category }}</span>
            @if (article().isHealthAlert) { <span class="badge badge-danger">Alerte santé</span> }
          </div>
          <h1>{{ article().title }}</h1>
          <p class="detail-date">{{ formatDate(article().publishedAt) }}</p>
          <div class="detail-content" [innerHTML]="article().content"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .article-detail { min-height:100dvh;background:var(--bg); }
    .detail-header { padding:16px;padding-top:calc(16px + env(safe-area-inset-top));position:sticky;top:0;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);z-index:100; }
    .back-btn { width:40px;height:40px;border-radius:12px;background:var(--bg-soft);display:inline-flex;align-items:center;justify-content:center;color:var(--text-muted);text-decoration:none; }
    .detail-img { width:100%;height:220px;object-fit:cover; }
    .detail-body { padding:24px 20px; }
    .detail-meta { display:flex;gap:8px;align-items:center;margin-bottom:12px; }
    .article-type { font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px; }
    h1 { font-size:22px;line-height:1.35;margin-bottom:8px; }
    .detail-date { font-size:13px;color:var(--text-muted);margin-bottom:20px; }
    .detail-content { font-size:15px;line-height:1.8;color:var(--text); }
  `]
})
export class ArticleDetailComponent implements OnInit {
  article = signal<any>(null);
  constructor(private awarenessService: AwarenessService, private route: ActivatedRoute) {}
  ngOnInit() {
    this.awarenessService.getArticle(this.route.snapshot.params['id']).subscribe({
      next: (res) => this.article.set(res.data)
    });
  }
  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
