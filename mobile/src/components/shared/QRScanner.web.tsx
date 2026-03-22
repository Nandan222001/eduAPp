import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@constants';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string, type: string) => void;
  title?: string;
  showInstructions?: boolean;
  vibrate?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        QR Scanner is not available on web. Please use the mobile app.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  message: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default QRScanner;
