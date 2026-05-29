/**
 * BINOVA — Admin Reports
 * Fichier : src/app/features/admin-reports/admin-reports.component.ts
 */

import { Component } from '@angular/core';

@Component({
  selector: 'admin-reports',
  standalone: true,
  template: `
<div class="admin-reports">
  <h1>Admin Reports</h1>
  <p>Gestion des signalements</p>
</div>
  `,
  styles: [`
    .admin-reports { padding: 2rem; }
    h1 { color: #1A3A6B; margin-bottom: 0.5rem; }
  `]
})
export class AdminReportsComponent {}
