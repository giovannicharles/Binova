/**
 * BINOVA — Smart Waste Management
 * Fichier : src/app/features/chat/chat.component.ts
 * Auteur  : SGAO-SARL © 2026
 * Rôle    : Chat citoyen ↔ admin, bulles WhatsApp-style, typing indicator, upload image
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';
import { Subscription } from 'rxjs';

interface Message {
  id: string; sender_id: string; room_id: string; content: string;
  type: string; createdAt: string; sender?: { name: string; avatar_url?: string };
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="chat-wrap">
  <!-- Header -->
  <div class="chat-header">
    <div class="chat-avatar">🛡️</div>
    <div>
      <h3>Support BINOVA</h3>
      <span class="online-dot"></span><span class="online-txt">En ligne</span>
    </div>
  </div>

  <!-- Messages -->
  <div class="messages-wrap" #messagesEl>
    <div class="messages-list">
      <!-- Chargement initial -->
      <div *ngIf="loading()" class="loading-msgs">
        <div class="skeleton skeleton-card" *ngFor="let _ of [1,2,3]"></div>
      </div>

      <!-- Messages -->
      <div class="msg-item" *ngFor="let m of messages(); trackBy: trackMsg"
           [class.mine]="m.sender_id === currentUserId()"
           [class.theirs]="m.sender_id !== currentUserId()">
        <!-- Avatar (messages reçus) -->
        <div class="msg-avatar" *ngIf="m.sender_id !== currentUserId()">
          {{ m.sender?.name?.[0] || 'S' }}
        </div>
        <div class="msg-bubble-wrap">
          <!-- Nom expéditeur (messages reçus) -->
          <span class="msg-sender" *ngIf="m.sender_id !== currentUserId()">
            {{ m.sender?.name }}
          </span>
          <!-- Bulle message -->
          <div class="msg-bubble">
            <img *ngIf="m.type === 'image'" [src]="m.content" class="msg-img" alt="image">
            <p *ngIf="m.type !== 'image'">{{ m.content }}</p>
          </div>
          <span class="msg-time">{{ m.createdAt | date:'HH:mm' }}</span>
        </div>
      </div>

      <!-- Typing indicator -->
      <div class="typing-indicator" *ngIf="isTyping()">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  </div>

  <!-- Barre de saisie -->
  <div class="chat-input-bar">
    <button type="button" class="attach-btn" (click)="photoInput.click()" title="Envoyer une photo">📷</button>
    <input #photoInput type="file" accept="image/*" style="display:none" (change)="sendPhoto($event)">
    <form [formGroup]="msgForm" (ngSubmit)="sendMsg()" class="msg-form">
      <input formControlName="content" type="text" class="msg-input"
             placeholder="Écrire un message..."
             (input)="onTyping()" (keydown.enter)="sendMsg()">
      <button type="submit" class="send-btn" [disabled]="msgForm.invalid || sending()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </form>
  </div>
</div>
  `,
  styles: [`
    .chat-wrap {
      display: flex; flex-direction: column; height: 100vh;
      background: #f0faf0;
    }
    .chat-header {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem 1.25rem; background: #2D7D2D; color: white;
      box-shadow: 0 2px 8px rgba(45,125,45,0.3);
    }
    .chat-avatar {
      width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }
    h3 { margin: 0; font-size: 1rem; }
    .online-dot {
      display: inline-block; width: 8px; height: 8px; background: #F5C100;
      border-radius: 50%; margin-right: 0.25rem;
    }
    .online-txt { font-size: 0.75rem; opacity: 0.8; }

    .messages-wrap { flex: 1; overflow-y: auto; padding: 1rem; }
    .messages-list { display: flex; flex-direction: column; gap: 0.75rem; min-height: 100%; justify-content: flex-end; }
    .loading-msgs { display: flex; flex-direction: column; gap: 0.5rem; }

    .msg-item {
      display: flex; align-items: flex-end; gap: 0.5rem;
      animation: slideUp 0.25s ease both;
      &.mine { flex-direction: row-reverse; }
      &.theirs { flex-direction: row; }
    }
    @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    .msg-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: #1A3A6B; color: white; display: flex; align-items: center;
      justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }
    .msg-bubble-wrap { display: flex; flex-direction: column; max-width: 75%; }
    .msg-sender { font-size: 0.7rem; color: #666; margin-bottom: 0.15rem; padding-left: 0.5rem; }

    .msg-bubble {
      padding: 0.65rem 0.9rem; border-radius: 18px; word-break: break-word;
      .mine & {
        background: #2D7D2D; color: white;
        border-bottom-right-radius: 4px;
        p { margin: 0; font-size: 0.9rem; }
      }
      .theirs & {
        background: white; color: #1A1A1A;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        p { margin: 0; font-size: 0.9rem; }
      }
    }
    .msg-img { max-width: 200px; border-radius: 10px; display: block; }
    .msg-time { font-size: 0.65rem; color: #999; padding: 0 0.25rem; margin-top: 0.15rem; }
    .mine .msg-time { text-align: right; }

    .typing-indicator {
      display: flex; align-items: center; gap: 4px; padding: 0.65rem 0.9rem;
      background: white; border-radius: 18px; border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08); width: 60px;
    }
    .typing-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #95A5A6;
      animation: typingBounce 1.2s infinite;
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
    @keyframes typingBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }

    .chat-input-bar {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1rem; background: white;
      box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
    }
    .attach-btn {
      background: none; border: none; font-size: 1.25rem; cursor: pointer;
      width: 40px; height: 40px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; transition: background 0.2s;
      &:hover { background: #f0faf0; }
    }
    .msg-form { flex: 1; display: flex; gap: 0.5rem; }
    .msg-input {
      flex: 1; padding: 0.65rem 1rem; border: 1.5px solid #dde8dd;
      border-radius: 24px; font-size: 0.9rem; outline: none; background: #f8fdf8;
      &:focus { border-color: #2D7D2D; background: white; }
    }
    .send-btn {
      width: 42px; height: 42px; border-radius: 50%; background: #2D7D2D; color: white;
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; flex-shrink: 0;
      &:hover { background: #245e24; transform: scale(1.05); }
      &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesEl') private messagesEl!: ElementRef;
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private socket = inject(SocketService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  messages = signal<Message[]>([]);
  loading = signal(true);
  sending = signal(false);
  isTyping = signal(false);
  private typingTimeout: any;
  private subs: Subscription[] = [];

  readonly currentUserId = () => this.auth.user()?.id;
  readonly roomId = 'support-' + (this.auth.user()?.id || 'anon');

  msgForm = this.fb.group({ content: ['', [Validators.required, Validators.maxLength(5000)]] });

  ngOnInit(): void {
    this.api.get(`/messages/${this.roomId}`).subscribe({
      next: (res: any) => { this.messages.set(res.data || []); this.loading.set(false); this.scrollBottom(); },
      error: () => this.loading.set(false),
    });
    this.socket.connect();
    this.socket.joinRoom(this.roomId);
    const sub = this.socket.messageNew.subscribe((msg: Message) => {
      if (msg.room_id === this.roomId) {
        this.messages.update(m => [...m, msg]);
        this.isTyping.set(false);
        setTimeout(() => this.scrollBottom(), 50);
      }
    });
    this.subs.push(sub);
  }

  sendMsg(): void {
    const content = this.msgForm.get('content')?.value?.trim();
    if (!content || this.sending()) return;
    this.sending.set(true);
    this.api.post('/messages', { room_id: this.roomId, content, type: 'text' }).subscribe({
      next: (res: any) => {
        this.messages.update(m => [...m, res.data]);
        this.msgForm.reset();
        this.sending.set(false);
        setTimeout(() => this.scrollBottom(), 50);
      },
      error: () => this.sending.set(false),
    });
  }

  sendPhoto(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    this.api.upload('/messages/upload', fd).subscribe({
      next: (res: any) => {
        this.api.post('/messages', { room_id: this.roomId, content: res.data.url, type: 'image' }).subscribe();
      },
      error: () => this.toast.error('Erreur upload photo'),
    });
  }

  onTyping(): void {
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => { }, 2000);
  }

  trackMsg(_: number, m: Message) { return m.id; }

  private scrollBottom(): void {
    const el = this.messagesEl?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}
