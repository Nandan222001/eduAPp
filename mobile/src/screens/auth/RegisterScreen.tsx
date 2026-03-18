import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { useRouter } from 'expo-router';

export const RegisterScreen: React.FC = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text h3>Register Screen</Text>
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
