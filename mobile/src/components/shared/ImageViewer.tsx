import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image as RNImage,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Text, Icon } from '@rneui/themed';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  GestureEvent,
  PinchGestureHandlerGestureEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { COLORS, SPACING } from '@constants';
import { imageViewerService } from '@utils';

interface ImageViewerProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  onSave?: (uri: string) => void;
  showControls?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
  onSave,
  showControls = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  React.useEffect(() => {
    if (visible) {
      resetTransform();
    }
  }, [currentIndex, visible]);

  const resetTransform = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onActive: event => {
      scale.value = savedScale.value * event.scale;
    },
    onEnd: () => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    },
  });

  const panHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: event => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    },
    onEnd: () => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    },
  });

  const doubleTapHandler = useAnimatedGestureHandler<any>({
    onActive: () => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
      }
      runOnJS(toggleControls)();
    },
  });

  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      const uri = images[currentIndex];
      const success = await imageViewerService.saveToGallery(uri);

      if (success) {
        Alert.alert('Success', 'Image saved to gallery');
        if (onSave) {
          onSave(uri);
        }
      } else {
        Alert.alert('Error', 'Failed to save image. Please check permissions.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      const uri = images[currentIndex];
      await imageViewerService.shareImage(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share image');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetTransform();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetTransform();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          {showControls && controlsVisible && (
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="x" type="feather" color={COLORS.background} size={28} />
              </TouchableOpacity>
              <Text style={styles.counter}>
                {currentIndex + 1} / {images.length}
              </Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                  <Icon name="share-2" type="feather" color={COLORS.background} size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
                  {loading ? (
                    <ActivityIndicator color={COLORS.background} size="small" />
                  ) : (
                    <Icon name="download" type="feather" color={COLORS.background} size={24} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TapGestureHandler onGestureEvent={doubleTapHandler} numberOfTaps={2}>
            <Animated.View style={styles.imageContainer}>
              <PinchGestureHandler onGestureEvent={pinchHandler}>
                <Animated.View style={styles.imageWrapper}>
                  <PanGestureHandler onGestureEvent={panHandler}>
                    <Animated.View style={animatedStyle}>
                      <RNImage
                        source={{ uri: images[currentIndex] }}
                        style={styles.image}
                        resizeMode="contain"
                      />
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </TapGestureHandler>

          {showControls && controlsVisible && images.length > 1 && (
            <View style={styles.navigationControls}>
              <TouchableOpacity
                onPress={handlePrevious}
                style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
                disabled={currentIndex === 0}
              >
                <Icon
                  name="chevron-left"
                  type="feather"
                  color={currentIndex === 0 ? COLORS.disabled : COLORS.background}
                  size={32}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                style={[
                  styles.navButton,
                  currentIndex === images.length - 1 && styles.navButtonDisabled,
                ]}
                disabled={currentIndex === images.length - 1}
              >
                <Icon
                  name="chevron-right"
                  type="feather"
                  color={currentIndex === images.length - 1 ? COLORS.disabled : COLORS.background}
                  size={32}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
  closeButton: {
    padding: SPACING.sm,
  },
  counter: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  navigationControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    zIndex: 10,
  },
  navButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    padding: SPACING.sm,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
});
