import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { useLocalSearchParams } from 'expo-router';

export const CourseDetailScreen: React.FC = () => {
  const { id: courseId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text h3>Course Detail</Text>
      <Text>Course ID: {courseId}</Text>
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
