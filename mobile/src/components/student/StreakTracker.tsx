import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { Streak } from '../../types/gamification';

interface StreakTrackerProps {
  streak?: Streak;
  isLoading?: boolean;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({ streak, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <View style={styles.placeholderContent} />
      </Card>
    );
  }

  if (!streak) return null;

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icon name="fire" size={40} color={COLORS.accent} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Study Streak</Text>
          <View style={styles.streakContainer}>
            <Text style={styles.currentStreak}>{streak.currentStreak}</Text>
            <Text style={styles.streakLabel}>days</Text>
          </View>
          <Text style={styles.longestStreak}>Longest: {streak.longestStreak} days</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentStreak: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginRight: SPACING.xs,
  },
  streakLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  longestStreak: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  placeholderContent: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
  },
});
