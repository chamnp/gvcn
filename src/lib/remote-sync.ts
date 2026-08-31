import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SoundEffectType, playSoundEffect } from './sound-effects';

export interface RemoteLaserPayload {
  x: number; // 0 to 100 percentage of screen width
  y: number; // 0 to 100 percentage of screen height
  active: boolean;
  mode: 'LASER' | 'SPOTLIGHT';
}

export interface RemoteStatePayload {
  sessionCode: string;
  className: string;
  teacherName: string;
  activeContext: 'LESSON_PLAN' | 'CLASSROOM_TOOLS' | 'PARENT_MEETING' | 'IDLE';
  currentSlide?: number;
  totalSlides?: number;
  slideTitle?: string;
  phase?: string; // 'KHỞI ĐỘNG' | 'KHÁM PHÁ' | 'LUYỆN TẬP' | 'VẬN DỤNG'
  presenterNotes?: string[];
  quizQuestion?: string;
  quizOptions?: string[];
  correctAnswerIndex?: number;
  isAnswerRevealed?: boolean;
  isTimerRunning?: boolean;
  timeRemaining?: number;
  timerDuration?: number;
  luckyWheelWinner?: string;
  trafficLightStatus?: 'GREEN' | 'YELLOW' | 'RED';
  studentsList?: Array<{
    id: string;
    fullName: string;
    studentCode?: string;
    stars?: number;
  }>;
}

export type RemoteActionType =
  | 'CONNECT'
  | 'DISCONNECT'
  | 'PING'
  | 'PONG'
  | 'SLIDE_NEXT'
  | 'SLIDE_PREV'
  | 'SLIDE_GOTO'
  | 'LASER_MOVE'
  | 'SPIN_WHEEL'
  | 'TIMER_START'
  | 'TIMER_PAUSE'
  | 'TIMER_RESET'
  | 'TIMER_SET'
  | 'REVEAL_ANSWER'
  | 'SELECT_OPTION'
  | 'PLAY_SFX'
  | 'TRAFFIC_LIGHT'
  | 'AWARD_STAR'
  | 'STATE_SYNC';

export interface RemoteMessage {
  type: RemoteActionType;
  sender: 'HOST_TV' | 'PHONE_REMOTE';
  payload?: any;
  timestamp: number;
}

// Generate random 6-character session code like "4A1-789"
export function generateSessionCode(className: string = '4A1'): string {
  const cleanClass = className.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || '4A1';
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${cleanClass}-${randomNum}`;
}

export function getRemotePairingUrl(sessionCode: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/remote?s=${encodeURIComponent(sessionCode)}`;
  }
  return `https://gvcn-eta.vercel.app/remote?s=${encodeURIComponent(sessionCode)}`;
}

// Local Haptic Feedback on Phone
export function triggerHaptic(durationMs: number = 40) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore if device doesn't allow vibration
    }
  }
}

// Robust Realtime Channel Controller with Persistent Callbacks & Heartbeat
export class RemoteSyncSession {
  private channel: RealtimeChannel | null = null;
  private localBroadcast: BroadcastChannel | null = null;
  private sessionCode: string;
  private role: 'HOST_TV' | 'PHONE_REMOTE';
  private onMessageCallback?: (msg: RemoteMessage) => void;
  private onConnectionChangeCallback?: (connected: boolean) => void;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isSubscribed: boolean = false;

  constructor(
    sessionCode: string,
    role: 'HOST_TV' | 'PHONE_REMOTE',
    onMessage?: (msg: RemoteMessage) => void,
    onConnectionChange?: (connected: boolean) => void
  ) {
    this.sessionCode = sessionCode.trim().toUpperCase();
    this.role = role;
    this.onMessageCallback = onMessage;
    this.onConnectionChangeCallback = onConnectionChange;
    this.init();
  }

  public setMessageHandler(fn: (msg: RemoteMessage) => void) {
    this.onMessageCallback = fn;
  }

  public setConnectionChangeHandler(fn: (connected: boolean) => void) {
    this.onConnectionChangeCallback = fn;
  }

  private init() {
    if (!this.sessionCode) return;
    const channelName = `gvcn_remote_room_${this.sessionCode}`;

    // Clean up existing channel if any
    try {
      const existingChannel = supabase.getChannels().find((c) => c.topic === channelName);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }
    } catch {
      // Ignore
    }

    // 1. Supabase Realtime Broadcast Channel
    this.channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    this.channel
      .on('broadcast', { event: 'remote_action' }, ({ payload }) => {
        if (payload) {
          this.handleIncoming(payload as RemoteMessage);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isSubscribed = true;
          this.onConnectionChangeCallback?.(true);
          if (this.role === 'PHONE_REMOTE') {
            this.sendAction('CONNECT', { clientDevice: 'PHONE' });
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.isSubscribed = false;
          this.onConnectionChangeCallback?.(false);
        }
      });

    // 2. Browser BroadcastChannel for same-device local testing
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcast = new BroadcastChannel(channelName);
        this.localBroadcast.onmessage = (event) => {
          if (event.data) {
            this.handleIncoming(event.data as RemoteMessage);
          }
        };
      } catch {
        // Ignore BroadcastChannel errors
      }
    }

    // 3. Heartbeat Ping / Pong every 10 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.isSubscribed) {
        this.sendAction('PING');
      }
    }, 10000);
  }

  private handleIncoming(msg: RemoteMessage) {
    // Only accept messages sent by the opposite role
    if (msg.sender !== this.role) {
      if (msg.type === 'PING') {
        this.sendAction('PONG');
        return;
      }
      if (msg.type === 'PONG') {
        this.onConnectionChangeCallback?.(true);
        return;
      }

      // If TV receives sound effect action, play it on TV speakers immediately
      if (this.role === 'HOST_TV' && msg.type === 'PLAY_SFX' && msg.payload?.type) {
        playSoundEffect(msg.payload.type as SoundEffectType);
      }

      this.onMessageCallback?.(msg);
    }
  }

  public sendAction(type: RemoteActionType, payload?: any) {
    const message: RemoteMessage = {
      type,
      sender: this.role,
      payload,
      timestamp: Date.now(),
    };

    // Send via Supabase Realtime
    this.channel?.send({
      type: 'broadcast',
      event: 'remote_action',
      payload: message,
    });

    // Send via local BroadcastChannel
    try {
      this.localBroadcast?.postMessage(message);
    } catch {
      // Ignore
    }
  }

  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.role === 'PHONE_REMOTE') {
      this.sendAction('DISCONNECT');
    }
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (this.localBroadcast) {
      this.localBroadcast.close();
      this.localBroadcast = null;
    }
    this.isSubscribed = false;
    this.onConnectionChangeCallback?.(false);
  }
}
