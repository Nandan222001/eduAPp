import { useEffect, useState } from 'react';
import { useAppDispatch } from '@store/hooks';
import { setOnlineStatus } from '@store/slices/offlineSlice';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
}

export const useNetworkStatus = () => {
  const dispatch = useAppDispatch();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isInternetReachable: typeof navigator !== 'undefined' ? navigator.onLine : true,
    type: 'web',
  });

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Web] Browser is online');
      const status: NetworkStatus = {
        isConnected: true,
        isInternetReachable: true,
        type: 'web',
      };
      setNetworkStatus(status);
      dispatch(setOnlineStatus(true));
    };

    const handleOffline = () => {
      console.log('[Web] Browser is offline');
      const status: NetworkStatus = {
        isConnected: false,
        isInternetReachable: false,
        type: 'web',
      };
      setNetworkStatus(status);
      dispatch(setOnlineStatus(false));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Set initial status
      const isOnline = navigator.onLine;
      dispatch(setOnlineStatus(isOnline));

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {};
  }, [dispatch]);

  return networkStatus;
};
