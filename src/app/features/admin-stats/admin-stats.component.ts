/**
 * BINOVA — Admin Stats
 * Fichier : src/app/features/admin-stats/admin-stats.component.ts
 */

import { Component } from '@angular/core';

@Component({
  selector: 'admin-stats',
  standalone: true,
  template: `
<div class="admin-stats">
  <h1>Admin Stats</h1>
  <p>Statistiques</p>
</div>
  `,
  styles: [`
    .admin-stats { padding: 2rem; }
    h1 { color: #1A3A6B; margin-bottom: 0.5rem; }
  `]
})
export class AdminStatsComponent {}
