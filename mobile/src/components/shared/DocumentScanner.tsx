import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { Text, Icon, Button } from '@rneui/themed';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { COLORS, SPACING, BORDER_RADIUS } from '@constants';
import { documentScanner, DocumentPage } from '@utils';

interface DocumentScannerProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (pages: DocumentPage[]) => void;
  multiPage?: boolean;
  title?: string;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  visible,
  onClose,
  onComplete,
  multiPage = false,
  title = 'Scan Document',
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    if (visible) {
      requestPermission();
      setPages([]);
    }
  }, [visible]);

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleCapture = async () => {
    if (!cameraRef.current || processing) return;

    try {
      setProcessing(true);

      const page = await documentScanner.scanDocument(cameraRef, {
        quality: 0.95,
        enhanceContrast: true,
        autoRotate: false,
      });

      if (page) {
        const newPages = [...pages, { ...page, pageNumber: pages.length + 1 }];
        setPages(newPages);

        if (!multiPage) {
          onComplete(newPages);
          handleClose();
        } else {
          Alert.alert(
            'Page Scanned',
            `Page ${newPages.length} captured successfully. Add another page?`,
            [
              { text: 'Done', onPress: () => handleComplete(newPages) },
              { text: 'Add More', style: 'cancel' },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan document');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = (finalPages?: DocumentPage[]) => {
    const pagesToSubmit = finalPages || pages;
    if (pagesToSubmit.length === 0) {
      Alert.alert('No Pages', 'Please scan at least one page');
      return;
    }
    onComplete(pagesToSubmit);
    handleClose();
  };

  const handleClose = () => {
    setPages([]);
    setProcessing(false);
    onClose();
  };

  const removePage = (index: number) => {
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {hasPermission === null ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.message}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.centerContent}>
            <Icon name="camera-off" type="feather" size={64} color={COLORS.error} />
            <Text style={styles.errorMessage}>Camera permission is required to scan documents</Text>
            <Button title="Close" onPress={handleClose} />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
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

            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={CameraType.back}
              flashMode={flashEnabled ? FlashMode.torch : FlashMode.off}
            >
              <View style={styles.overlay}>
                <View style={styles.guideline} />
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructions}>Position document within frame</Text>
                  <Text style={styles.subInstructions}>
                    Ensure good lighting and all edges are visible
                  </Text>
                </View>
              </View>
            </Camera>

            <View style={styles.controls}>
              {multiPage && pages.length > 0 && (
                <View style={styles.pagesPreview}>
                  <FlatList
                    horizontal
                    data={pages}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                      <View style={styles.pagePreview}>
                        <Image source={{ uri: item.uri }} style={styles.previewImage} />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removePage(index)}
                        >
                          <Icon name="x" type="feather" color={COLORS.background} size={16} />
                        </TouchableOpacity>
                        <Text style={styles.pageNumber}>{index + 1}</Text>
                      </View>
                    )}
                    contentContainerStyle={styles.pagesPreviewContent}
                  />
                </View>
              )}

              <View style={styles.captureControls}>
                <TouchableOpacity
                  style={[styles.captureButton, processing && styles.captureButtonDisabled]}
                  onPress={handleCapture}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color={COLORS.background} size="large" />
                  ) : (
                    <View style={styles.captureButtonInner} />
                  )}
                </TouchableOpacity>
              </View>

              {multiPage && pages.length > 0 && (
                <View style={styles.actionButtons}>
                  <Button
                    title={`Complete (${pages.length} page${pages.length > 1 ? 's' : ''})`}
                    onPress={() => handleComplete()}
                    buttonStyle={styles.completeButton}
                    icon={
                      <Icon
                        name="check"
                        type="feather"
                        color={COLORS.background}
                        size={20}
                        style={{ marginRight: 8 }}
                      />
                    }
                  />
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideline: {
    width: '85%',
    aspectRatio: 0.7,
    borderWidth: 2,
    borderColor: COLORS.background,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  instructions: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subInstructions: {
    color: COLORS.background,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  pagesPreview: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  pagesPreviewContent: {
    paddingHorizontal: SPACING.md,
  },
  pagePreview: {
    width: 60,
    height: 80,
    marginRight: SPACING.sm,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    borderBottomRightRadius: BORDER_RADIUS.sm,
  },
  captureControls: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  actionButtons: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  completeButton: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  message: {
    color: COLORS.background,
    fontSize: 16,
    marginTop: SPACING.md,
  },
  errorMessage: {
    color: COLORS.background,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
});
