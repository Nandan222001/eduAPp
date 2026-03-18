import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOfflineSync } from '@hooks/useOfflineSync';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatusBannerProps {
  style?: any;
  onSyncPress?: () => void;
}

export const SyncStatusBanner: React.FC<SyncStatusBannerProps> = ({ style, onSyncPress }) => {
  const { queueState, isSyncing, lastSyncResult, triggerManualSync } = useOfflineSync();
  const { isConnected } = useNetworkStatus();

  const handleSyncPress = async () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      await triggerManualSync();
    }
  };

  if (queueState.pendingCount === 0 && queueState.failedCount === 0) {
    return null;
  }

  const getLastSyncText = () => {
    if (!lastSyncResult) return '';

    try {
      return formatDistanceToNow(new Date(lastSyncResult.timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.infoContainer}>
        {queueState.pendingCount > 0 && (
          <Text style={styles.pendingText}>
            {queueState.pendingCount} item{queueState.pendingCount > 1 ? 's' : ''} waiting to sync
          </Text>
        )}
        {queueState.failedCount > 0 && (
          <Text style={styles.failedText}>
            {queueState.failedCount} item{queueState.failedCount > 1 ? 's' : ''} failed to sync
          </Text>
        )}
        {lastSyncResult && <Text style={styles.syncTimeText}>Last synced {getLastSyncText()}</Text>}
      </View>

      {isConnected && (
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSyncPress}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.syncButtonText}>Sync Now</Text>
          )}
        </TouchableOpacity>
      )}

      {!isConnected && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  pendingText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  failedText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  syncTimeText: {
    color: '#795548',
    fontSize: 12,
  },
  syncButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  syncButtonDisabled: {
    backgroundColor: '#FFCC80',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
