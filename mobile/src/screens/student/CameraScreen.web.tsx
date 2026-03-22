import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { COLORS, SPACING, FONT_SIZES } from '@constants';

export const CameraScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon name="camera-off" type="feather" size={64} color={COLORS.textSecondary} />
        <Text h3 style={styles.title}>
          Camera Not Available
        </Text>
        <Text style={styles.message}>
          Camera functionality is only available in the native mobile app. Please use the iOS or Android version to access this feature.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  title: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 400,
  },
});

export default CameraScreen;
