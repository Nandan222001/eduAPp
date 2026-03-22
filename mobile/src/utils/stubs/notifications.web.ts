// Web stub for expo-notifications
export const setNotificationHandler = () => {};
export const getPermissionsAsync = async () => ({ status: 'denied' });
export const requestPermissionsAsync = async () => ({ status: 'denied' });
export const getExpoPushTokenAsync = async () => ({ data: null });
export const scheduleNotificationAsync = async () => null;
export const cancelScheduledNotificationAsync = async () => {};
export const cancelAllScheduledNotificationsAsync = async () => {};
export const addNotificationReceivedListener = () => ({ remove: () => {} });
export const addNotificationResponseReceivedListener = () => ({ remove: () => {} });

export default {
  setNotificationHandler,
  getPermissionsAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
};
