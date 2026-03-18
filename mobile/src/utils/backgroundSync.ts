import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { offlineQueueManager } from './offlineQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_SYNC_TASK = 'background-sync-task';
const LAST_SYNC_KEY = '@last_background_sync';

export interface BackgroundSyncResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  timestamp: number;
  error?: string;
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  console.log('[BackgroundSync] Task started');

  try {
    const queueState = offlineQueueManager.getQueueState();

    if (queueState.pendingCount === 0) {
      console.log('[BackgroundSync] No pending requests to sync');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const beforeCount = queueState.pendingCount;
    await offlineQueueManager.processQueue();
    const afterState = offlineQueueManager.getQueueState();
    const processedCount = beforeCount - afterState.pendingCount;

    const result: BackgroundSyncResult = {
      success: true,
      processedCount,
      failedCount: afterState.failedCount,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(LAST_SYNC_KEY, JSON.stringify(result));

    console.log(`[BackgroundSync] Synced ${processedCount} requests`);

    return processedCount > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error: any) {
    console.error('[BackgroundSync] Task failed:', error);

    const result: BackgroundSyncResult = {
      success: false,
      processedCount: 0,
      failedCount: 0,
      timestamp: Date.now(),
      error: error.message,
    };

    await AsyncStorage.setItem(LAST_SYNC_KEY, JSON.stringify(result));

    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundSyncService {
  private isRegistered: boolean = false;

  async registerBackgroundSync(): Promise<void> {
    if (this.isRegistered) {
      console.log('[BackgroundSync] Already registered');
      return;
    }

    try {
      const status = await BackgroundFetch.getStatusAsync();
      console.log('[BackgroundSync] Status:', status);

      if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: 15 * 60, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });

        this.isRegistered = true;
        console.log('[BackgroundSync] Registered successfully');
      } else {
        console.warn('[BackgroundSync] Background fetch not available');
      }
    } catch (error) {
      console.error('[BackgroundSync] Failed to register:', error);
      throw error;
    }
  }

  async unregisterBackgroundSync(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isRegistered = false;
      console.log('[BackgroundSync] Unregistered successfully');
    } catch (error) {
      console.error('[BackgroundSync] Failed to unregister:', error);
    }
  }

  async getStatus(): Promise<BackgroundFetch.BackgroundFetchStatus> {
    return await BackgroundFetch.getStatusAsync();
  }

  async isTaskRegistered(): Promise<boolean> {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  }

  async getLastSyncResult(): Promise<BackgroundSyncResult | null> {
    try {
      const resultData = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (resultData) {
        return JSON.parse(resultData);
      }
    } catch (error) {
      console.error('[BackgroundSync] Failed to get last sync result:', error);
    }
    return null;
  }

  async triggerManualSync(): Promise<BackgroundSyncResult> {
    console.log('[BackgroundSync] Manual sync triggered');

    try {
      const queueState = offlineQueueManager.getQueueState();
      const beforeCount = queueState.pendingCount;

      if (beforeCount === 0) {
        const result: BackgroundSyncResult = {
          success: true,
          processedCount: 0,
          failedCount: 0,
          timestamp: Date.now(),
        };

        await AsyncStorage.setItem(LAST_SYNC_KEY, JSON.stringify(result));
        return result;
      }

      await offlineQueueManager.processQueue();
      const afterState = offlineQueueManager.getQueueState();
      const processedCount = beforeCount - afterState.pendingCount;

      const result: BackgroundSyncResult = {
        success: true,
        processedCount,
        failedCount: afterState.failedCount,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(LAST_SYNC_KEY, JSON.stringify(result));

      console.log(`[BackgroundSync] Manual sync completed: ${processedCount} requests`);

      return result;
    } catch (error: any) {
      console.error('[BackgroundSync] Manual sync failed:', error);

      const result: BackgroundSyncResult = {
        success: false,
        processedCount: 0,
        failedCount: 0,
        timestamp: Date.now(),
        error: error.message,
      };

      await AsyncStorage.setItem(LAST_SYNC_KEY, JSON.stringify(result));

      return result;
    }
  }
}

export const backgroundSyncService = new BackgroundSyncService();
