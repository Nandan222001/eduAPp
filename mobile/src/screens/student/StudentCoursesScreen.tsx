import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const StudentCoursesScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Courses</Text>
        <View style={styles.courseCard}>
          <Text style={styles.courseName}>Mathematics</Text>
          <Text style={styles.courseInfo}>Teacher: Mr. Smith</Text>
        </View>
        <View style={styles.courseCard}>
          <Text style={styles.courseName}>Physics</Text>
          <Text style={styles.courseInfo}>Teacher: Dr. Johnson</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  courseInfo: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
