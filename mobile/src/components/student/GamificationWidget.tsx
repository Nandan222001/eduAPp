import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { GamificationStats, Badge, Achievement } from '../../types/gamification';

interface GamificationWidgetProps {
  gamification?: GamificationStats;
  isLoading?: boolean;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({
  gamification,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <View style={styles.placeholderTitle} />
        <View style={styles.placeholderContent} />
      </Card>
    );
  }

  if (!gamification) return null;

  const levelProgress = gamification.nextLevelPoints
    ? ((gamification.totalPoints % gamification.nextLevelPoints) / gamification.nextLevelPoints) *
      100
    : 0;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9B59B6';
      case 'rare':
        return '#3498DB';
      default:
        return '#95A5A6';
    }
  };

  return (
    <Card>
      <Text style={styles.title}>Achievements & Rewards</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Icon name="trophy" size={24} color={COLORS.accent} />
          <Text style={styles.statValue}>{gamification.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="star" size={24} color={COLORS.primary} />
          <Text style={styles.statValue}>Level {gamification.currentLevel}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
          </View>
        </View>
        <View style={styles.statItem}>
          <Icon name="podium" size={24} color={COLORS.success} />
          <Text style={styles.statValue}>#{gamification.rank}</Text>
          <Text style={styles.statLabel}>of {gamification.totalStudents}</Text>
        </View>
      </View>

      {gamification.badges && gamification.badges.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.badgesContainer}>
              {gamification.badges?.slice(0, 5).map((badge: Badge) => (
                <View
                  key={badge.id}
                  style={[styles.badgeCard, { borderColor: getRarityColor(badge.rarity) }]}
                >
                  <View
                    style={[
                      styles.badgeIconContainer,
                      { backgroundColor: getRarityColor(badge.rarity) },
                    ]}
                  >
                    <Icon name="medal" size={20} color={COLORS.background} />
                  </View>
                  <Text style={styles.badgeName} numberOfLines={2}>
                    {badge.name}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {gamification.recentAchievements && gamification.recentAchievements.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {gamification.recentAchievements.slice(0, 3).map((achievement: Achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <Icon name="check-circle" size={20} color={COLORS.success} />
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementPoints}>+{achievement.pointsEarned} points</Text>
              </View>
            </View>
          ))}
        </>
      )}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  badgeCard: {
    width: 80,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  badgeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  badgeName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  achievementContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  achievementTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  achievementPoints: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: 2,
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
