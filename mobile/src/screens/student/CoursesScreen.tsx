import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';

export const CoursesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text h3>Courses</Text>
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
