import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Slide {
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  color: string;
  gradient: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="onboarding" [style.background]="slides[current()].gradient">
      <!-- Skip -->
      <button class="skip-btn" (click)="skip()">Passer</button>

      <!-- Slides -->
      <div class="slides-wrap">
        @for (slide of slides; track $index) {
          <div class="slide" [class.active]="$index === current()" [class.prev]="$index < current()">
            <div class="slide-emoji">{{ slide.emoji }}</div>
            <div class="slide-content">
              <h1>{{ slide.title }}</h1>
              <h2>{{ slide.subtitle }}</h2>
              <p>{{ slide.description }}</p>
            </div>
          </div>
        }
      </div>

      <!-- Indicators -->
      <div class="indicators">
        @for (slide of slides; track $index) {
          <button class="dot" [class.active]="$index === current()" (click)="goTo($index)"></button>
        }
      </div>

      <!-- Actions -->
      <div class="actions">
        @if (current() < slides.length - 1) {
          <button class="btn-next" (click)="next()">
            Suivant
            <i class="ri-arrow-right-line" style="font-size: 20px;"></i>
          </button>
        } @else {
          <button class="btn-start" (click)="goToRegister()">
            Commencer maintenant
            <i class="ri-leaf-line" style="font-size: 18px;"></i>
          </button>
          <button class="btn-login" (click)="goToLogin()">
            J'ai déjà un compte
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .onboarding {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      padding: 60px 32px 40px;
      transition: background 0.6s ease;
    }

    .skip-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      top: calc(20px + env(safe-area-inset-top));
      background: rgba(255,255,255,0.25);
      border: none;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      backdrop-filter: blur(8px);
    }

    .slides-wrap {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }

    .slide {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      opacity: 0;
      transform: translateX(60px);
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;

      &.active {
        opacity: 1;
        transform: translateX(0);
        pointer-events: all;
      }

      &.prev {
        opacity: 0;
        transform: translateX(-60px);
      }
    }

    .slide-emoji {
      font-size: 96px;
      line-height: 1;
      margin-bottom: 32px;
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.15));
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }

    .slide-content {
      color: #fff;

      h1 {
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 8px;
        text-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }

      h2 {
        font-size: 18px;
        font-weight: 600;
        opacity: 0.85;
        margin-bottom: 16px;
      }

      p {
        font-size: 15px;
        opacity: 0.8;
        line-height: 1.7;
        max-width: 320px;
        margin: 0 auto;
      }
    }

    .indicators {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 24px 0;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.4);
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;

      &.active {
        width: 28px;
        background: #fff;
      }
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn-next {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: rgba(255,255,255,0.25);
      color: #fff;
      border: 2px solid rgba(255,255,255,0.5);
      padding: 16px 32px;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
      width: 100%;

      &:hover { background: rgba(255,255,255,0.35); }
      &:active { transform: scale(0.97); }
    }

    .btn-start {
      background: #fff;
      color: var(--primary);
      border: none;
      padding: 18px 32px;
      border-radius: 16px;
      font-size: 17px;
      font-weight: 800;
      cursor: pointer;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      transition: all 0.2s ease;

      &:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.25); }
      &:active { transform: scale(0.98); }
    }

    .btn-login {
      background: transparent;
      color: rgba(255,255,255,0.9);
      border: none;
      padding: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  `]
})
export class OnboardingComponent {
  current = signal(0);

  slides: Slide[] = [
    {
      title: 'BINOVA',
      subtitle: 'Yaoundé plus propre',
      description: 'Suivez en temps réel le niveau de remplissage des bacs connectés dans votre quartier.',
      emoji: '🗺️',
      color: '#2C7A3E',
      gradient: 'linear-gradient(160deg, #2C7A3E 0%, #16A34A 60%, #00D2FF 100%)'
    },
    {
      title: 'Signalez',
      subtitle: 'Agissez pour votre ville',
      description: 'Photographiez et signalez un bac débordant, une décharge sauvage ou un problème d\'hygiène.',
      emoji: '📸',
      color: '#00A86B',
      gradient: 'linear-gradient(160deg, #059669 0%, #10B981 50%, #34D399 100%)'
    },
    {
      title: 'Gagnez',
      subtitle: 'Devenez Ambassadeur Vert',
      description: 'Accumulez des points, déverrouillez des badges et montez dans le classement de votre quartier.',
      emoji: '🏆',
      color: '#F59E0B',
      gradient: 'linear-gradient(160deg, #D97706 0%, #F59E0B 50%, #FCD34D 100%)'
    }
  ];

  constructor(private router: Router) {
    if (localStorage.getItem('binova_onboarded')) {
      this.router.navigate(['/auth/login']);
    }
  }

  next() {
    if (this.current() < this.slides.length - 1) {
      this.current.update(v => v + 1);
    }
  }

  goTo(index: number) { this.current.set(index); }

  skip() { this.goToLogin(); }

  goToRegister() {
    localStorage.setItem('binova_onboarded', '1');
    this.router.navigate(['/auth/register']);
  }

  goToLogin() {
    localStorage.setItem('binova_onboarded', '1');
    this.router.navigate(['/auth/login']);
  }
}
