import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="chat-page">
      <!-- Header -->
      <div class="chat-header">
        <button class="back-btn" routerLink="/dashboard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div class="chat-info">
          <div class="chat-avatar">🌿</div>
          <div>
            <h2>Support BINOVA</h2>
            <span class="online-status">
              <span class="status-dot"></span>
              {{ typingUser() ? typingUser() + ' écrit...' : 'En ligne' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area" #messagesArea>
        @if (loading()) {
          <div class="loading-messages">
            @for (s of [1,2,3,4]; track s) {
              <div class="shimmer msg-skeleton" [class.right]="s % 2 === 0"></div>
            }
          </div>
        }

        @for (msg of messages(); track msg._id) {
          <div class="msg-wrap" [class.mine]="isMine(msg)">
            @if (!isMine(msg)) {
              <div class="msg-avatar">{{ msg.sender?.name?.charAt(0) }}</div>
            }
            <div class="msg-bubble" [class.mine]="isMine(msg)">
              @if (!isMine(msg)) {
                <span class="msg-sender">{{ msg.sender?.name }}</span>
              }
              @if (msg.type === 'image' && msg.imageUrl) {
                <img [src]="msg.imageUrl" class="msg-image" alt="Image">
              }
              @if (msg.content) {
                <p class="msg-text">{{ msg.content }}</p>
              }
              <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
            </div>
          </div>
        } @empty {
          @if (!loading()) {
            <div class="empty-chat">
              <span>💬</span>
              <p>Aucun message. Commencez la conversation !</p>
            </div>
          }
        }
      </div>

      <!-- Input area -->
      <div class="chat-input-area">
        <button class="attach-btn" (click)="triggerImageUpload()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <input #imageInput type="file" accept="image/*" hidden (change)="sendImage($event)">

        <div class="msg-input-wrap">
          <input class="msg-input" type="text" [(ngModel)]="messageText"
                 placeholder="Écrire un message..."
                 (keyup)="onTyping()"
                 (keyup.enter)="sendMessage()">
        </div>

        <button class="send-btn" [disabled]="!messageText.trim() && !imageFile"
                (click)="sendMessage()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
      height: 100dvh; display: flex; flex-direction: column; background: var(--bg-soft);
    }

    .chat-header {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; padding-top: calc(12px + env(safe-area-inset-top));
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: #fff; position: sticky; top: 0; z-index: 100;
    }

    .back-btn {
      width: 40px; height: 40px; border-radius: 12px;
      background: rgba(255,255,255,0.2); border: none; color: #fff;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
    }

    .chat-info { display: flex; align-items: center; gap: 10px; }

    .chat-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }

    .chat-info h2 { font-size: 16px; font-weight: 700; margin-bottom: 2px; }

    .online-status {
      font-size: 12px; opacity: 0.9;
      display: flex; align-items: center; gap: 5px;
    }

    .status-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #4ADE80;
      animation: pulse-green 2s infinite;
    }

    .messages-area {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      -webkit-overflow-scrolling: touch;
    }

    .loading-messages { display: flex; flex-direction: column; gap: 12px; }

    .msg-skeleton {
      height: 48px; border-radius: 16px; max-width: 65%;
      &.right { align-self: flex-end; }
    }

    .msg-wrap {
      display: flex; align-items: flex-end; gap: 8px;
      animation: slide-up 0.25s ease;

      &.mine { flex-direction: row-reverse; }
    }

    .msg-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: #fff; font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .msg-bubble {
      max-width: 72%; padding: 10px 14px;
      background: var(--bg); border-radius: 18px 18px 18px 4px;
      box-shadow: var(--shadow-sm);

      &.mine {
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        color: #fff;
        border-radius: 18px 18px 4px 18px;
      }
    }

    .msg-sender { font-size: 11px; font-weight: 700; color: var(--primary); display: block; margin-bottom: 4px; }
    .msg-bubble.mine .msg-sender { color: rgba(255,255,255,0.8); }

    .msg-text { font-size: 14px; line-height: 1.6; word-break: break-word; }

    .msg-image { width: 100%; border-radius: 10px; max-width: 220px; display: block; margin-bottom: 6px; }

    .msg-time { font-size: 10px; color: var(--text-light); display: block; text-align: right; margin-top: 4px; }
    .msg-bubble.mine .msg-time { color: rgba(255,255,255,0.7); }

    .empty-chat { text-align: center; margin: auto; span { font-size: 48px; display: block; margin-bottom: 12px; } p { color: var(--text-muted); font-size: 14px; } }

    .chat-input-area {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; padding-bottom: calc(12px + env(safe-area-inset-bottom));
      background: var(--bg); border-top: 1px solid var(--border-light);
      position: sticky; bottom: 0;
    }

    .attach-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--bg-soft); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); transition: all var(--transition); flex-shrink: 0;
      &:hover { background: var(--primary-50); color: var(--primary); }
    }

    .msg-input-wrap { flex: 1; }

    .msg-input {
      width: 100%; padding: 12px 16px;
      background: var(--bg-soft); border: 2px solid var(--border);
      border-radius: 24px; font-size: 14px; color: var(--text);
      outline: none; transition: border-color 0.2s;
      &:focus { border-color: var(--primary); }
    }

    .send-btn {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      border: none; cursor: pointer; color: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: var(--shadow-green); transition: all var(--transition); flex-shrink: 0;
      &:hover { transform: scale(1.05); }
      &:active { transform: scale(0.95); }
      &:disabled { opacity: 0.4; transform: none; }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesArea') messagesArea!: ElementRef;

  messages = signal<any[]>([]);
  loading = signal(true);
  typingUser = signal('');
  messageText = '';
  imageFile: File | null = null;
  private roomId = 'support-general';
  private typingTimeout: any;
  private subs: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.socketService.connect();
    this.socketService.joinRoom(this.roomId);
    this.loadMessages();

    this.subs.push(
      this.socketService.on<any>('message:new').subscribe(({ message }) => {
        this.messages.update(m => [...m, message]);
      }),
      this.socketService.on<any>('message:typing').subscribe(({ name, isTyping }) => {
        this.typingUser.set(isTyping ? name : '');
        if (isTyping) {
          clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => this.typingUser.set(''), 3000);
        }
      })
    );
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.socketService.leaveRoom(this.roomId);
    this.subs.forEach(s => s.unsubscribe());
  }

  loadMessages() {
    this.http.get(`${environment.apiUrl}/messages/${this.roomId}`).subscribe({
      next: (res: any) => { this.messages.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  sendMessage() {
    if (!this.messageText.trim() && !this.imageFile) return;

    const fd = new FormData();
    fd.append('room', this.roomId);
    if (this.messageText.trim()) fd.append('content', this.messageText);
    if (this.imageFile) fd.append('image', this.imageFile);

    this.http.post(`${environment.apiUrl}/messages`, fd).subscribe({
      next: () => {
        this.messageText = '';
        this.imageFile = null;
      }
    });

    this.socketService.typing(this.roomId, false);
  }

  onTyping() {
    this.socketService.typing(this.roomId, true);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => this.socketService.typing(this.roomId, false), 2000);
  }

  triggerImageUpload() {
    document.querySelector<HTMLInputElement>('input[type=file]')?.click();
  }

  sendImage(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageFile = file;
    this.sendMessage();
  }

  isMine(msg: any): boolean {
    return msg.sender?._id === this.authService.currentUser?._id;
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  scrollToBottom() {
    try {
      const el = this.messagesArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
