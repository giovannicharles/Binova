/**
 * BINOVA — Admin Map
 * Fichier : src/app/features/admin-map/admin-map.component.ts
 */

import { Component } from '@angular/core';

@Component({
  selector: 'admin-map',
  standalone: true,
  template: `
<div class="admin-map">
  <h1>Admin Map</h1>
  <p>Carte administrative</p>
</div>
  `,
  styles: [`
    .admin-map { padding: 2rem; }
    h1 { color: #1A3A6B; margin-bottom: 0.5rem; }
  `]
})
export class AdminMapComponent {}
