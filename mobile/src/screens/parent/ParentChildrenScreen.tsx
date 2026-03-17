import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const ParentChildrenScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Children</Text>
        <View style={styles.childCard}>
          <Text style={styles.childName}>John Doe</Text>
          <Text style={styles.childInfo}>Grade 10 • Class A</Text>
          <Text style={styles.childEmail}>john.doe@school.edu</Text>
        </View>
        <View style={styles.childCard}>
          <Text style={styles.childName}>Jane Doe</Text>
          <Text style={styles.childInfo}>Grade 8 • Class B</Text>
          <Text style={styles.childEmail}>jane.doe@school.edu</Text>
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
  childCard: {
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
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  childInfo: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  childEmail: {
    fontSize: 14,
    color: '#007AFF',
  },
});
