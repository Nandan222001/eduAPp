// Native implementation for notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationsService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  },

  async scheduleNotification(title: string, body: string, trigger: any) {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger,
    });
  },

  async cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
  },

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  addNotificationListener(listener: (notification: any) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  },

  addNotificationResponseListener(listener: (response: any) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  },
};

export default notificationsService;
