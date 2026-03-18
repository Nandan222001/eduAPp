import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { useOfflineSync } from '@hooks/useOfflineSync';
import { formatDistanceToNow } from 'date-fns';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  style?: any;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showWhenOnline = false,
  style,
}) => {
  const { isConnected } = useNetworkStatus();
  const { queueState, lastSyncResult } = useOfflineSync();

  if (isConnected && !showWhenOnline && queueState.pendingCount === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!isConnected) return '#F44336';
    if (queueState.pendingCount > 0) return '#FF9800';
    return '#4CAF50';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Offline';
    if (queueState.pendingCount > 0) return `${queueState.pendingCount} pending`;
    return 'Online';
  };

  const getLastSyncText = () => {
    if (!lastSyncResult) return 'Never synced';

    try {
      const timeAgo = formatDistanceToNow(new Date(lastSyncResult.timestamp), {
        addSuffix: true,
      });
      return `Last synced ${timeAgo}`;
    } catch {
      return 'Last synced recently';
    }
  };

  return (
    <View style={[styles.container, style, { backgroundColor: getStatusColor() }]}>
      <View style={styles.dot} />
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {(queueState.pendingCount > 0 || !isConnected) && (
          <Text style={styles.syncText}>{getLastSyncText()}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  syncText: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.9,
    marginTop: 2,
  },
});
