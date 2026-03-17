import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const StudentAssignmentsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Assignments</Text>
        <View style={styles.assignmentCard}>
          <Text style={styles.assignmentTitle}>Math Homework</Text>
          <Text style={styles.assignmentDue}>Due: Tomorrow</Text>
        </View>
        <View style={styles.assignmentCard}>
          <Text style={styles.assignmentTitle}>Physics Lab Report</Text>
          <Text style={styles.assignmentDue}>Due: In 3 days</Text>
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
  assignmentCard: {
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
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  assignmentDue: {
    fontSize: 14,
    color: '#FF9500',
  },
});
