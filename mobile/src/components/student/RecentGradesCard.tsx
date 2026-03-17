import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@rneui/themed';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { Grade } from '../../types/student';
import { format, parseISO } from 'date-fns';

interface RecentGradesCardProps {
  grades?: Grade[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export const RecentGradesCard: React.FC<RecentGradesCardProps> = ({
  grades,
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

  const recentGrades = grades?.slice(0, 3);

  if (!recentGrades || recentGrades.length === 0) {
    return (
      <Card>
        <Text style={styles.title}>Recent Grades</Text>
        <Text style={styles.emptyText}>No grades available</Text>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Grades</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      {recentGrades.map((grade, index) => (
        <View
          key={grade.id}
          style={[styles.gradeItem, index !== recentGrades.length - 1 && styles.itemBorder]}
        >
          <View style={styles.gradeHeader}>
            <View style={styles.gradeInfo}>
              <Text style={styles.examName} numberOfLines={1}>
                {grade.examName}
              </Text>
              <Text style={styles.subject}>{grade.subject}</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={[styles.grade, getGradeColor(grade.grade)]}>{grade.grade}</Text>
            </View>
          </View>
          <View style={styles.gradeDetails}>
            <Text style={styles.marks}>
              {grade.obtainedMarks} / {grade.totalMarks} ({grade.percentage.toFixed(1)}%)
            </Text>
            <Text style={styles.date}>{format(parseISO(grade.examDate), 'MMM dd, yyyy')}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
};

const getGradeColor = (grade: string) => {
  if (['A+', 'A'].includes(grade)) return { color: COLORS.success };
  if (['B+', 'B'].includes(grade)) return { color: COLORS.primary };
  if (['C+', 'C'].includes(grade)) return { color: COLORS.warning };
  return { color: COLORS.error };
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
  gradeItem: {
    paddingVertical: SPACING.sm,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  gradeInfo: {
    flex: 1,
  },
  examName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  subject: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  scoreContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  grade: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  gradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marks: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  placeholderTitle: {
    width: 150,
    height: 24,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
    marginBottom: SPACING.md,
  },
  placeholderItem: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
});
