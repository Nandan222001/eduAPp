import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, View } from 'react-native';
import { useOfflineSync } from '@hooks/useOfflineSync';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

interface ManualSyncButtonProps {
  style?: any;
  onSyncComplete?: (success: boolean, result: any) => void;
}

export const ManualSyncButton: React.FC<ManualSyncButtonProps> = ({ style, onSyncComplete }) => {
  const { isConnected } = useNetworkStatus();
  const { queueState, triggerManualSync } = useOfflineSync();
  const [isLocalSyncing, setIsLocalSyncing] = useState(false);

  const handleSync = async () => {
    if (!isConnected) {
      Alert.alert(
        'No Connection',
        'Cannot sync while offline. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (queueState.pendingCount === 0) {
      Alert.alert('Nothing to Sync', 'All data is up to date.', [{ text: 'OK' }]);
      return;
    }

    setIsLocalSyncing(true);

    try {
      const result = await triggerManualSync();

      if (result) {
        const message =
          result.processedCount > 0
            ? `Successfully synced ${result.processedCount} item${result.processedCount > 1 ? 's' : ''}.`
            : 'All data is up to date.';

        if (result.failedCount > 0) {
          Alert.alert(
            'Sync Completed with Errors',
            `${message}\n\n${result.failedCount} item${result.failedCount > 1 ? 's' : ''} failed to sync.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Sync Complete', message, [{ text: 'OK' }]);
        }

        onSyncComplete?.(result.success, result);
      }
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message || 'An error occurred during sync.', [
        { text: 'OK' },
      ]);
      onSyncComplete?.(false, error);
    } finally {
      setIsLocalSyncing(false);
    }
  };

  const isDisabled = !isConnected || isLocalSyncing || queueState.pendingCount === 0;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      onPress={handleSync}
      disabled={isDisabled}
    >
      <View style={styles.content}>
        {isLocalSyncing ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
            <Text style={styles.buttonText}>Syncing...</Text>
          </>
        ) : (
          <>
            <Text style={styles.buttonText}>Sync Data</Text>
            {queueState.pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{queueState.pendingCount}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
    elevation: 0,
    shadowOpacity: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spinner: {
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
