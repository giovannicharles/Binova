// ===== src/main.ts =====
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from 'src/app/app.config';

import { AppComponent } from 'src/app/app.component';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// Enable Service Worker for PWA
if ('serviceWorker' in navigator && environment.production) {
  navigator.serviceWorker.register('/ngsw-worker.js')
    .then(() => console.log('Service Worker registered'))
    .catch((err) => console.error('Service Worker registration failed:', err));
}

