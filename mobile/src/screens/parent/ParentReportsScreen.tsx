import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const ParentReportsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Academic Reports</Text>
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>John Doe - Mid-Term Report</Text>
          <Text style={styles.reportDate}>Date: March 15, 2024</Text>
          <Text style={styles.reportSummary}>Overall Performance: Excellent</Text>
        </View>
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>Jane Doe - Progress Report</Text>
          <Text style={styles.reportDate}>Date: March 10, 2024</Text>
          <Text style={styles.reportSummary}>Overall Performance: Good</Text>
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
  reportCard: {
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
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  reportSummary: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
});
