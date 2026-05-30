import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';

interface NavItem {
  path: string;
  icon: string;
  activeIcon: string;
  label: string;
  badge?: number;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="shell">
      <!-- Top Bar -->
      <header class="top-bar" [class.hidden]="hideTopBar()">
        <div class="top-bar-left">
          <div class="logo">
            <svg width="28" height="28" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" fill="var(--primary-100)"/>
              <path d="M40 16C40 16 22 27 22 43C22 53.5 30 62 40 62C50 62 58 53.5 58 43C58 27 40 16 40 16Z" fill="var(--primary)"/>
              <path d="M31 52L40 36L49 52" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="40" cy="33" r="3.5" fill="white"/>
            </svg>
            <span class="logo-text">BINOVA</span>
          </div>
        </div>
        <div class="top-bar-right">
          <button class="icon-btn" routerLink="/notifications" aria-label="Notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            @if (notifCount() > 0) {
              <span class="notif-badge">{{ notifCount() > 9 ? '9+' : notifCount() }}</span>
            }
          </button>
          <button class="avatar-btn" routerLink="/profile">
            @if (user()?.avatarUrl) {
              <img [src]="user()?.avatarUrl" [alt]="user()?.name" class="avatar-img">
            } @else {
              <div class="avatar-placeholder">{{ user()?.name?.charAt(0)?.toUpperCase() }}</div>
            }
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content" [class.no-nav]="hideNav()">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Navigation -->
      @if (!hideNav()) {
        <nav class="bottom-nav">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-item"
               [class.active]="isActive(item.path)"
               (click)="onNavClick(item.path)">
              <div class="nav-icon-wrap">
                <svg class="nav-icon" [innerHTML]="isActive(item.path) ? item.activeIcon : item.icon" width="24" height="24" viewBox="0 0 24 24"></svg>
                @if (item.badge && item.badge > 0) {
                  <span class="nav-badge">{{ item.badge }}</span>
                }
              </div>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>
      }
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      background: var(--bg-soft);
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      padding-top: calc(12px + var(--safe-top));
      background: var(--bg);
      border-bottom: 1px solid var(--border-light);
      position: sticky;
      top: 0;
      z-index: 200;
      backdrop-filter: blur(12px);
      background: rgba(255,255,255,0.95);

      &.hidden { display: none; }
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: 2px;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--bg-soft);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      position: relative;
      transition: all var(--transition);

      &:hover { background: var(--primary-50); color: var(--primary); }
    }

    .notif-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: var(--alert-red);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid var(--bg);
    }

    .avatar-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid var(--primary-light);
      cursor: pointer;
      overflow: hidden;
      background: none;
      padding: 0;
      transition: all var(--transition);

      &:hover { border-color: var(--primary); transform: scale(1.05); }
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;

      &.no-nav { padding-bottom: 0; }
    }

    .bottom-nav {
      display: flex;
      align-items: center;
      background: var(--bg);
      border-top: 1px solid var(--border-light);
      padding: 0 8px;
      padding-bottom: var(--safe-bottom);
      position: sticky;
      bottom: 0;
      z-index: 200;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
    }

    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 10px 4px;
      text-decoration: none;
      color: var(--text-light);
      transition: all var(--transition);
      cursor: pointer;
      border-radius: 12px;
      margin: 4px 2px;

      &.active {
        color: var(--primary);
        .nav-icon-wrap { background: var(--primary-50); }
      }

      &:active { transform: scale(0.92); }
    }

    .nav-icon-wrap {
      width: 40px;
      height: 32px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all var(--transition);
    }

    .nav-icon {
      width: 22px;
      height: 22px;
    }

    .nav-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: var(--alert-red);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid var(--bg);
    }

    .nav-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
  `]
})
export class ShellComponent implements OnInit, OnDestroy {
  user = this.authService.user;
  notifCount = signal(0);
  hideNav = signal(false);
  hideTopBar = signal(false);

  navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Accueil',
      icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2" fill="none"/>',
      activeIcon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="var(--primary)" stroke="var(--primary)" stroke-width="1.5"/><polyline points="9 22 9 12 15 12 15 22" stroke="white" stroke-width="2" fill="none"/>'
    },
    {
      path: '/map',
      label: 'Carte',
      icon: '<circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" stroke="currentColor" stroke-width="2" fill="none"/>',
      activeIcon: '<path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" fill="var(--primary)" stroke="var(--primary)" stroke-width="1"/><circle cx="12" cy="10" r="3" fill="white"/>'
    },
    {
      path: '/reports/new',
      label: 'Signaler',
      icon: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>',
      activeIcon: '<circle cx="12" cy="12" r="10" fill="var(--primary)"/><line x1="12" y1="8" x2="12" y2="16" stroke="white" stroke-width="2.5"/><line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2.5"/>'
    },
    {
      path: '/chat',
      label: 'Chat',
      icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" fill="none"/>',
      activeIcon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="var(--primary)" stroke="var(--primary)" stroke-width="1"/>'
    },
    {
      path: '/profile',
      label: 'Profil',
      icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/>',
      activeIcon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="var(--primary)" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" fill="var(--primary)" stroke="var(--primary)" stroke-width="1"/>'
    }
  ];

  private sub!: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.sub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url = e.urlAfterRedirects;
      this.hideNav.set(url.includes('/reports/new') || url.includes('/chat/'));
      this.hideTopBar.set(url.includes('/reports/new'));
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '/');
  }

  onNavClick(path: string) {
    if (this.router.url === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
