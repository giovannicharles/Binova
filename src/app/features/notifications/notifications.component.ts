import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <h2 style="font-size:20px;margin-bottom:16px">Notifications 🔔</h2>

      @if (notifications().length === 0) {
        <div class="empty-state">
          <span>🔔</span>
          <p>Aucune notification pour l'instant</p>
        </div>
      } @else {
        <div class="notif-list">
          @for (notif of notifications(); track $index) {
            <div class="notif-card animate-slide-up" [class.unread]="!notif.read" (click)="markRead(notif)">
              <div class="notif-icon">{{ notif.icon }}</div>
              <div class="notif-content">
                <strong>{{ notif.title }}</strong>
                <p>{{ notif.body }}</p>
                <span class="notif-time">{{ notif.time }}</span>
              </div>
              @if (!notif.read) { <div class="unread-dot"></div> }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notif-list { display:flex;flex-direction:column;gap:10px; }
    .notif-card { display:flex;align-items:flex-start;gap:12px;background:var(--bg);border-radius:14px;padding:14px 16px;box-shadow:var(--shadow-sm);cursor:pointer;transition:all var(--transition);&.unread{border-left:3px solid var(--primary);}&:active{transform:scale(0.98)} }
    .notif-icon { font-size:28px;flex-shrink:0; }
    .notif-content { flex:1;min-width:0; strong{font-size:14px;font-weight:700;display:block;margin-bottom:4px} p{font-size:13px;color:var(--text-muted);line-height:1.5} }
    .notif-time { font-size:11px;color:var(--text-light);margin-top:4px;display:block; }
    .unread-dot { width:10px;height:10px;border-radius:50%;background:var(--primary);flex-shrink:0;margin-top:4px; }
    .empty-state { text-align:center;padding:60px 20px;span{font-size:56px;display:block;margin-bottom:16px}p{color:var(--text-muted)} }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications = signal<any[]>([]);

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    // Notifications préchargées (en pratique, stockées localement + depuis l'API)
    this.notifications.set([
      { title: 'Bac Bastos #1', body: 'Le bac est à 95% de capacité', icon: '🚨', time: 'Il y a 5 min', read: false },
      { title: 'Signalement résolu', body: 'Votre signalement RPT-001 a été résolu', icon: '✅', time: 'Il y a 2h', read: false },
      { title: 'Collecte prévue', body: 'Une collecte est prévue dans votre zone demain', icon: '🚛', time: 'Hier', read: true },
      { title: 'Nouveau badge !', body: 'Vous avez débloqué le badge Recycleur ♻️', icon: '🏆', time: 'Il y a 3 jours', read: true }
    ]);

    this.socketService.connect();
    this.socketService.on<any>('alert:broadcast').subscribe(data => {
      this.notifications.update(n => [{
        title: data.title, body: data.body, icon: '🔔',
        time: 'À l\'instant', read: false
      }, ...n]);
    });

    this.socketService.on<any>('bin:alert').subscribe(data => {
      this.notifications.update(n => [{
        title: `Alerte bac ${data.bin?.name}`,
        body: data.message,
        icon: data.type === 'critical' ? '🚨' : '⚠️',
        time: 'À l\'instant', read: false
      }, ...n]);
    });
  }

  markRead(notif: any) {
    notif.read = true;
  }
}
