import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';

export const SettingsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text h3>Settings</Text>
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
