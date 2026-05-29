/**
 * BINOVA — Admin Bins
 * Fichier : src/app/features/admin-bins/admin-bins.component.ts
 */

import { Component } from '@angular/core';

@Component({
  selector: 'admin-bins',
  standalone: true,
  template: `
<div class="admin-bins">
  <h1>Admin Bins</h1>
  <p>Gestion des bacs</p>
</div>
  `,
  styles: [`
    .admin-bins { padding: 2rem; }
    h1 { color: #1A3A6B; margin-bottom: 0.5rem; }
  `]
})
export class AdminBinsComponent {}
