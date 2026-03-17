import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '@rneui/themed';
import { Card } from '../Card';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { Profile } from '../../types/student';

interface WelcomeCardProps {
  profile?: Profile;
  isLoading?: boolean;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ profile, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <View style={styles.container}>
          <View style={styles.placeholderImage} />
          <View style={styles.textContainer}>
            <View style={styles.placeholderText} />
            <View style={styles.placeholderSubtext} />
          </View>
        </View>
      </Card>
    );
  }

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : 'Student';
  const greeting = getGreeting();

  return (
    <Card>
      <View style={styles.container}>
        {profile?.profilePhoto ? (
          <Image source={{ uri: profile.profilePhoto }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.name}>{fullName}</Text>
        </View>
      </View>
    </Card>
  );
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.disabled,
    marginRight: SPACING.md,
  },
  placeholderText: {
    width: 150,
    height: 20,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },
  placeholderSubtext: {
    width: 100,
    height: 16,
    backgroundColor: COLORS.disabled,
    borderRadius: 4,
  },
});
