import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { useLocalSearchParams } from 'expo-router';

export const MessageDetailScreen: React.FC = () => {
  const { id: messageId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text h3>Message Detail</Text>
      <Text>Message ID: {messageId}</Text>
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
