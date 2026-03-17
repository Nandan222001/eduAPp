import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { WeakArea } from '../../types/student';

interface WeakAreasPanelProps {
  weakAreas?: WeakArea[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export const WeakAreasPanel: React.FC<WeakAreasPanelProps> = ({
  weakAreas,
  isLoading,
  onViewAll,
}) => {
  if (isLoading) {
    return (
      <Card>
        <View style={styles.placeholderTitle} />
        <View style={styles.placeholderItem} />
      </Card>
    );
  }

  const topWeakAreas = weakAreas?.slice(0, 4);

  if (!topWeakAreas || topWeakAreas.length === 0) {
    return (
      <Card>
        <Text style={styles.title}>Areas to Improve</Text>
        <Text style={styles.emptyText}>Great job! No weak areas identified</Text>
      </Card>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      default:
        return COLORS.success;
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="alert-circle-outline" size={20} color={COLORS.warning} />
          <Text style={styles.title}>Areas to Improve</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.areasContainer}>
          {topWeakAreas.map(area => (
            <View key={area.id} style={styles.areaCard}>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(area.difficulty) },
                ]}
              >
                <Text style={styles.difficultyText}>{area.difficulty.toUpperCase()}</Text>
              </View>
              <Text style={styles.topicName} numberOfLines={2}>
                {area.topic}
              </Text>
              <Text style={styles.subjectName}>{area.subject}</Text>
              <View style={styles.scoreContainer}>
                <View style={styles.scoreBar}>
                  <View
                    style={[
                      styles.scoreFill,
                      {
                        width: `${area.score}%`,
                        backgroundColor: getDifficultyColor(area.difficulty),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.scoreText}>{area.score}%</Text>
              </View>
              {area.recommendedResources > 0 && (
                <View style={styles.resourcesContainer}>
                  <Icon name="book-open-variant" size={14} color={COLORS.primary} />
                  <Text style={styles.resourcesText}>{area.recommendedResources} resources</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  viewAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  areasContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  areaCard: {
    width: 150,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  topicName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    height: 36,
  },
  subjectName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  scoreContainer: {
    marginBottom: SPACING.sm,
  },
  scoreBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  scoreFill: {
    height: '100%',
  },
  scoreText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  resourcesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourcesText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginLeft: 4,
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
    height: 150,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
  },
});
