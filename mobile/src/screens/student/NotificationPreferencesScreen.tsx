import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { notificationService, NotificationTopic } from '../../utils/notificationService';
import { apiClient } from '../../api/client';

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  notification_types: {
    assignments: boolean;
    grades: boolean;
    attendance: boolean;
    announcements: boolean;
  };
}

export const NotificationPreferencesScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    in_app_enabled: true,
    notification_types: {
      assignments: true,
      grades: true,
      attendance: true,
      announcements: true,
    },
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<NotificationPreferences>('/notifications/preferences/me');
      setPreferences(data);
      
      const storedTopics = await notificationService.getStoredTopics();
      if (storedTopics) {
        setPreferences(prev => ({
          ...prev,
          notification_types: storedTopics,
        }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updatedPreferences: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      const newPreferences = { ...preferences, ...updatedPreferences };
      
      await apiClient.put('/notifications/preferences/me', newPreferences);
      
      if (updatedPreferences.notification_types) {
        await notificationService.subscribeToTopics(updatedPreferences.notification_types);
      }
      
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (channel: keyof NotificationPreferences) => {
    if (channel === 'notification_types') return;
    
    updatePreferences({
      [channel]: !preferences[channel],
    });
  };

  const toggleNotificationType = (type: keyof NotificationTopic) => {
    const updatedTypes = {
      ...preferences.notification_types,
      [type]: !preferences.notification_types[type],
    };
    
    updatePreferences({
      notification_types: updatedTypes,
    });
  };

  const requestPushPermissions = async () => {
    const hasPermission = await notificationService.requestPermissions();
    if (hasPermission) {
      const token = await notificationService.registerExpoPushToken();
      if (token) {
        await notificationService.registerDeviceWithBackend(preferences.notification_types);
        Alert.alert('Success', 'Push notifications enabled successfully');
        updatePreferences({ push_enabled: true });
      } else {
        Alert.alert('Error', 'Failed to register for push notifications');
      }
    } else {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive push notifications.'
      );
    }
  };

  const handlePushToggle = async () => {
    if (!preferences.push_enabled) {
      await requestPushPermissions();
    } else {
      updatePreferences({ push_enabled: false });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Channels</Text>
        <Text style={styles.sectionDescription}>
          Choose how you want to receive notifications
        </Text>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Push Notifications</Text>
            <Text style={styles.preferenceDescription}>
              Receive notifications on your device
            </Text>
          </View>
          <Switch
            value={preferences.push_enabled}
            onValueChange={handlePushToggle}
            disabled={saving}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>In-App Notifications</Text>
            <Text style={styles.preferenceDescription}>
              Show notifications within the app
            </Text>
          </View>
          <Switch
            value={preferences.in_app_enabled}
            onValueChange={() => toggleChannel('in_app_enabled')}
            disabled={saving}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Email Notifications</Text>
            <Text style={styles.preferenceDescription}>
              Receive notifications via email
            </Text>
          </View>
          <Switch
            value={preferences.email_enabled}
            onValueChange={() => toggleChannel('email_enabled')}
            disabled={saving}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>SMS Notifications</Text>
            <Text style={styles.preferenceDescription}>
              Receive notifications via text message
            </Text>
          </View>
          <Switch
            value={preferences.sms_enabled}
            onValueChange={() => toggleChannel('sms_enabled')}
            disabled={saving}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Topics</Text>
        <Text style={styles.sectionDescription}>
          Select which types of notifications you want to receive
        </Text>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Assignments</Text>
            <Text style={styles.preferenceDescription}>
              New assignments and due date reminders
            </Text>
          </View>
          <Switch
            value={preferences.notification_types.assignments}
            onValueChange={() => toggleNotificationType('assignments')}
            disabled={saving}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Grades</Text>
            <Text style={styles.preferenceDescription}>
              Grade updates and exam results
            </Text>
          </View>
          <Switch
            value={preferences.notification_types.grades}
            onValueChange={() => toggleNotificationType('grades')}
            disabled={saving}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Attendance</Text>
            <Text style={styles.preferenceDescription}>
              Daily attendance updates and alerts
            </Text>
          </View>
          <Switch
            value={preferences.notification_types.attendance}
            onValueChange={() => toggleNotificationType('attendance')}
            disabled={saving}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Announcements</Text>
            <Text style={styles.preferenceDescription}>
              School announcements and important notices
            </Text>
          </View>
          <Switch
            value={preferences.notification_types.announcements}
            onValueChange={() => toggleNotificationType('announcements')}
            disabled={saving}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={async () => {
            await notificationService.scheduleLocalNotification(
              'Test Notification',
              'This is a test notification from EduTrack',
              { type: 'test' }
            );
            Alert.alert('Success', 'Test notification sent!');
          }}
          disabled={saving}
        >
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
