import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Vibration,
  Platform,
  Dimensions,
} from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { COLORS, SPACING } from '@constants';
import { qrScannerService } from '@utils';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string, type: string) => void;
  title?: string;
  showInstructions?: boolean;
  vibrate?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

export const QRScanner: React.FC<QRScannerProps> = ({
  visible,
  onClose,
  onScan,
  title = 'Scan QR Code',
  showInstructions = true,
  vibrate = true,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  useEffect(() => {
    if (visible) {
      requestPermission();
      setScanned(false);
    }
  }, [visible]);

  const requestPermission = async () => {
    const granted = await qrScannerService.ensurePermissions();
    setHasPermission(granted);
  };

  const handleBarCodeScanned = ({ type, data }: BarCodeScannerResult) => {
    if (scanned) return;

    setScanned(true);

    if (vibrate && Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }

    onScan(data, type);

    setTimeout(() => {
      setScanned(false);
    }, 2000);
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {hasPermission === null ? (
          <View style={styles.centerContent}>
            <Text style={styles.message}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.centerContent}>
            <Icon name="camera-off" type="feather" size={64} color={COLORS.error} />
            <Text style={styles.errorMessage}>Camera permission is required to scan QR codes</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Icon name="x" type="feather" color={COLORS.background} size={28} />
              </TouchableOpacity>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={toggleFlash} style={styles.headerButton}>
                <Icon
                  name={flashEnabled ? 'zap' : 'zap-off'}
                  type="feather"
                  color={COLORS.background}
                  size={24}
                />
              </TouchableOpacity>
            </View>

            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
              barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
            />

            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                  {scanned && (
                    <View style={styles.scannedIndicator}>
                      <Icon name="check-circle" type="feather" color={COLORS.success} size={64} />
                    </View>
                  )}
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                {showInstructions && (
                  <Text style={styles.instructions}>
                    Position the QR code within the frame to scan
                  </Text>
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  headerButton: {
    padding: SPACING.sm,
  },
  title: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    color: COLORS.background,
    fontSize: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  closeButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.background,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  instructions: {
    color: COLORS.background,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  scannedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
