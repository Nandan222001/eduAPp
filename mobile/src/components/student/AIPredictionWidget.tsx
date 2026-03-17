import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { AIPrediction } from '../../types/student';

interface AIPredictionWidgetProps {
  prediction?: AIPrediction;
  isLoading?: boolean;
}

export const AIPredictionWidget: React.FC<AIPredictionWidgetProps> = ({
  prediction,
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

  if (!prediction) return null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'trending-up';
      case 'declining':
        return 'trending-down';
      default:
        return 'trending-neutral';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return COLORS.success;
      case 'declining':
        return COLORS.error;
      default:
        return COLORS.warning;
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Icon name="brain" size={24} color={COLORS.primary} />
        <Text style={styles.title}>AI Performance Prediction</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.predictionContainer}>
          <Text style={styles.predictedPercentage}>
            {prediction.predictedPercentage.toFixed(1)}%
          </Text>
          <Text style={styles.label}>Predicted Score</Text>
        </View>
        <View style={styles.details}>
          <View style={styles.row}>
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[styles.confidenceFill, { width: `${prediction.confidence * 100}%` }]}
                />
              </View>
              <Text style={styles.confidenceValue}>
                {(prediction.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
          <View style={styles.trendContainer}>
            <Icon
              name={getTrendIcon(prediction.trend)}
              size={20}
              color={getTrendColor(prediction.trend)}
            />
            <Text style={[styles.trendText, { color: getTrendColor(prediction.trend) }]}>
              {prediction.trend.charAt(0).toUpperCase() + prediction.trend.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      {prediction.nextMilestone && (
        <View style={styles.milestone}>
          <Text style={styles.milestoneText}>
            Next milestone: {prediction.nextMilestone.target}% in{' '}
            {prediction.nextMilestone.daysRemaining} days
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionContainer: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    paddingRight: SPACING.lg,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  predictedPercentage: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  details: {
    flex: 1,
  },
  row: {
    marginBottom: SPACING.sm,
  },
  confidenceContainer: {
    width: '100%',
  },
  confidenceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  confidenceValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  milestone: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  milestoneText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
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
    height: 100,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
  },
});
