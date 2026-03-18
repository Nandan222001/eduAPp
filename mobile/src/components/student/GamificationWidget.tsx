import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { GamificationData } from '../../types/student';

interface GamificationWidgetProps {
  gamification?: GamificationData;
  isLoading?: boolean;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({
  gamification,
  isLoading,
}) => {
  const navigation = useNavigation();

  if (isLoading) {
    return (
      <Card>
        <View style={styles.placeholderTitle} />
        <View style={styles.placeholderContent} />
      </Card>
    );
  }

  if (!gamification) return null;

  const handleViewFull = () => {
    navigation.navigate('Gamification' as never);
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <TouchableOpacity onPress={handleViewFull}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="trophy" size={28} color={COLORS.accent} />
          <Text style={styles.statValue}>{gamification.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="podium" size={28} color={COLORS.success} />
          <Text style={styles.statValue}>#{gamification.rank}</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="medal" size={28} color={COLORS.primary} />
          <Text style={styles.statValue}>{gamification.badges.filter(b => b.earnedAt).length}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewButton} onPress={handleViewFull}>
        <Icon name="chart-line" size={18} color={COLORS.background} />
        <Text style={styles.viewButtonText}>View Full Dashboard</Text>
      </TouchableOpacity>
    </Card>
  );
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  viewButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  placeholderTitle: {
    width: 200,
    height: 24,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
    marginBottom: SPACING.md,
  },
  placeholderContent: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
  },
});
