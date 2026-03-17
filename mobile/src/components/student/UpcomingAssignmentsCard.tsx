import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@rneui/themed';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { Assignment } from '../../types/student';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface UpcomingAssignmentsCardProps {
  assignments?: Assignment[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export const UpcomingAssignmentsCard: React.FC<UpcomingAssignmentsCardProps> = ({
  assignments,
  isLoading,
  onViewAll,
}) => {
  if (isLoading) {
    return (
      <Card>
        <View style={styles.placeholderTitle} />
        <View style={styles.placeholderItem} />
        <View style={styles.placeholderItem} />
      </Card>
    );
  }

  const upcomingAssignments = assignments
    ?.filter(a => a.status === 'pending' || a.status === 'overdue')
    .slice(0, 3);

  if (!upcomingAssignments || upcomingAssignments.length === 0) {
    return (
      <Card>
        <Text style={styles.title}>Upcoming Assignments</Text>
        <Text style={styles.emptyText}>No upcoming assignments</Text>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Assignments</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      {upcomingAssignments.map((assignment, index) => (
        <View
          key={assignment.id}
          style={[
            styles.assignmentItem,
            index !== upcomingAssignments.length - 1 && styles.itemBorder,
          ]}
        >
          <View style={styles.assignmentHeader}>
            <Text style={styles.assignmentTitle} numberOfLines={1}>
              {assignment.title}
            </Text>
            <Text style={styles.subject}>{assignment.subject}</Text>
          </View>
          <View style={styles.dueContainer}>
            <Text style={[styles.dueDate, assignment.status === 'overdue' && styles.overdue]}>
              {getDueDateText(assignment.dueDate, assignment.status)}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
};

const getDueDateText = (dueDate: string, status: string): string => {
  if (status === 'overdue') {
    return `Overdue by ${formatDistanceToNow(parseISO(dueDate))}`;
  }
  return `Due ${formatDistanceToNow(parseISO(dueDate), { addSuffix: true })}`;
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  assignmentItem: {
    paddingVertical: SPACING.sm,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  assignmentTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  subject: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  overdue: {
    color: COLORS.error,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  placeholderTitle: {
    width: 180,
    height: 24,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
    marginBottom: SPACING.md,
  },
  placeholderItem: {
    width: '100%',
    height: 60,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
});
