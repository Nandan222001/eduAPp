import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadStoredAuth } from '../store/slices/authSlice';
import { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { StudentNavigator } from './StudentNavigator';
import { ParentNavigator } from './ParentNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { linking } from './linking';
import { notificationService } from '../utils/notificationService';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
  const navigationRef = useRef<any>();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    dispatch(loadStoredAuth());
    
    setupNotificationListeners();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [dispatch]);

  const setupNotificationListeners = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        if (navigationRef.current && isAuthenticated) {
          await notificationService.handleNotificationTapped(response, navigationRef.current);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const getMainNavigator = () => {
    if (!user?.role?.slug) {
      return <StudentNavigator />;
    }

    switch (user.role.slug) {
      case 'parent':
        return <ParentNavigator />;
      case 'student':
      default:
        return <StudentNavigator />;
    }
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={getMainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
});
