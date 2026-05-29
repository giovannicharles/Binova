/**
 * BINOVA — Admin Shell
 * Fichier : src/app/shared/components/admin-shell.component.ts
 */

import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="admin-shell">
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>BINOVA Admin</h2>
    </div>
    <nav class="sidebar-nav">
      <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">📊</span>
        <span>Dashboard</span>
      </a>
      <a routerLink="/admin/map" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">🗺️</span>
        <span>Carte</span>
      </a>
      <a routerLink="/admin/bins" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">🗑️</span>
        <span>Bacs</span>
      </a>
      <a routerLink="/admin/reports" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">📢</span>
        <span>Signalements</span>
      </a>
      <a routerLink="/admin/stats" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">📈</span>
        <span>Statistiques</span>
      </a>
      <a routerLink="/admin/users" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">👥</span>
        <span>Utilisateurs</span>
      </a>
      <a routerLink="/admin/campaigns" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">📣</span>
        <span>Campagnes</span>
      </a>
    </nav>
  </aside>
  <main class="admin-main">
    <router-outlet></router-outlet>
  </main>
</div>
  `,
  styles: [`
    .admin-shell { display: flex; height: 100vh; }
    .sidebar {
      width: 250px; background: #1A3A6B; color: white;
      display: flex; flex-direction: column;
    }
    .sidebar-header {
      padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .sidebar-header h2 { margin: 0; font-size: 1.25rem; }
    .sidebar-nav {
      flex: 1; padding: 1rem 0; display: flex; flex-direction: column; gap: 0.25rem;
    }
    .nav-link {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1.5rem; color: rgba(255,255,255,0.7);
      text-decoration: none; transition: all 0.2s;
    }
    .nav-link:hover { background: rgba(255,255,255,0.1); color: white; }
    .nav-link.active { background: rgba(255,255,255,0.15); color: white; border-left: 3px solid #27AE60; }
    .nav-icon { font-size: 1.25rem; }
    .admin-main { flex: 1; overflow-y: auto; background: #f5f5f5; }
  `]
})
export class AdminShellComponent {}
