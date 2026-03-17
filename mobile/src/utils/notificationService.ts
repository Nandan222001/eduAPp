import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';

export interface NotificationTopic {
  assignments: boolean;
  grades: boolean;
  attendance: boolean;
  announcements: boolean;
}

export interface DeviceRegistration {
  device_token: string;
  device_type: 'ios' | 'android';
  device_name: string;
  app_version: string;
  topics: NotificationTopic;
}

class NotificationService {
  private expoPushToken: string | null = null;

  constructor() {
    this.setupNotificationHandler();
  }

  private setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('assignments', {
        name: 'Assignments',
        description: 'Notifications for new assignments and due dates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('grades', {
        name: 'Grades',
        description: 'Notifications for new grades and exam results',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('attendance', {
        name: 'Attendance',
        description: 'Notifications for attendance updates',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Announcements',
        description: 'Notifications for school announcements',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    return true;
  }

  async registerExpoPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-project-id',
      });

      this.expoPushToken = token.data;
      await SecureStore.setItemAsync('expoPushToken', token.data);

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async registerDeviceWithBackend(topics: NotificationTopic): Promise<boolean> {
    try {
      const token = this.expoPushToken || await this.registerExpoPushToken();
      if (!token) {
        return false;
      }

      const deviceInfo: DeviceRegistration = {
        device_token: token,
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
        device_name: Device.deviceName || 'Unknown Device',
        app_version: '1.0.0', // Should be dynamically fetched from app config
        topics,
      };

      await apiClient.post('/notifications/register-device', deviceInfo);
      await SecureStore.setItemAsync('notificationTopics', JSON.stringify(topics));

      return true;
    } catch (error) {
      console.error('Error registering device with backend:', error);
      return false;
    }
  }

  async subscribeToTopics(topics: NotificationTopic): Promise<boolean> {
    return this.registerDeviceWithBackend(topics);
  }

  async getStoredTopics(): Promise<NotificationTopic | null> {
    try {
      const topicsJson = await SecureStore.getItemAsync('notificationTopics');
      if (topicsJson) {
        return JSON.parse(topicsJson);
      }
      return null;
    } catch (error) {
      console.error('Error getting stored topics:', error);
      return null;
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      }
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  async handleNotificationTapped(
    response: Notifications.NotificationResponse,
    navigation: any
  ) {
    const data = response.notification.request.content.data;
    const type = data?.type;

    switch (type) {
      case 'assignment':
        if (data.assignmentId) {
          navigation.navigate('Main', {
            screen: 'AssignmentDetail',
            params: { assignmentId: data.assignmentId },
          });
        } else {
          navigation.navigate('Main', {
            screen: 'StudentAssignments',
          });
        }
        break;

      case 'grade':
        navigation.navigate('Main', {
          screen: 'StudentCourses',
        });
        break;

      case 'attendance':
        navigation.navigate('Main', {
          screen: 'StudentHome',
        });
        break;

      case 'announcement':
        navigation.navigate('Main', {
          screen: 'StudentHome',
        });
        break;

      default:
        navigation.navigate('Main', {
          screen: 'StudentHome',
        });
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null,
    });
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getPresentedNotifications(): Promise<Notifications.Notification[]> {
    return await Notifications.getPresentedNotificationsAsync();
  }

  async dismissAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
