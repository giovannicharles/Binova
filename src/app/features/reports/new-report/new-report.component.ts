import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ReportService } from 'src/app/core/services/api.services';

@Component({
  selector: 'app-new-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="report-page">
      <!-- Header -->
      <div class="report-header">
        <button class="back-btn" routerLink="/reports">
          <i class="ri-arrow-left-line" style="font-size: 20px;"></i>
        </button>
        <h1>Nouveau signalement</h1>
      </div>

      <!-- Steps progress -->
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="(step() / 3) * 100"></div>
      </div>

      <div class="step-label">Étape {{ step() }}/3 · {{ stepLabel() }}</div>

      <div class="report-body">
        @if (success()) {
          <!-- Success state -->
          <div class="success-state animate-pop-in">
            <div class="success-icon">
              <i class="ri-checkbox-circle-line" style="font-size: 64px;"></i>
            </div>
            <h2>Signalement envoyé !</h2>
            <p>Merci pour votre contribution. Votre signalement a bien été reçu.</p>
            <div class="points-earned animate-slide-up">
              <i class="ri-star-line" style="font-size: 20px;"></i> +50 points gagnés !
            </div>
            <button class="btn btn-primary btn-full" style="margin-top: 32px" routerLink="/dashboard">
              Retour à l'accueil
            </button>
          </div>

        } @else {

          @if (error()) {
            <div class="alert-error">{{ error() }}</div>
          }

          <!-- Step 1: Type & Description -->
          @if (step() === 1) {
            <div class="animate-slide-up">
              <h3>Que souhaitez-vous signaler ?</h3>

              <div class="category-grid">
                @for (cat of categories; track cat.value) {
                  <button class="cat-btn" [class.selected]="form.category === cat.value"
                          (click)="form.category = cat.value">
                    <i [class]="cat.icon" class="cat-icon" style="font-size: 28px;"></i>
                    <span>{{ cat.label }}</span>
                  </button>
                }
              </div>

              <div class="form-group" style="margin-top: 20px">
                <label>Titre *</label>
                <input class="form-control" type="text" [(ngModel)]="form.title"
                       placeholder="Résumé du problème" maxlength="200">
              </div>

              <div class="form-group">
                <label>Description *</label>
                <textarea class="form-control" [(ngModel)]="form.description"
                          rows="4" placeholder="Décrivez le problème en détail..."
                          maxlength="2000"></textarea>
              </div>

              <div class="form-group">
                <label>Priorité</label>
                <div class="priority-grid">
                  @for (p of priorities; track p.value) {
                    <button class="priority-btn" [class.selected]="form.priority === p.value"
                            [style.borderColor]="form.priority === p.value ? p.color : ''"
                            [style.background]="form.priority === p.value ? p.bg : ''"
                            (click)="form.priority = p.value">
                      <i [class]="p.icon" style="font-size: 18px; margin-right: 6px;"></i>
                      {{ p.label }}
                    </button>
                  }
                </div>
              </div>

              <button class="btn btn-primary btn-full" (click)="nextStep()"
                      [disabled]="!form.category || !form.title || !form.description">
                Continuer →
              </button>
            </div>
          }

          <!-- Step 2: Localisation & Photo -->
          @if (step() === 2) {
            <div class="animate-slide-up">
              <h3>Localisation du problème</h3>

              <div class="location-card" [class.located]="form.latitude" (click)="getLocation()">
                @if (locating()) {
                  <div class="locating">
                    <span class="spinner-green"></span>
                    <p>Récupération de votre position...</p>
                  </div>
                } @else if (form.latitude) {
                  <div class="located-info">
                    <span class="loc-icon">📍</span>
                    <div>
                      <p class="loc-coords">{{ form.latitude.toFixed(4) }}, {{ form.longitude.toFixed(4) }}</p>
                      <p class="loc-address">{{ form.address || 'Position GPS obtenue' }}</p>
                    </div>
                    <button class="refresh-btn" (click)="getLocation(); $event.stopPropagation()">🔄</button>
                  </div>
                } @else {
                  <div class="locate-prompt">
                    <span>📍</span>
                    <p>Toucher pour obtenir votre position GPS</p>
                  </div>
                }
              </div>

              <div class="form-group">
                <label>Adresse (optionnel)</label>
                <input class="form-control" type="text" [(ngModel)]="form.address"
                       placeholder="Rue, quartier...">
              </div>

              <!-- Photo -->
              <div class="form-group">
                <label>Photos (optionnel, max 5)</label>
                <div class="photo-area" (click)="triggerUpload()">
                  @if (photos().length === 0) {
                    <div class="photo-placeholder">
                      <span>📷</span>
                      <p>Ajouter des photos</p>
                    </div>
                  } @else {
                    <div class="photo-preview">
                      @for (p of photos(); track $index) {
                        <div class="photo-thumb">
                          <img [src]="p.preview" [alt]="'Photo ' + ($index + 1)">
                          <button class="photo-remove" (click)="removePhoto($index); $event.stopPropagation()">✕</button>
                        </div>
                      }
                      @if (photos().length < 5) {
                        <div class="photo-add">+</div>
                      }
                    </div>
                  }
                  <input #fileInput type="file" accept="image/*" multiple hidden (change)="onPhotoChange($event)">
                </div>
              </div>

              <div class="btn-row">
                <button class="btn btn-outline" (click)="step.set(1)">← Retour</button>
                <button class="btn btn-primary" (click)="nextStep()" [disabled]="!form.latitude">
                  Continuer →
                </button>
              </div>
            </div>
          }

          <!-- Step 3: Résumé & Envoi -->
          @if (step() === 3) {
            <div class="animate-slide-up">
              <h3>Résumé du signalement</h3>

              <div class="summary-card">
                <div class="summary-row">
                  <span class="sum-label">Type</span>
                  <span>{{ categoryLabel() }}</span>
                </div>
                <div class="summary-row">
                  <span class="sum-label">Titre</span>
                  <span>{{ form.title }}</span>
                </div>
                <div class="summary-row">
                  <span class="sum-label">Priorité</span>
                  <span>{{ priorityLabel() }}</span>
                </div>
                <div class="summary-row">
                  <span class="sum-label">Position</span>
                  <span>{{ form.latitude?.toFixed(4) }}, {{ form.longitude?.toFixed(4) }}</span>
                </div>
                @if (photos().length > 0) {
                  <div class="summary-row">
                    <span class="sum-label">Photos</span>
                    <span>{{ photos().length }} photo(s)</span>
                  </div>
                }
              </div>

              <div class="points-preview">
                <i class="ri-star-line" style="font-size: 24px;"></i>
                <div>
                  <strong>+50 points</strong>
                  <p>seront ajoutés à votre compte</p>
                </div>
              </div>

              <div class="btn-row">
                <button class="btn btn-outline" (click)="step.set(2)">← Retour</button>
                <button class="btn btn-primary" (click)="submit()" [disabled]="loading()">
                  @if (loading()) { <span class="spinner-sm"></span> }
                  Envoyer
                  <i class="ri-leaf-line" style="font-size: 18px;"></i>
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .report-page { min-height: 100dvh; background: var(--bg); display: flex; flex-direction: column; }

    .report-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; padding-top: calc(16px + env(safe-area-inset-top));
      border-bottom: 1px solid var(--border-light);
      h1 { font-size: 18px; font-weight: 800; }
    }

    .back-btn {
      width: 40px; height: 40px; border-radius: 12px;
      background: var(--bg-soft); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }

    .progress-bar {
      height: 4px; background: var(--border);
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary), var(--accent));
        transition: width 0.4s ease;
        border-radius: 0 4px 4px 0;
      }
    }

    .step-label {
      padding: 10px 16px;
      font-size: 12px; color: var(--text-muted); font-weight: 600;
      background: var(--bg-soft);
    }

    .report-body { padding: 20px 16px; flex: 1; h3 { font-size: 17px; margin-bottom: 20px; } }

    .alert-error {
      background: #FEF2F2; color: #DC2626;
      padding: 12px 16px; border-radius: 12px; font-size: 13px;
      margin-bottom: 16px;
    }

    .category-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 4px;
    }

    .cat-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 14px 8px; border-radius: 14px;
      border: 2px solid var(--border); background: var(--bg);
      cursor: pointer; transition: all var(--transition); font-size: 12px; font-weight: 600;

      .cat-icon { font-size: 28px; }

      &.selected { border-color: var(--primary); background: var(--primary-50); color: var(--primary); }
      &:active { transform: scale(0.95); }
    }

    .priority-grid { display: flex; gap: 8px; flex-wrap: wrap; }

    .priority-btn {
      padding: 8px 14px; border-radius: 20px;
      border: 2px solid var(--border); background: var(--bg);
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all var(--transition);
      &.selected { font-weight: 700; }
    }

    .location-card {
      border: 2px dashed var(--border); border-radius: var(--radius-lg);
      padding: 20px; margin-bottom: 20px; cursor: pointer;
      transition: all var(--transition); text-align: center;

      &.located { border-color: var(--primary); border-style: solid; text-align: left; }
    }

    .locating { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .spinner-green {
      width: 32px; height: 32px;
      border: 3px solid var(--primary-100); border-top-color: var(--primary);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }

    .located-info { display: flex; align-items: center; gap: 12px; }
    .loc-icon { font-size: 28px; }
    .loc-coords { font-size: 13px; font-weight: 600; color: var(--primary); }
    .loc-address { font-size: 12px; color: var(--text-muted); }
    .refresh-btn { margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; }

    .locate-prompt { span { font-size: 48px; display: block; margin-bottom: 8px; } p { color: var(--text-muted); font-size: 14px; } }

    .photo-area {
      border: 2px dashed var(--border); border-radius: var(--radius-lg);
      padding: 20px; cursor: pointer; transition: border-color 0.2s;
      &:hover { border-color: var(--primary); }
    }

    .photo-placeholder { text-align: center; span { font-size: 48px; display: block; } p { color: var(--text-muted); font-size: 14px; margin-top: 8px; } }

    .photo-preview { display: flex; gap: 10px; flex-wrap: wrap; }

    .photo-thumb {
      width: 80px; height: 80px; border-radius: 10px; overflow: hidden; position: relative;
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .photo-remove {
      position: absolute; top: 4px; right: 4px;
      width: 20px; height: 20px; border-radius: 50%;
      background: rgba(0,0,0,0.6); color: #fff; border: none;
      font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }

    .photo-add {
      width: 80px; height: 80px; border-radius: 10px;
      border: 2px dashed var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; color: var(--text-muted);
    }

    .btn-row { display: flex; gap: 12px; .btn { flex: 1; } }

    .summary-card {
      background: var(--bg-soft); border-radius: var(--radius-lg);
      padding: 16px; margin-bottom: 20px;
    }

    .summary-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid var(--border-light);
      font-size: 14px;
      &:last-child { border-bottom: none; }
    }

    .sum-label { color: var(--text-muted); font-weight: 500; flex-shrink: 0; margin-right: 16px; }

    .points-preview {
      display: flex; align-items: center; gap: 12px;
      background: var(--primary-50); border-radius: var(--radius-lg);
      padding: 16px; margin-bottom: 24px;
      span { font-size: 32px; }
      strong { display: block; font-size: 18px; color: var(--primary); }
      p { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    }

    .success-state { text-align: center; padding: 40px 0; }
    .success-icon { font-size: 80px; margin-bottom: 24px; animation: bounce 1s ease; }
    .success-state h2 { font-size: 24px; margin-bottom: 12px; }
    .success-state p { color: var(--text-muted); font-size: 15px; }

    .points-earned {
      display: inline-block; margin-top: 20px;
      background: linear-gradient(135deg, #F59E0B, #FCD34D);
      color: #fff; padding: 10px 24px; border-radius: 20px;
      font-weight: 700; font-size: 16px;
      box-shadow: 0 4px 16px rgba(245,158,11,0.4);
    }

    .spinner-sm {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block;
    }
  `]
})
export class NewReportComponent implements OnInit {
  step = signal(1);
  loading = signal(false);
  success = signal(false);
  error = signal('');
  locating = signal(false);
  photos = signal<{ file: File; preview: string }[]>([]);

  form = {
    title: '', description: '', category: '', priority: 'medium',
    latitude: 0, longitude: 0, address: '', zone: ''
  };

  categories = [
    { value: 'overflow', label: 'Débordement', icon: 'ri-delete-bin-line' },
    { value: 'damage', label: 'Dégradation', icon: 'ri-hammer-line' },
    { value: 'illegal_dump', label: 'Dépôt sauvage', icon: 'ri-landscape-line' },
    { value: 'odor', label: 'Odeur', icon: 'ri-mask-line' },
    { value: 'pest', label: 'Nuisibles', icon: 'ri-bug-line' },
    { value: 'other', label: 'Autre', icon: 'ri-question-line' }
  ];

  priorities = [
    { value: 'low', label: 'Faible', icon: 'ri-checkbox-blank-circle-line', color: '#16A34A', bg: '#DCFCE7' },
    { value: 'medium', label: 'Normale', icon: 'ri-checkbox-blank-circle-line', color: '#D97706', bg: '#FEF3C7' },
    { value: 'high', label: 'Urgent', icon: 'ri-checkbox-blank-circle-line', color: '#EA580C', bg: '#FEE2E2' },
    { value: 'critical', label: 'Critique', icon: 'ri-checkbox-blank-circle-line', color: '#DC2626', bg: '#FEE2E2' }
  ];

  constructor(private reportService: ReportService, private router: Router) { }

  ngOnInit() { this.getLocation(); }

  stepLabel(): string {
    return ['Type & Description', 'Localisation', 'Résumé'][this.step() - 1];
  }

  categoryLabel(): string {
    return this.categories.find(c => c.value === this.form.category)?.label || '';
  }

  priorityLabel(): string {
    return this.priorities.find(p => p.value === this.form.priority)?.label || '';
  }

  nextStep() {
    if (this.step() < 3) this.step.update(s => s + 1);
  }

  getLocation() {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.form.latitude = pos.coords.latitude;
        this.form.longitude = pos.coords.longitude;
        this.locating.set(false);
        // Reverse geocoding (simplifiée)
        this.form.address = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      },
      () => { this.locating.set(false); }
    );
  }

  triggerUpload() {
    document.querySelector<HTMLInputElement>('#fileInput')?.click();
  }

  onPhotoChange(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    const current = this.photos();
    const remaining = 5 - current.length;
    Array.from(files).slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photos.update(p => [...p, { file, preview: e.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  }

  removePhoto(index: number) {
    this.photos.update(p => p.filter((_, i) => i !== index));
  }

  submit() {
    this.loading.set(true);
    this.error.set('');

    const fd = new FormData();
    Object.entries(this.form).forEach(([k, v]) => fd.append(k, String(v)));
    this.photos().forEach(p => fd.append('photos', p.file));

    this.reportService.createReport(fd).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erreur lors de l\'envoi');
        this.step.set(3);
      }
    });
  }
}
