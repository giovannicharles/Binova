/**
 * BINOVA — Smart Waste Management
 * Fichier : src/app/features/report/report-form.component.ts
 * Auteur  : SGAO-SARL © 2026
 * Rôle    : Stepper 3 étapes — GPS auto, upload drag&drop photos, urgence slider
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="report-wrap">
  <!-- Header -->
  <div class="report-header">
    <button class="back-btn" (click)="router.navigate(['/app/map'])">← Retour</button>
    <h2>Nouveau signalement</h2>
    <span></span>
  </div>

  <!-- Stepper progress -->
  <div class="stepper">
    <div class="step" *ngFor="let s of steps; let i = index"
         [class.active]="currentStep() === i" [class.done]="currentStep() > i">
      <div class="step-circle">{{ currentStep() > i ? '✓' : i + 1 }}</div>
      <span class="step-label">{{ s }}</span>
    </div>
    <div class="step-line">
      <div class="step-line-fill" [style.width]="(currentStep() / (steps.length - 1) * 100) + '%'"></div>
    </div>
  </div>

  <form [formGroup]="reportForm" (ngSubmit)="submit()">

    <!-- ÉTAPE 1 : Localisation -->
    <div class="step-content animate-slide-up" *ngIf="currentStep() === 0">
      <h3>📍 Localisation du problème</h3>
      <p class="step-desc">Indiquez où se situe le problème</p>

      <div class="form-group">
        <label>Zone / Quartier</label>
        <select formControlName="zone" class="form-control">
          <option value="">-- Choisir --</option>
          <option *ngFor="let z of zones" [value]="z">{{ z }}</option>
        </select>
      </div>

      <div class="gps-section">
        <button type="button" class="btn btn-outline" (click)="getLocation()" [disabled]="gpsLoading()">
          {{ gpsLoading() ? '⏳ Localisation...' : '📍 Utiliser ma position GPS' }}
        </button>
        <div class="gps-result" *ngIf="gpsSet()">
          ✅ Position GPS détectée : {{ lat() | number:'1.4-4' }}, {{ lng() | number:'1.4-4' }}
        </div>
      </div>

      <div class="form-group" *ngIf="bins().length > 0">
        <label>Bac concerné (optionnel)</label>
        <select formControlName="bin_id" class="form-control">
          <option value="">-- Aucun bac spécifique --</option>
          <option *ngFor="let b of bins()" [value]="b.id">{{ b.code }} — {{ b.name }}</option>
        </select>
      </div>

      <button type="button" class="btn btn-primary btn-full mt-1"
              [disabled]="!reportForm.get('zone')?.value" (click)="currentStep.set(1)">
        Suivant →
      </button>
    </div>

    <!-- ÉTAPE 2 : Description + Photos -->
    <div class="step-content animate-slide-up" *ngIf="currentStep() === 1">
      <h3>📸 Description & Photos</h3>
      <p class="step-desc">Décrivez le problème et ajoutez des photos</p>

      <div class="form-group">
        <label>Catégorie</label>
        <div class="categories-grid">
          <button type="button" class="cat-btn" *ngFor="let c of categories"
                  [class.active]="reportForm.get('category')?.value === c.value"
                  (click)="reportForm.patchValue({ category: c.value })">
            <span class="cat-icon">{{ c.icon }}</span>
            <span>{{ c.label }}</span>
          </button>
        </div>
      </div>

      <div class="form-group">
        <label>Description <span class="required">*</span></label>
        <textarea formControlName="description" class="form-control" rows="4"
                  placeholder="Décrivez le problème en détail..."
                  [class.error]="reportForm.get('description')?.invalid && reportForm.get('description')?.touched"></textarea>
        <span class="char-count">{{ reportForm.get('description')?.value?.length || 0 }}/2000</span>
      </div>

      <!-- Upload photos drag & drop -->
      <div class="photo-zone" (dragover)="onDragOver($event)" (drop)="onDrop($event)"
           (dragenter)="isDragging.set(true)" (dragleave)="isDragging.set(false)"
           [class.dragging]="isDragging()">
        <input type="file" accept="image/*" multiple #fileInput (change)="onFileSelect($event)" style="display:none">
        <div class="photo-upload-btn" (click)="fileInput.click()">
          <span class="upload-icon">📷</span>
          <p>Glissez vos photos ici ou cliquez pour sélectionner</p>
          <span class="upload-sub">Max 5 photos · JPEG, PNG · 5MB chacune</span>
        </div>
        <div class="photo-previews" *ngIf="photoPreviews().length > 0">
          <div class="photo-preview" *ngFor="let p of photoPreviews(); let i = index">
            <img [src]="p" alt="Photo {{ i + 1 }}">
            <button type="button" class="remove-photo" (click)="removePhoto(i)">✕</button>
          </div>
        </div>
      </div>

      <div class="step-btns">
        <button type="button" class="btn btn-outline" (click)="currentStep.set(0)">← Retour</button>
        <button type="button" class="btn btn-primary"
                [disabled]="!reportForm.get('description')?.valid || !reportForm.get('category')?.value"
                (click)="currentStep.set(2)">Suivant →</button>
      </div>
    </div>

    <!-- ÉTAPE 3 : Urgence & Confirmation -->
    <div class="step-content animate-slide-up" *ngIf="currentStep() === 2">
      <h3>⚡ Niveau d'urgence</h3>
      <p class="step-desc">Évaluez l'urgence de votre signalement</p>

      <div class="urgency-section">
        <div class="urgency-labels">
          <span>Faible</span>
          <span>Critique</span>
        </div>
        <input type="range" min="1" max="5" step="1" formControlName="urgency_level"
               class="urgency-slider">
        <div class="urgency-display" [ngClass]="'urgency-' + reportForm.get('urgency_level')?.value">
          <span class="urgency-num">{{ reportForm.get('urgency_level')?.value }}</span>
          <span class="urgency-txt">{{ urgencyLabel() }}</span>
        </div>
      </div>

      <!-- Résumé -->
      <div class="summary-card">
        <h4>Résumé du signalement</h4>
        <div class="summary-row"><span>Zone :</span><strong>{{ reportForm.get('zone')?.value }}</strong></div>
        <div class="summary-row"><span>Catégorie :</span><strong>{{ getCategoryLabel() }}</strong></div>
        <div class="summary-row"><span>Photos :</span><strong>{{ photoFiles().length }} photo(s)</strong></div>
        <div class="summary-row"><span>GPS :</span><strong>{{ gpsSet() ? '✅ Inclus' : '❌ Non défini' }}</strong></div>
        <div class="summary-desc">{{ reportForm.get('description')?.value }}</div>
      </div>

      <div class="step-btns">
        <button type="button" class="btn btn-outline" (click)="currentStep.set(1)">← Retour</button>
        <button type="submit" class="btn btn-primary" [disabled]="loading() || reportForm.invalid">
          <span *ngIf="loading()" class="spinner"></span>
          {{ loading() ? 'Envoi...' : '📢 Envoyer le signalement' }}
        </button>
      </div>
    </div>
  </form>
</div>
  `,
  styles: [`
    .report-wrap { max-width: 600px; margin: 0 auto; padding: 1rem 1rem 6rem; }
    .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .back-btn { background: none; border: none; color: #2D7D2D; cursor: pointer; font-size: 0.9rem; }
    h2 { font-size: 1.125rem; margin: 0; }

    .stepper {
      display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 2rem;
      position: relative;
    }
    .step {
      display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
      z-index: 1; min-width: 80px;
    }
    .step-circle {
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid #ddd;
      display: flex; align-items: center; justify-content: center; font-size: 0.875rem;
      background: white; transition: all 0.3s; font-weight: 600;
    }
    .step.active .step-circle { border-color: #2D7D2D; color: #2D7D2D; }
    .step.done .step-circle { background: #2D7D2D; border-color: #2D7D2D; color: white; }
    .step-label { font-size: 0.7rem; color: #888; white-space: nowrap; }
    .step.active .step-label { color: #2D7D2D; font-weight: 600; }
    .step-line {
      flex: 1; height: 2px; background: #e8f5e8; position: absolute;
      top: 16px; left: 120px; right: 120px; z-index: 0;
    }
    .step-line-fill { height: 100%; background: #2D7D2D; transition: width 0.4s ease; }

    .step-content { padding: 0; }
    h3 { font-size: 1.125rem; margin: 0 0 0.25rem; }
    .step-desc { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }

    .gps-section { margin-bottom: 1rem; }
    .gps-result {
      margin-top: 0.5rem; padding: 0.6rem 1rem; background: #f0faf0;
      border-radius: 8px; font-size: 0.8rem; color: #2D7D2D;
    }

    .categories-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
    .cat-btn {
      padding: 0.75rem 0.5rem; border: 1.5px solid #dde8dd; border-radius: 10px;
      background: white; cursor: pointer; text-align: center; transition: all 0.2s;
      display: flex; flex-direction: column; align-items: center; gap: 0.25rem; font-size: 0.8rem;
      &.active { border-color: #2D7D2D; background: #f0faf0; color: #2D7D2D; font-weight: 600; }
    }
    .cat-icon { font-size: 1.5rem; }

    .char-count { display: block; text-align: right; font-size: 0.75rem; color: #888; margin-top: 0.25rem; }

    .photo-zone {
      border: 2px dashed #c8e6c8; border-radius: 12px; padding: 1.5rem; text-align: center;
      margin-bottom: 1rem; transition: all 0.2s; cursor: pointer;
      &.dragging { border-color: #2D7D2D; background: #f0faf0; }
    }
    .upload-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .upload-sub { font-size: 0.75rem; color: #888; display: block; margin-top: 0.25rem; }
    .photo-previews { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; justify-content: center; }
    .photo-preview {
      position: relative; width: 80px; height: 80px;
      img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
    }
    .remove-photo {
      position: absolute; top: -6px; right: -6px; width: 20px; height: 20px;
      background: #C0392B; color: white; border: none; border-radius: 50%;
      font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }

    .urgency-labels { display: flex; justify-content: space-between; font-size: 0.8rem; color: #888; }
    .urgency-slider { width: 100%; margin: 0.5rem 0; accent-color: #2D7D2D; }
    .urgency-display {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
      border-radius: 10px; margin-top: 0.5rem; background: #f8faf8;
    }
    .urgency-num { font-size: 2rem; font-weight: 700; font-family: var(--font-title); }
    .urgency-txt { font-size: 0.9rem; font-weight: 600; }
    .urgency-1 { background: #eafbe7; .urgency-num, .urgency-txt { color: #27AE60; } }
    .urgency-2 { background: #fdf5e7; .urgency-num, .urgency-txt { color: #E67E22; } }
    .urgency-3 { background: #fdf0e7; .urgency-num, .urgency-txt { color: #E67E22; } }
    .urgency-4 { background: #fdecea; .urgency-num, .urgency-txt { color: #C0392B; } }
    .urgency-5 { background: #fdecea; .urgency-num, .urgency-txt { color: #C0392B; font-weight: 700; } }

    .summary-card {
      background: #f8faf8; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;
      h4 { font-size: 0.9rem; margin: 0 0 0.75rem; color: #1A3A6B; }
    }
    .summary-row {
      display: flex; justify-content: space-between; font-size: 0.875rem;
      padding: 0.25rem 0; border-bottom: 1px solid #e8f5e8;
      span { color: #666; }
    }
    .summary-desc { font-size: 0.85rem; color: #333; margin-top: 0.5rem; font-style: italic; }

    .step-btns { display: flex; gap: 0.75rem; margin-top: 1rem; }
    .step-btns .btn { flex: 1; }
    .mt-1 { margin-top: 1rem; }
    .required { color: #C0392B; }
    .spinner {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.5); border-top-color: white;
      border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReportFormComponent implements OnInit {
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  steps = ['Localisation', 'Description', 'Confirmation'];
  currentStep = signal(0);
  loading = signal(false);
  gpsLoading = signal(false);
  gpsSet = signal(false);
  isDragging = signal(false);
  lat = signal<number>(0);
  lng = signal<number>(0);
  bins = signal<any[]>([]);
  photoPreviews = signal<string[]>([]);
  photoFiles = signal<File[]>([]);

  zones = ['Bastos', 'Ngousso', 'Biyem-Assi', 'Essos', 'Cité Verte', 'Mvan',
    'Marché Central', 'Nlongkak', 'Ekounou', 'Tsinga', 'Mfandena'];

  categories = [
    { value: 'overflow', label: 'Débordement', icon: '🗑️' },
    { value: 'sensor', label: 'Capteur HS', icon: '📡' },
    { value: 'battery', label: 'Batterie', icon: '🔋' },
    { value: 'lid', label: 'Couvercle', icon: '🚪' },
    { value: 'connection', label: 'Connexion', icon: '📶' },
    { value: 'other', label: 'Autre', icon: '❓' },
  ];

  reportForm = this.fb.group({
    zone: ['', Validators.required],
    bin_id: [''],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    category: ['other', Validators.required],
    urgency_level: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
    quarter: [''],
  });

  ngOnInit(): void {
    const binId = this.route.snapshot.queryParamMap.get('bin_id');
    if (binId) this.reportForm.patchValue({ bin_id: binId });
    this.api.get('/bins', { limit: 50 }).subscribe((res: any) => this.bins.set(res.data || []));
  }

  getLocation(): void {
    this.gpsLoading.set(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        this.lat.set(pos.coords.latitude);
        this.lng.set(pos.coords.longitude);
        this.gpsSet.set(true);
        this.gpsLoading.set(false);
      },
      () => { this.toast.warning('GPS non disponible'); this.gpsLoading.set(false); }
    );
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); }
  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragging.set(false);
    this.processFiles(Array.from(e.dataTransfer?.files || []));
  }
  onFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.processFiles(Array.from(input.files || []));
  }
  processFiles(files: File[]): void {
    const current = this.photoFiles();
    const allowed = files.filter(f => f.type.startsWith('image/')).slice(0, 5 - current.length);
    this.photoFiles.update(p => [...p, ...allowed]);
    allowed.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => this.photoPreviews.update(p => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }
  removePhoto(i: number): void {
    this.photoPreviews.update(p => p.filter((_, idx) => idx !== i));
    this.photoFiles.update(p => p.filter((_, idx) => idx !== i));
  }

  urgencyLabel(): string {
    return ['', 'Très faible', 'Faible', 'Modéré', 'Élevé', '🚨 Critique'][this.reportForm.get('urgency_level')?.value || 1];
  }

  getCategoryLabel(): string {
    return this.categories.find(c => c.value === this.reportForm.get('category')?.value)?.label || '';
  }

  submit(): void {
    if (this.reportForm.invalid) return;
    this.loading.set(true);
    const fd = new FormData();
    Object.entries(this.reportForm.value).forEach(([k, v]) => { if (v !== null && v !== '') fd.append(k, String(v)); });
    if (this.gpsSet()) { fd.set('lat', String(this.lat())); fd.set('lng', String(this.lng())); }
    this.photoFiles().forEach(f => fd.append('photos', f));

    this.api.upload('/reports', fd).subscribe({
      next: () => {
        this.toast.success('Signalement envoyé !', 'Merci pour votre contribution à Yaoundé.');
        this.router.navigate(['/app/dashboard']);
      },
      error: (err: any) => { this.toast.error('Erreur envoi', err.message); this.loading.set(false); },
      complete: () => this.loading.set(false),
    });
  }
}
