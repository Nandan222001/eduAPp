import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon } from '@rneui/themed';
import { RoleSwitcher } from '@components/shared/RoleSwitcher';
import { RoleBadge } from '@components/shared/RoleBadge';

const HeaderRight = () => (
  <View style={styles.headerRight}>
    <RoleBadge />
    <RoleSwitcher showLabel={false} />
  </View>
);

export default function ParentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2089dc',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => <HeaderRight />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          tabBarLabel: 'Children',
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="communication"
        options={{
          title: 'Communication',
          tabBarLabel: 'Communication',
          tabBarIcon: ({ color, size }) => (
            <Icon name="message" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Icon name="assessment" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" type="material" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
