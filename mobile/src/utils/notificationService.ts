import { Platform } from 'react-native';
import { apiClient } from '../api/client';

// Lazy load notification modules only on native platforms
let Device: any = null;
let Notifications: any = null;

if (Platform.OS !== 'web') {
  Device = require('expo-device');
  Notifications = require('expo-notifications');
}

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
    if (Platform.OS !== 'web') {
      this.setupNotificationHandler();
    }
  }

  private setupNotificationHandler() {
    if (Platform.OS === 'web') return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('Push notifications not available on web');
      return false;
    }

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
    if (Platform.OS === 'web') {
      console.log('Push tokens not available on web');
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-project-id',
      });

      this.expoPushToken = token.data;
      
      // Store push token using AsyncStorage on web, SecureStore on native
      if (Platform.OS === 'web') {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('expoPushToken', token.data);
      } else {
        const SecureStore = require('expo-secure-store');
        await SecureStore.setItemAsync('expoPushToken', token.data);
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async registerDeviceWithBackend(topics: NotificationTopic): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('Device registration not available on web');
      return false;
    }

    try {
      const token = this.expoPushToken || await this.registerExpoPushToken();
      if (!token) {
        return false;
      }

      const deviceInfo: DeviceRegistration = {
        device_token: token,
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
        device_name: Device.deviceName || 'Unknown Device',
        app_version: '1.0.0',
        topics,
      };

      await apiClient.post('/notifications/register-device', deviceInfo);
      
      // Store topics using AsyncStorage on web, SecureStore on native
      if (Platform.OS === 'web') {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('notificationTopics', JSON.stringify(topics));
      } else {
        const SecureStore = require('expo-secure-store');
        await SecureStore.setItemAsync('notificationTopics', JSON.stringify(topics));
      }

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
      let topicsJson: string | null = null;
      
      if (Platform.OS === 'web') {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        topicsJson = await AsyncStorage.getItem('notificationTopics');
      } else {
        const SecureStore = require('expo-secure-store');
        topicsJson = await SecureStore.getItemAsync('notificationTopics');
      }
      
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
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void
  ) {
    if (Platform.OS === 'web') {
      return () => {};
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
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
    response: any,
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
    if (Platform.OS === 'web') return;
    await Notifications.setBadgeCountAsync(count);
  }

  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'web') return 0;
    return await Notifications.getBadgeCountAsync();
  }

  async clearBadge(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.setBadgeCountAsync(0);
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: any
  ): Promise<string> {
    if (Platform.OS === 'web') {
      console.log('Local notifications not available on web');
      return '';
    }

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
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getPresentedNotifications(): Promise<any[]> {
    if (Platform.OS === 'web') return [];
    return await Notifications.getPresentedNotificationsAsync();
  }

  async dismissAllNotifications(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.dismissAllNotificationsAsync();
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
