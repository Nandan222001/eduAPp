import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@constants';

type MessageHandler = (data: any) => void;
type EventType =
  | 'gamification_update'
  | 'leaderboard_update'
  | 'goal_update'
  | 'badge_earned'
  | 'achievement_unlocked';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private messageHandlers: Map<EventType, Set<MessageHandler>> = new Map();
  private isConnecting = false;
  private shouldConnect = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.shouldConnect = true;
    this.isConnecting = true;

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        this.isConnecting = false;
        return;
      }

      const wsUrl = __DEV__
        ? Platform.select({
            ios: 'ws://localhost:8000/ws',
            android: 'ws://10.0.2.2:8000/ws',
            default: 'ws://localhost:8000/ws',
          })
        : 'wss://api.example.com/ws';

      this.ws = new WebSocket(`${wsUrl}?token=${token}`);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  subscribe(event: EventType, handler: MessageHandler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)?.add(handler);

    if (this.shouldConnect && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
      this.connect();
    }

    return () => {
      this.messageHandlers.get(event)?.delete(handler);
      if (this.messageHandlers.get(event)?.size === 0) {
        this.messageHandlers.delete(event);
      }
      if (this.messageHandlers.size === 0) {
        this.disconnect();
      }
    };
  }

  private handleOpen() {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      const { type, payload } = data;

      if (type === 'pong') {
        return;
      }

      const handlers = this.messageHandlers.get(type as EventType);
      if (handlers) {
        handlers.forEach(handler => handler(payload));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleError(event: Event) {
    console.error('WebSocket error:', event);
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket closed:', event.code, event.reason);
    this.isConnecting = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.shouldConnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.shouldConnect) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

export const websocketService = new WebSocketService();
