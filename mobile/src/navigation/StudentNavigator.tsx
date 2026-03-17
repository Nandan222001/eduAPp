import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { StudentCoursesScreen } from '../screens/student/StudentCoursesScreen';
import { StudentAssignmentsScreen } from '../screens/student/StudentAssignmentsScreen';
import { StudentProfileScreen } from '../screens/student/StudentProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const StudentNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="StudentHome"
        component={StudentHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
          headerTitle: 'Home',
        }}
      />
      <Tab.Screen
        name="StudentCourses"
        component={StudentCoursesScreen}
        options={{
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color }) => <TabIcon icon="📚" color={color} />,
          headerTitle: 'My Courses',
        }}
      />
      <Tab.Screen
        name="StudentAssignments"
        component={StudentAssignmentsScreen}
        options={{
          tabBarLabel: 'Assignments',
          tabBarIcon: ({ color }) => <TabIcon icon="📝" color={color} />,
          headerTitle: 'Assignments',
        }}
      />
      <Tab.Screen
        name="StudentProfile"
        component={StudentProfileScreen}
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
