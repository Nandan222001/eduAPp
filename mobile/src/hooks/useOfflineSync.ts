import { useState, useEffect, useCallback } from 'react';
import { offlineQueueManager, OfflineQueueState, QueuedRequestType } from '@utils/offlineQueue';
import { backgroundSyncService, BackgroundSyncResult } from '@utils/backgroundSync';

export const useOfflineSync = () => {
  const [queueState, setQueueState] = useState<OfflineQueueState>(
    offlineQueueManager.getQueueState()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<BackgroundSyncResult | null>(null);
  const [isOnline, setIsOnline] = useState(offlineQueueManager.isConnected());

  useEffect(() => {
    const unsubscribe = offlineQueueManager.subscribe(state => {
      setQueueState(state);
      setIsOnline(offlineQueueManager.isConnected());
    });

    backgroundSyncService.getLastSyncResult().then(result => {
      setLastSyncResult(result);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const triggerManualSync = useCallback(async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      const result = await backgroundSyncService.triggerManualSync();
      setLastSyncResult(result);
      return result;
    } catch (error) {
      console.error('[useOfflineSync] Manual sync failed:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const clearQueue = useCallback(async () => {
    await offlineQueueManager.clearQueue();
  }, []);

  const clearFailedRequests = useCallback(async () => {
    await offlineQueueManager.clearFailedRequests();
  }, []);

  const retryFailedRequests = useCallback(async () => {
    setIsSyncing(true);
    try {
      await offlineQueueManager.retryFailedRequests();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const getRequestsByType = useCallback((type: QueuedRequestType) => {
    return offlineQueueManager.getRequestsByType(type);
  }, []);

  return {
    queueState,
    isOnline,
    isSyncing,
    lastSyncResult,
    triggerManualSync,
    clearQueue,
    clearFailedRequests,
    retryFailedRequests,
    getRequestsByType,
  };
};
