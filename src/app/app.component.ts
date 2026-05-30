import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Vérifier le token au démarrage
    if (this.authService.token) {
      this.authService.getMe().subscribe({
        error: () => {} // Géré par l'interceptor
      });
    }
  }
}
