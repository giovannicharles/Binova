/**
 * BINOVA — Admin Dashboard
 * Fichier : src/app/features/admin-dashboard/admin-dashboard.component.ts
 */

import { Component } from '@angular/core';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  template: `
<div class="admin-dashboard">
  <h1>Admin Dashboard</h1>
  <p>Tableau de bord administrateur</p>
</div>
  `,
  styles: [`
    .admin-dashboard { padding: 2rem; }
    h1 { color: #1A3A6B; margin-bottom: 0.5rem; }
  `]
})
export class AdminDashboardComponent {}
