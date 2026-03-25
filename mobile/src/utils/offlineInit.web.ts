/**
 * Offline Support Initialization - Web Implementation
 * 
 * This module provides web-compatible offline support initialization.
 * Background sync is not supported on web, but basic offline queue is.
 */

import { offlineQueueManager } from './offlineQueue';
import { store } from '@store';
import { setOnlineStatus, setQueuedOperations } from '@store/slices/offlineSlice';

export const initializeOfflineSupport = async (): Promise<void> => {
  try {
    console.log('[Web] Initializing web offline support...');

    // Use browser's online/offline detection
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    store.dispatch(setOnlineStatus(isOnline));

    // Initialize offline queue
    const initialQueue = offlineQueueManager.getQueue();
    store.dispatch(setQueuedOperations(initialQueue));

    // Subscribe to queue changes
    offlineQueueManager.subscribe(queue => {
      store.dispatch(setQueuedOperations(queue));
    });

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[Web] Browser is online');
        store.dispatch(setOnlineStatus(true));
        
        if (offlineQueueManager.getQueueCount() > 0) {
          offlineQueueManager.processQueue();
        }
      });

      window.addEventListener('offline', () => {
        console.log('[Web] Browser is offline');
        store.dispatch(setOnlineStatus(false));
      });
    }

    console.log('[Web] Offline support initialized successfully');
  } catch (error) {
    console.error('[Web] Failed to initialize offline support:', error);
  }
};

export const cleanupOfflineSupport = async (): Promise<void> => {
  try {
    console.log('[Web] Offline support cleaned up');
  } catch (error) {
    console.error('[Web] Failed to cleanup offline support:', error);
  }
};
