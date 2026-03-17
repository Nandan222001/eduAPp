import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { useLocalSearchParams } from 'expo-router';

export const NotificationDetailScreen: React.FC = () => {
  const { id: notificationId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text h3>Notification Detail</Text>
      <Text>Notification ID: {notificationId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
