/**
 * BINOVA — Smart Waste Management
 * Fichier : src/app/app.routes.ts
 * Auteur  : SGAO-SARL © 2026
 * Rôle    : Configuration du routing Angular (lazy-loading)
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Auth (sans shell)
  { path: 'auth/login', loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent) },
  { path: 'auth/register', loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent) },
  { path: 'auth/forgot-password', loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent) },

  // App citoyens (avec shell + guard)
  {
    path: 'app',
    // canActivate: [authGuard],
    loadComponent: () => import('./shared/components/app-shell.component').then(m => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'map', pathMatch: 'full' },
      { path: 'map', loadComponent: () => import('./features/map/bin-map.component').then(m => m.BinMapComponent) },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard-citizen.component').then(m => m.DashboardCitizenComponent) },
      { path: 'report', loadComponent: () => import('./features/report/report-form.component').then(m => m.ReportFormComponent) },
      { path: 'chat', loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'sensibilisation', loadComponent: () => import('./features/sensibilisation/sensibilisation.component').then(m => m.SensibilisationComponent) },
    ],
  },

  // Admin (avec guard rôle admin)
  {
    path: 'admin',
    // canActivate: [authGuard],
    loadComponent: () => import('./shared/components/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'map', loadComponent: () => import('./features/admin-map/admin-map.component').then(m => m.AdminMapComponent) },
      { path: 'bins', loadComponent: () => import('./features/admin-bins/admin-bins.component').then(m => m.AdminBinsComponent) },
      { path: 'reports', loadComponent: () => import('./features/admin-reports/admin-reports.component').then(m => m.AdminReportsComponent) },
      { path: 'stats', loadComponent: () => import('./features/admin-stats/admin-stats.component').then(m => m.AdminStatsComponent) },
      { path: 'users', loadComponent: () => import('./features/admin-users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'campaigns', loadComponent: () => import('./features/admin-campaigns/admin-campaigns.component').then(m => m.AdminCampaignsComponent) },
    ],
  },

  { path: '**', redirectTo: '/auth/login' },
];
