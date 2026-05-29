/**
 * BINOVA — Admin Campaigns
 * Fichier : src/app/features/admin-campaigns/admin-campaigns.component.ts
 */

import { Component } from '@angular/core';

@Component({
  selector: 'admin-campaigns',
  standalone: true,
  template: `
<div class="admin-campaigns">
  <h1>Admin Campaigns</h1>
  <p>Gestion des campagnes</p>
</div>
  `,
  styles: [`
    .admin-campaigns { padding: 2rem; }
    h1 { color: #1A3A6B; margin-bottom: 0.5rem; }
  `]
})
export class AdminCampaignsComponent {}
