import { useEffect, useState } from 'react';
import { backgroundSyncService } from '@utils/backgroundSync';
import { offlineQueueManager } from '@utils/offlineQueue';

export const useOfflineInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeOfflineFeatures = async () => {
      try {
        console.log('[useOfflineInit] Initializing offline features...');

        await backgroundSyncService.registerBackgroundSync();

        const isRegistered = await backgroundSyncService.isTaskRegistered();
        console.log('[useOfflineInit] Background task registered:', isRegistered);

        const queueState = offlineQueueManager.getQueueState();
        console.log('[useOfflineInit] Queue state:', queueState);

        if (offlineQueueManager.isConnected() && queueState.pendingCount > 0) {
          console.log('[useOfflineInit] Processing queued requests...');
          await offlineQueueManager.processQueue();
        }

        setIsInitialized(true);
        console.log('[useOfflineInit] Initialization complete');
      } catch (err: any) {
        console.error('[useOfflineInit] Initialization failed:', err);
        setError(err.message);
        setIsInitialized(true);
      }
    };

    initializeOfflineFeatures();

    return () => {
      console.log('[useOfflineInit] Cleanup');
    };
  }, []);

  return { isInitialized, error };
};
