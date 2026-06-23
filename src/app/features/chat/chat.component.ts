import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="chat-page">
      <!-- Header -->
      <div class="chat-header">
        <button class="back-btn" routerLink="/dashboard">
          <i class="ri-arrow-left-line" style="font-size: 20px;"></i>
        </button>
        <div class="chat-info">
          <div class="chat-avatar">
            <i class="ri-leaf-line" style="font-size: 24px;"></i>
          </div>
          <div>
            <h2>Support BINOVA</h2>
            <span class="online-status">
              <span class="status-dot"></span>
              @if (socketConnected()) {
                En ligne
              } @else {
                Hors ligne
              }
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

        @if (typingUsers().length > 0) {
          <div class="typing-indicator">
            <span class="typing-dots"></span>
            <span>{{ typingUsers().join(', ') }} est en train d'écrire...</span>
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
              @if (isMine(msg)) {
                <span class="msg-read-status">
                  <i class="ri-check-double-line" [class.read]="msg.read"></i>
                </span>
              }
            </div>
          </div>
        } @empty {
          @if (!loading()) {
            <div class="empty-chat">
              <i class="ri-chat-3-line" style="font-size: 48px;"></i>
              <p>Aucun message. Commencez la conversation !</p>
            </div>
          }
        }
      </div>

      <!-- Input area -->
      <div class="chat-input-area">
        <button class="attach-btn" (click)="triggerImageUpload()">
          <i class="ri-image-add-line" style="font-size: 20px;"></i>
        </button>
        <input #imageInput type="file" accept="image/*" hidden (change)="sendImage($event)">

        <div class="msg-input-wrap">
          <input class="msg-input" type="text" [(ngModel)]="messageText"
                 placeholder="Écrire un message..."
                 (keyup.enter)="sendMessage()"
                 (input)="onTyping()">
        </div>

        <button class="send-btn" [disabled]="!messageText.trim() && !imageFile"
                (click)="sendMessage()">
          <i class="ri-send-plane-fill" style="font-size: 20px;"></i>
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
      background: var(--primary);
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

    .typing-indicator {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: var(--bg-soft);
      border-radius: 16px;
      font-size: 12px;
      color: var(--text-muted);
      animation: slide-up 0.3s ease;
    }

    .typing-dots {
      display: flex; gap: 4px;
      span {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--primary-400);
        animation: typing-bounce 1.4s infinite ease-in-out both;
        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
      }
    }

    @keyframes typing-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .msg-wrap {
      display: flex; align-items: flex-end; gap: 8px;
      animation: slide-up 0.25s ease;

      &.mine { flex-direction: row-reverse; }
    }

    .msg-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--primary);
      color: #fff; font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .msg-bubble {
      max-width: 72%; padding: 10px 14px;
      background: var(--bg); border-radius: 18px 18px 18px 4px;
      box-shadow: var(--shadow-sm);

      &.mine {
        background: var(--primary);
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

    .msg-read-status {
      margin-left: 6px;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
      &.read { color: #4ade80; }
    }

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
      background: var(--primary);
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
  messageText = '';
  imageFile: File | null = null;
  socketConnected = signal(false);
  typingUsers = signal<string[]>([]);
  private roomId = 'support-general';
  private typingTimeout: any;

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.socketService.connect();
    this.socketService.isConnected$.subscribe(connected => {
      this.socketConnected.set(connected);
    });

    this.socketService.joinRoom(this.roomId);
    this.loadMessages();

    // Listen for new messages
    this.socketService.on<any>('message:new').subscribe(({ message }) => {
      this.messages.update(m => [...m, message]);
      this.scrollToBottom();
    });

    // Listen for typing indicators
    this.socketService.on<any>('message:typing').subscribe(({ userId, name, isTyping }) => {
      if (isTyping) {
        this.typingUsers.update(users => [...new Set([...users, name])]);
      } else {
        this.typingUsers.update(users => users.filter(u => u !== name));
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.socketService.leaveRoom(this.roomId);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
  }

  async loadMessages() {
    try {
      const response = await this.http.get<any>(`${environment.apiUrl}/messages/${this.roomId}`).toPromise();
      if (response?.success) {
        this.messages.set(response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
    this.loading.set(false);
  }

  async sendMessage() {
    if (!this.messageText.trim() && !this.imageFile) return;

    const formData = new FormData();
    formData.append('room', this.roomId);
    formData.append('content', this.messageText.trim());
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }

    try {
      await this.http.post(`${environment.apiUrl}/messages`, formData).toPromise();
      this.messageText = '';
      this.imageFile = null;
      this.socketService.emit('message:typing', { roomId: this.roomId, isTyping: false });
    } catch (error) {
      console.error('Error sending message:', error);
    }
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

  onTyping() {
    this.socketService.emit('message:typing', { roomId: this.roomId, isTyping: true });

    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.socketService.emit('message:typing', { roomId: this.roomId, isTyping: false });
    }, 1000);
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
    } catch { }
  }
}

