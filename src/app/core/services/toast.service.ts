/**
 * BINOVA — Service Notifications Toast
 * Fichier : src/app/core/services/toast.service.ts
 */

import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string; type: 'success' | 'warning' | 'error' | 'info';
  title: string; body?: string; duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(toast: Omit<Toast, 'id'>): void {
    const id = Date.now().toString();
    this._toasts.update(t => [...t, { ...toast, id }]);
    setTimeout(() => this.remove(id), toast.duration || 4000);
  }

  success(title: string, body?: string): void { this.show({ type: 'success', title, body }); }
  warning(title: string, body?: string): void { this.show({ type: 'warning', title, body }); }
  error(title: string, body?: string): void   { this.show({ type: 'error', title, body, duration: 6000 }); }
  info(title: string, body?: string): void    { this.show({ type: 'info', title, body }); }
  remove(id: string): void { this._toasts.update(t => t.filter(x => x.id !== id)); }
}
