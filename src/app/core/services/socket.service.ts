/**
 * BINOVA — Service Socket.io temps réel
 * Fichier : src/app/core/services/socket.service.ts
 */

import { Injectable, inject } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { AuthService } from './auth.service';

declare const io: any; // Socket.io chargé globalement

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: any = null;
  private auth = inject(AuthService);

  readonly binUpdate = new EventEmitter<any>();
  readonly binAlert = new EventEmitter<any>();
  readonly reportNew = new EventEmitter<any>();
  readonly messageNew = new EventEmitter<any>();
  readonly statsLive = new EventEmitter<any>();

  connect(): void {
    if (this.socket?.connected) return;
    const token = this.auth.token();
    if (!token) return;
    try {
      this.socket = io('http://localhost:3000/citizen', { auth: { token }, transports: ['websocket', 'polling'] });
      this.socket.on('connect', () => {
        console.log('🔌 Socket citoyen connecté');
        const zone = this.auth.user()?.zone;
        if (zone) this.socket.emit('join:zone', zone);
      });
      this.socket.on('bin:update', (d: any) => this.binUpdate.emit(d));
      this.socket.on('bin:alert', (d: any) => this.binAlert.emit(d));
      this.socket.on('report:new', (d: any) => this.reportNew.emit(d));
      this.socket.on('message:new', (d: any) => this.messageNew.emit(d));
      this.socket.on('stats:live', (d: any) => this.statsLive.emit(d));
      this.socket.on('disconnect', () => console.log('🔌 Socket déconnecté'));
      this.socket.on('connect_error', (e: any) => console.error('[Socket]', e.message));
    } catch (e) { console.error('[Socket Init]', e); }
  }

  disconnect(): void { this.socket?.disconnect(); }
  joinRoom(roomId: string): void { this.socket?.emit('join:room', roomId); }
  sendTyping(roomId: string, isTyping: boolean): void { this.socket?.emit('report:typing', { roomId, isTyping }); }
}
