import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, ParentStackParamList } from '../types/navigation';
import { ParentDashboardScreen } from '../screens/parent/ParentDashboardScreen';
import { ParentChildrenScreen } from '../screens/parent/ParentChildrenScreen';
import { ParentReportsScreen } from '../screens/parent/ParentReportsScreen';
import { ParentProfileScreen } from '../screens/parent/ParentProfileScreen';
import { AttendanceMonitorScreen } from '../screens/parent/AttendanceMonitorScreen';
import { GradesMonitorScreen } from '../screens/parent/GradesMonitorScreen';
import { CommunicationScreen } from '../screens/parent/CommunicationScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<ParentStackParamList>();

const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#5856D6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ParentHome"
        component={ParentDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AttendanceMonitor"
        component={AttendanceMonitorScreen}
        options={{ title: 'Attendance Monitor' }}
      />
      <Stack.Screen
        name="GradesMonitor"
        component={GradesMonitorScreen}
        options={{ title: 'Grades Monitor' }}
      />
      <Stack.Screen
        name="Communication"
        component={CommunicationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export const ParentNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#5856D6',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#5856D6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="ParentDashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ParentChildren"
        component={ParentChildrenScreen}
        options={{
          tabBarLabel: 'Children',
          tabBarIcon: ({ color }) => <TabIcon icon="👥" color={color} />,
          headerTitle: 'My Children',
        }}
      />
      <Tab.Screen
        name="ParentReports"
        component={ParentReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
          headerTitle: 'Reports',
        }}
      />
      <Tab.Screen
        name="ParentProfile"
        component={ParentProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const TabIcon: React.FC<{ icon: string; color: string }> = ({ icon }) => {
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
};
