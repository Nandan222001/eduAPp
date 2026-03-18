import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import {
  OfflineIndicator,
  SyncStatusBanner,
  ManualSyncButton,
  OfflineQueueViewer,
} from '@components';
import { useOfflineSync, useNetworkStatus } from '@hooks';
import { backgroundSyncService } from '@utils/backgroundSync';

export const OfflineSettingsScreen: React.FC = () => {
  const { queueState, clearQueue, clearFailedRequests } = useOfflineSync();
  const { isConnected, type, isInternetReachable } = useNetworkStatus();
  const [backgroundSyncEnabled, setBackgroundSyncEnabled] = React.useState(true);

  React.useEffect(() => {
    checkBackgroundSyncStatus();
  }, []);

  const checkBackgroundSyncStatus = async () => {
    const isRegistered = await backgroundSyncService.isTaskRegistered();
    setBackgroundSyncEnabled(isRegistered);
  };

  const toggleBackgroundSync = async (value: boolean) => {
    try {
      if (value) {
        await backgroundSyncService.registerBackgroundSync();
      } else {
        await backgroundSyncService.unregisterBackgroundSync();
      }
      setBackgroundSyncEnabled(value);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to toggle background sync');
    }
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Queue',
      'Are you sure you want to clear all pending requests? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearQueue();
            Alert.alert('Success', 'Queue cleared successfully');
          },
        },
      ]
    );
  };

  const handleClearFailed = () => {
    Alert.alert('Clear Failed', 'Remove all failed requests from the queue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearFailedRequests();
          Alert.alert('Success', 'Failed requests cleared');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Status</Text>
        <View style={styles.card}>
          <OfflineIndicator style={styles.indicator} showWhenOnline />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Connection:</Text>
            <Text style={styles.infoValue}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network Type:</Text>
            <Text style={styles.infoValue}>{type || 'Unknown'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Internet Reachable:</Text>
            <Text style={styles.infoValue}>
              {isInternetReachable === null ? 'Unknown' : isInternetReachable ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <SyncStatusBanner style={styles.syncBanner} />

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Queued:</Text>
            <Text style={styles.infoValue}>{queueState.totalCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pending:</Text>
            <Text style={styles.infoValue}>{queueState.pendingCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Failed:</Text>
            <Text style={styles.infoValue}>{queueState.failedCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.card}>
          <ManualSyncButton style={styles.syncButton} />

          {queueState.totalCount > 0 && (
            <TouchableOpacity style={styles.actionButton} onPress={handleClearQueue}>
              <Text style={styles.actionButtonText}>Clear Queue</Text>
            </TouchableOpacity>
          )}

          {queueState.failedCount > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleClearFailed}
            >
              <Text style={styles.actionButtonTextSecondary}>Clear Failed Requests</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Background Sync</Text>
              <Text style={styles.settingDescription}>
                Automatically sync data when connection is restored
              </Text>
            </View>
            <Switch value={backgroundSyncEnabled} onValueChange={toggleBackgroundSync} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Queued Requests</Text>
        <OfflineQueueViewer style={styles.queueViewer} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  indicator: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  syncBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  syncButton: {
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#757575',
  },
  queueViewer: {
    minHeight: 200,
  },
});
