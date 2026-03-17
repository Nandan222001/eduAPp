import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { ParentHomeScreen } from '../screens/parent/ParentHomeScreen';
import { ParentChildrenScreen } from '../screens/parent/ParentChildrenScreen';
import { ParentReportsScreen } from '../screens/parent/ParentReportsScreen';
import { ParentProfileScreen } from '../screens/parent/ParentProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

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
        name="ParentHome"
        component={ParentHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
          headerTitle: 'Home',
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
