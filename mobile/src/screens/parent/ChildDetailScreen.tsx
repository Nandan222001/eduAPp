import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { useLocalSearchParams } from 'expo-router';

export const ChildDetailScreen: React.FC = () => {
  const { id: childId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text h3>Child Detail</Text>
      <Text>Child ID: {childId}</Text>
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
