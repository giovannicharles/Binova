/**
 * BINOVA — Admin Users
 * Fichier : src/app/features/admin-users/admin-users.component.ts
 */

import { Component } from '@angular/core';

@Component({
  selector: 'admin-users',
  standalone: true,
  template: `
<div class="admin-users">
  <h1>Admin Users</h1>
  <p>Gestion des utilisateurs</p>
</div>
  `,
  styles: [`
    .admin-users { padding: 2rem; }
    h1 { color: #1A3A6B; margin-bottom: 0.5rem; }
  `]
})
export class AdminUsersComponent {}
