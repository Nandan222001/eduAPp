import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OTPLoginScreen } from '../screens/auth/OTPLoginScreen';
import { OTPVerifyScreen } from '../screens/auth/OTPVerifyScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F2F2F7' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="OTPLogin"
        component={OTPLoginScreen}
        options={{
          headerShown: true,
          headerTitle: 'OTP Login',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="OTPVerify"
        component={OTPVerifyScreen}
        options={{
          headerShown: true,
          headerTitle: 'Verify OTP',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};
