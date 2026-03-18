/**
 * Offline-First Architecture Usage Examples
 *
 * This file contains examples of how to use the offline-first features
 * in different parts of your application.
 */

import React, { useEffect } from 'react';
import { View, Text, Button, Alert, ScrollView, RefreshControl } from 'react-native';
import { useAppSelector } from '@store/hooks';
import {
  useDashboardSync,
  useAssignmentsSync,
  useGradesSync,
  useAttendanceSync,
  useNetworkStatus,
  useOfflineSync,
} from '@hooks';
import {
  CachedDataIndicator,
  ManualSyncButton,
  OfflineIndicator,
  SyncStatusBanner,
} from '@components';
import { offlineAwareApi } from '@api/offlineAwareApi';
import { SubmitAssignmentData } from '@api/assignments';

/**
 * Example 1: Dashboard Screen with Auto-Sync
 */
export const DashboardScreenExample: React.FC = () => {
  const { syncDashboard, isSyncing, lastSynced, error } = useDashboardSync();
  const dashboardData = useAppSelector(state => state.dashboard);

  useEffect(() => {
    // Sync dashboard on mount
    syncDashboard();
  }, []);

  const handleRefresh = async () => {
    await syncDashboard();
  };

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} />}
    >
      <View>
        {/* Show cached data indicator */}
        <CachedDataIndicator lastSynced={lastSynced} isSyncing={isSyncing} />

        {/* Show sync status banner if there are pending items */}
        <SyncStatusBanner />

        {error && <Text style={{ color: 'red', padding: 16 }}>Error: {error}</Text>}

        {/* Dashboard content */}
        <Text>Profile: {dashboardData.profile?.firstName}</Text>
        <Text>Attendance: {dashboardData.attendanceSummary?.percentage}%</Text>
        {/* More dashboard content... */}
      </View>
    </ScrollView>
  );
};

/**
 * Example 2: Assignments Screen with Optimistic Updates
 */
export const AssignmentsScreenExample: React.FC = () => {
  const { syncAssignments, isSyncing, lastSynced, assignments } = useAssignmentsSync();
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    syncAssignments();
  }, []);

  const handleSubmitAssignment = async (assignmentId: number) => {
    const submissionData: SubmitAssignmentData = {
      assignmentId,
      comments: 'My submission',
      attachments: [
        {
          fileName: 'assignment.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          fileData: 'base64data...',
        },
      ],
    };

    try {
      const result = await offlineAwareApi.submitAssignment(submissionData, {
        optimistic: true,
        onSuccess: () => {
          Alert.alert('Success', 'Assignment submitted successfully');
        },
        onError: error => {
          Alert.alert('Error', error.message);
        },
      });

      if (result.queued) {
        Alert.alert(
          'Queued',
          'You are offline. Your submission will be sent when connection is restored.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit assignment');
    }
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
        <CachedDataIndicator lastSynced={lastSynced} isSyncing={isSyncing} />
        <OfflineIndicator showWhenOnline />
      </View>

      {!isConnected && (
        <View style={{ backgroundColor: '#FFF3E0', padding: 12 }}>
          <Text>You are offline. Changes will be synced when online.</Text>
        </View>
      )}

      {assignments.map(assignment => (
        <View key={assignment.id} style={{ padding: 16, borderBottomWidth: 1 }}>
          <Text>{assignment.title}</Text>
          <Text>Status: {assignment.status}</Text>
          {assignment.status === 'pending' && (
            <Button title="Submit" onPress={() => handleSubmitAssignment(assignment.id)} />
          )}
        </View>
      ))}
    </View>
  );
};

/**
 * Example 3: Grades Screen with Manual Sync
 */
