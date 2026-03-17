import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { store, persistor } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { backgroundSyncService } from './src/utils/backgroundSync';
import { notificationService } from './src/utils/notificationService';

function AppContent() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    backgroundSyncService.register();
    
    initializeNotifications();

    return () => {
      backgroundSyncService.unregister();
      
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const initializeNotifications = async () => {
    await notificationService.requestPermissions();
    await notificationService.registerExpoPushToken();
    
    const defaultTopics = {
      assignments: true,
      grades: true,
      attendance: true,
      announcements: true,
    };
    
    await notificationService.registerDeviceWithBackend(defaultTopics);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        }
        persistor={persistor}
      >
        <AppContent />
      </PersistGate>
    </Provider>
  );
}
