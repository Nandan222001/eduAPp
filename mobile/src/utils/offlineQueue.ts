import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from '@api/client';

const OFFLINE_QUEUE_KEY = '@offline_queue';
const MAX_RETRY_ATTEMPTS = 3;

export enum QueuedRequestType {
  ASSIGNMENT_SUBMISSION = 'ASSIGNMENT_SUBMISSION',
  ATTENDANCE_MARKING = 'ATTENDANCE_MARKING',
  DOUBT_POST = 'DOUBT_POST',
  DOUBT_ANSWER = 'DOUBT_ANSWER',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
}

export interface QueuedRequest {
  id: string;
  type: QueuedRequestType;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export interface OfflineQueueState {
  requests: QueuedRequest[];
  totalCount: number;
  pendingCount: number;
  failedCount: number;
  lastSyncAttempt: number | null;
}

class OfflineQueueManager {
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;
  private listeners: ((state: OfflineQueueState) => void)[] = [];
  private isOnline: boolean = true;
  private unsubscribeNetInfo?: () => void;

  constructor() {
    this.initNetworkListener();
    this.loadQueue();
  }

  private initNetworkListener() {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: any) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('[OfflineQueue] Network restored, processing queue');
        this.processQueue();
      }
    });

    NetInfo.fetch().then((state: any) => {
      this.isOnline = state.isConnected ?? false;
    });
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(`[OfflineQueue] Loaded ${this.queue.length} requests from storage`);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  async addRequest(
    type: QueuedRequestType,
    url: string,
    method: QueuedRequest['method'],
    data?: any,
    headers?: Record<string, string>,
    metadata?: Record<string, any>
  ): Promise<string> {
    const request: QueuedRequest = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      url,
      method,
      data,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRY_ATTEMPTS,
      metadata,
    };

    this.queue.push(request);
    await this.saveQueue();

    console.log(`[OfflineQueue] Added request ${request.id} of type ${type}`);

    if (this.isOnline && !this.isProcessing) {
      this.processQueue();
    }

    return request.id;
  }

  async removeRequest(id: string): Promise<void> {
    const index = this.queue.findIndex(req => req.id === id);
    if (index >= 0) {
      this.queue.splice(index, 1);
      await this.saveQueue();
      console.log(`[OfflineQueue] Removed request ${id}`);
    }
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('[OfflineQueue] Queue cleared');
  }

  async clearFailedRequests(): Promise<void> {
    this.queue = this.queue.filter(req => req.retryCount < req.maxRetries);
    await this.saveQueue();
    console.log('[OfflineQueue] Cleared failed requests');
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[OfflineQueue] Processing ${this.queue.length} requests`);

    const requests = [...this.queue];

    for (const request of requests) {
      if (request.retryCount >= request.maxRetries) {
        console.log(`[OfflineQueue] Skipping request ${request.id} - max retries exceeded`);
        continue;
      }

      try {
        await this.executeRequest(request);
        await this.removeRequest(request.id);
        console.log(`[OfflineQueue] Successfully executed request ${request.id}`);
      } catch (error: any) {
        console.error(`[OfflineQueue] Failed to execute request ${request.id}:`, error);

        const requestIndex = this.queue.findIndex(req => req.id === request.id);
        if (requestIndex >= 0) {
          this.queue[requestIndex].retryCount++;
          await this.saveQueue();

          if (this.queue[requestIndex].retryCount >= this.queue[requestIndex].maxRetries) {
            console.log(`[OfflineQueue] Request ${request.id} exceeded max retries`);
          }
        }

        if (!this.isOnline || error.message?.includes('Network')) {
          console.log('[OfflineQueue] Network error detected, stopping queue processing');
          break;
        }
      }
    }

    this.isProcessing = false;
    this.notifyListeners();
  }

  private async executeRequest(request: QueuedRequest): Promise<any> {
    const config = {
      headers: request.headers,
    };

    switch (request.method) {
      case 'GET':
        return await apiClient.get(request.url, config);
      case 'POST':
        return await apiClient.post(request.url, request.data, config);
      case 'PUT':
        return await apiClient.put(request.url, request.data, config);
      case 'PATCH':
        return await apiClient.patch(request.url, request.data, config);
      case 'DELETE':
        return await apiClient.delete(request.url, config);
      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  getQueueState(): OfflineQueueState {
    const failedRequests = this.queue.filter(req => req.retryCount >= req.maxRetries);
    const pendingRequests = this.queue.filter(req => req.retryCount < req.maxRetries);

    return {
      requests: this.queue,
      totalCount: this.queue.length,
      pendingCount: pendingRequests.length,
      failedCount: failedRequests.length,
      lastSyncAttempt: this.queue.length > 0 ? Math.max(...this.queue.map(r => r.timestamp)) : null,
    };
  }

  getRequestsByType(type: QueuedRequestType): QueuedRequest[] {
    return this.queue.filter(req => req.type === type);
  }

  async retryFailedRequests(): Promise<void> {
    this.queue.forEach(req => {
      if (req.retryCount >= req.maxRetries) {
        req.retryCount = 0;
      }
    });
    await this.saveQueue();
    await this.processQueue();
  }

  subscribe(listener: (state: OfflineQueueState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getQueueState());

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const state = this.getQueueState();
    this.listeners.forEach(listener => listener(state));
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  dispose(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    this.listeners = [];
  }
}

export const offlineQueueManager = new OfflineQueueManager();
