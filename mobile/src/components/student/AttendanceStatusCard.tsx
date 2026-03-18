import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { AttendanceSummary } from '../../types/attendance';

interface AttendanceStatusCardProps {
  attendance?: AttendanceSummary;
  isLoading?: boolean;
}

export const AttendanceStatusCard: React.FC<AttendanceStatusCardProps> = ({
  attendance,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <View style={styles.placeholderTitle} />
        <View style={styles.placeholderCircle} />
      </Card>
    );
  }

  if (!attendance) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return COLORS.success;
      case 'absent':
        return COLORS.error;
      case 'late':
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present Today';
      case 'absent':
        return 'Absent Today';
      case 'late':
        return 'Late Today';
      default:
        return 'Not Marked';
    }
  };

  return (
    <Card>
      <Text style={styles.title}>Attendance</Text>
      <View style={styles.content}>
        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            <Text style={styles.percentage}>{attendance.percentage.toFixed(1)}%</Text>
          </View>
        </View>
        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.label}>Attended:</Text>
            <Text style={styles.value}>
              {attendance.attendedClasses} / {attendance.totalClasses}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(attendance.todayStatus) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(attendance.todayStatus)}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleContainer: {
    marginRight: SPACING.lg,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 8,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  details: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.background,
  },
  placeholderTitle: {
    width: 120,
    height: 24,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
    marginBottom: SPACING.md,
  },
  placeholderCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.disabled,
  },
});
