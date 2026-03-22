// Web stub implementation for notifications
export const notificationsService = {
  async requestPermissions(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  async getPushToken(): Promise<string | null> {
    console.warn('Push notifications not available on web');
    return null;
  },

  async scheduleNotification(_title: string, _body: string, _trigger: any) {
    console.warn('Scheduled notifications not available on web');
    return null;
  },

  async cancelNotification(_id: string) {
    console.warn('Cancel notification not available on web');
  },

  async cancelAllNotifications() {
    console.warn('Cancel all notifications not available on web');
  },

  addNotificationListener(_listener: (notification: any) => void) {
    return { remove: () => {} };
  },

  addNotificationResponseListener(_listener: (response: any) => void) {
    return { remove: () => {} };
  },
};

export default notificationsService;
