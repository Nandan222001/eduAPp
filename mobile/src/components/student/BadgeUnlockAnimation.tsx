import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import { Text, Icon } from '@rneui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { BadgeDetail } from '../../types/student';

const { width, height } = Dimensions.get('window');

interface BadgeUnlockAnimationProps {
  badge: BadgeDetail | null;
  visible: boolean;
  onClose: () => void;
}

export const BadgeUnlockAnimation: React.FC<BadgeUnlockAnimationProps> = ({
  badge,
  visible,
  onClose,
}) => {
  const confettiRef = useRef<any>(null);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const shimmerTranslate = useSharedValue(-width);

  useEffect(() => {
    if (visible && badge) {
      scale.value = 0;
      rotate.value = 0;
      opacity.value = 0;
      shimmerTranslate.value = -width;

      scale.value = withSequence(withSpring(1.2, { damping: 8 }), withSpring(1, { damping: 10 }));

      rotate.value = withSequence(
        withTiming(360, { duration: 600 }),
        withTiming(0, { duration: 0 })
      );

      opacity.value = withTiming(1, { duration: 300 });

      shimmerTranslate.value = withDelay(
        300,
        withSequence(
          withTiming(width, { duration: 1000 }),
          withDelay(500, withTiming(-width, { duration: 0 })),
          withTiming(width, { duration: 1000 })
        )
      );

      confettiRef.current?.start();

      const timeout = setTimeout(() => {
        runOnJS(onClose)();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [visible, badge]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }));

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

  if (!badge || !visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <View
            style={[
              styles.badgeContainer,
              { backgroundColor: getRarityColor(badge.rarity) + '20' },
            ]}
          >
            <View style={styles.badgeCircle}>
              <View style={[styles.badgeInner, { backgroundColor: getRarityColor(badge.rarity) }]}>
                <Icon name="award" type="feather" size={64} color={COLORS.background} />
              </View>
            </View>

            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>

          <Text style={styles.title}>Badge Unlocked!</Text>
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.description}>{badge.description}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(badge.rarity) }]}>
            <Text style={styles.rarityText}>{badge.rarity.toUpperCase()}</Text>
          </View>
        </Animated.View>

        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: width / 2, y: height / 2 }}
          fadeOut={true}
          autoStart={false}
          colors={[
            getRarityColor(badge.rarity),
            COLORS.primary,
            COLORS.success,
            COLORS.accent,
            '#E91E63',
          ]}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    width: width * 0.85,
    maxWidth: 400,
  },
  badgeContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  badgeCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ skewX: '-20deg' }],
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  badgeName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  rarityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  rarityText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
    letterSpacing: 1,
  },
});