export const GradesScreenExample: React.FC = () => {
  const { syncGrades, isSyncing, lastSynced, grades, performanceInsights } = useGradesSync();

  useEffect(() => {
    syncGrades();
  }, []);

  return (
    <View>
      <View style={{ padding: 16 }}>
        <View style={{ marginBottom: 16 }}>
          <ManualSyncButton
            onSyncComplete={(success, result) => {
              if (success) {
                syncGrades(); // Re-fetch grades after sync
              }
            }}
          />
        </View>

        <CachedDataIndicator lastSynced={lastSynced} isSyncing={isSyncing} />

        {performanceInsights && (
          <View style={{ marginTop: 16 }}>
            <Text>Overall Average: {performanceInsights.overallAverage}%</Text>
            <Text>Grade: {performanceInsights.overallGrade}</Text>
            <Text>Trend: {performanceInsights.trend}</Text>
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          {grades.map(grade => (
            <View key={grade.id} style={{ padding: 12, borderBottomWidth: 1 }}>
              <Text>
                {grade.examName} - {grade.subject}
              </Text>
              <Text>
                Score: {grade.obtainedMarks}/{grade.totalMarks}
              </Text>
              <Text>Grade: {grade.grade}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

/**
 * Example 4: Attendance Screen with Offline Marking
 */
export const AttendanceScreenExample: React.FC = () => {
  const { syncAttendance, isSyncing, lastSynced, summary, todayRecords } = useAttendanceSync();
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    syncAttendance();
  }, []);

  const handleMarkAttendance = async (status: 'present' | 'absent' | 'late') => {
    try {
      const result = await offlineAwareApi.markAttendance({
        date: new Date().toISOString().split('T')[0],
        status,
      });

      if (result.queued) {
        Alert.alert('Queued', 'Offline mode: Attendance will be synced when online');
      } else {
        Alert.alert('Success', 'Attendance marked');
        syncAttendance(); // Refresh data
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <View style={{ padding: 16 }}>
        <CachedDataIndicator lastSynced={lastSynced} isSyncing={isSyncing} />

        {summary && (
          <View style={{ marginTop: 16 }}>
            <Text>Attendance: {summary.percentage}%</Text>
            <Text>Present: {summary.present} days</Text>
            <Text>Absent: {summary.absent} days</Text>
          </View>
        )}

        {!isConnected && (
          <View style={{ backgroundColor: '#FFEBEE', padding: 12, marginTop: 16 }}>
            <Text style={{ color: '#D32F2F' }}>
              Offline Mode: Attendance marking will be queued
            </Text>
          </View>
        )}

        <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
          <Button title="Present" onPress={() => handleMarkAttendance('present')} />
          <Button title="Late" onPress={() => handleMarkAttendance('late')} />
          <Button title="Absent" onPress={() => handleMarkAttendance('absent')} />
        </View>
      </View>
    </View>
  );
};

/**
 * Example 5: Doubts Screen with Offline Post
 */
export const DoubtsScreenExample: React.FC = () => {
  const { isConnected } = useNetworkStatus();
  const { queueState } = useOfflineSync();

  const handlePostDoubt = async () => {
    try {
      const doubtData = {
        title: 'How to solve this problem?',
        description: 'I am stuck on this concept...',
        subjectId: 1,
        priority: 'medium' as const,
      };

      const result = await offlineAwareApi.postDoubt(doubtData);

      if (result.queued) {
        Alert.alert('Queued', 'Your doubt will be posted when you are online', [{ text: 'OK' }]);
      } else {
        Alert.alert('Success', 'Doubt posted successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <OfflineIndicator showWhenOnline style={{ marginBottom: 16 }} />

      {queueState.pendingCount > 0 && (
        <View style={{ backgroundColor: '#FFF3E0', padding: 12, marginBottom: 16 }}>
          <Text>{queueState.pendingCount} item(s) waiting to sync</Text>
        </View>
      )}

      <Button title="Post Doubt" onPress={handlePostDoubt} />

      {!isConnected && (
        <Text style={{ marginTop: 8, color: '#757575', fontSize: 12 }}>
          Offline: Doubt will be queued for posting
        </Text>
      )}
    </View>
  );
};

/**
 * Example 6: Network Status Component
 */
export const NetworkStatusExample: React.FC = () => {
  const { isConnected, type, isInternetReachable } = useNetworkStatus();
  const { queueState, triggerManualSync, isSyncing } = useOfflineSync();

  const handleSync = async () => {
    if (!isConnected) {
      Alert.alert('No Connection', 'Cannot sync while offline');
      return;
    }

    try {
      const result = await triggerManualSync();
      Alert.alert('Sync Complete', `Processed ${result.processedCount} items`);
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Status: {isConnected ? 'Online' : 'Offline'}</Text>
      <Text>Type: {type || 'Unknown'}</Text>
      <Text>Internet: {isInternetReachable ? 'Reachable' : 'Not reachable'}</Text>
      <Text>Pending: {queueState.pendingCount}</Text>
      <Text>Failed: {queueState.failedCount}</Text>

      <Button
        title={isSyncing ? 'Syncing...' : 'Sync Now'}
        onPress={handleSync}
        disabled={!isConnected || isSyncing}
      />
    </View>
  );
};
