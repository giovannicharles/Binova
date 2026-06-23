import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket!: Socket;
  private connected$ = new BehaviorSubject<boolean>(false);

  readonly isConnected$ = this.connected$.asObservable();

  constructor(private authService: AuthService) {}

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: { token: this.authService.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connecté');
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket déconnecté');
      this.connected$.next(false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.connected$.next(false);
  }

  on<T>(event: string): Observable<T> {
    return new Observable(observer => {
      this.socket?.on(event, (data: T) => observer.next(data));
      return () => this.socket?.off(event);
    });
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  joinRoom(roomId: string) {
    this.emit('chat:join', roomId);
  }

  leaveRoom(roomId: string) {
    this.emit('chat:leave', roomId);
  }

  typing(roomId: string, isTyping: boolean) {
    this.emit('message:typing', { roomId, isTyping });
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
