import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

const { width } = Dimensions.get('window');

interface QuickGamificationWidgetProps {
  points?: number;
  rank?: number;
  activeGoals?: number;
  streak?: number;
  isLoading?: boolean;
  onPress?: () => void;
}

export const QuickGamificationWidget: React.FC<QuickGamificationWidgetProps> = ({
  points = 0,
  rank = 0,
  activeGoals = 0,
  streak = 0,
  isLoading,
  onPress,
}) => {
  const navigation = useNavigation();
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Gamification' as never);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard} />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Animated.View style={animatedStyle}>
              <Icon name="zap" type="feather" size={24} color={COLORS.accent} />
            </Animated.View>
            <Text style={styles.title}>Your Progress</Text>
          </View>
          <Icon name="chevron-right" type="feather" size={20} color={COLORS.textSecondary} />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.accent + '20' }]}>
              <Icon name="award" type="feather" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{points.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '20' }]}>
              <Icon name="trending-up" type="feather" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>#{rank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '20' }]}>
              <Icon name="target" type="feather" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{activeGoals}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#F59E0B20' }]}>
              <Icon name="zap" type="feather" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
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
    marginTop: 2,
  },
  loadingCard: {
    backgroundColor: COLORS.disabled,
    borderRadius: 16,
    height: 140,
  },
});
