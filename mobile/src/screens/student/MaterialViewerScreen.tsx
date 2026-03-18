import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { useQuery } from '@tanstack/react-query';
import Pdf from 'react-native-pdf';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { MainStackScreenProps } from '@types';
import { studyMaterialsApi } from '../../api/studyMaterials';

type Props = MainStackScreenProps<'MaterialViewer'> & {
  route: {
    params: {
      materialId: number;
    };
  };
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MaterialViewerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { materialId } = route.params;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const { data: material, isLoading, isError } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => studyMaterialsApi.getMaterialById(materialId),
  });

  useEffect(() => {
    if (material) {
      studyMaterialsApi.recordView(material.id);
    }
  }, [material]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handlePlayPauseAudio = async () => {
    if (!material?.fileUrl) return;

    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: material.fileUrl },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const renderContent = () => {
    if (!material) return null;

    switch (material.type) {
      case 'pdf':
        return (
          <View style={styles.pdfContainer}>
            <Pdf
              trustAllCerts={false}
              source={{ uri: material.fileUrl || '', cache: true }}
              style={styles.pdf}
              onLoadComplete={(numberOfPages: number) => {
                setTotalPages(numberOfPages);
              }}
              onPageChanged={(page: number) => {
                setCurrentPage(page);
              }}
              onError={(error: any) => {
                console.error('PDF error:', error);
                Alert.alert('Error', 'Failed to load PDF');
              }}
              enablePaging
            />
            {totalPages > 0 && (
              <View style={styles.pageIndicator}>
                <Text style={styles.pageIndicatorText}>
                  Page {currentPage} of {totalPages}
                </Text>
              </View>
            )}
          </View>
        );

      case 'video':
        return (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: material.fileUrl || '' }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              onError={(error: any) => {
                console.error('Video error:', error);
                Alert.alert('Error', 'Failed to load video');
              }}
            />
          </View>
        );

      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <View style={styles.audioPlayer}>
              <Icon name="music" type="feather" size={64} color={COLORS.primary} />
              <Text style={styles.audioTitle}>{material.title}</Text>
              {material.duration && (
                <Text style={styles.audioDuration}>
                  Duration: {Math.floor(material.duration / 60)}:
                  {String(material.duration % 60).padStart(2, '0')}
                </Text>
              )}
              <TouchableOpacity onPress={handlePlayPauseAudio} style={styles.playButton}>
                <Icon
                  name={isPlaying ? 'pause-circle' : 'play-circle'}
                  type="feather"
                  size={64}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'link':
        return (
          <WebView
            source={{ uri: material.fileUrl || '' }}
            style={styles.webview}
            onError={(syntheticEvent: any) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              Alert.alert('Error', 'Failed to load content');
            }}
          />
        );

      case 'document':
      case 'presentation':
        if (material.fileUrl?.includes('docs.google.com') || material.fileUrl?.includes('drive.google.com')) {
          return (
            <WebView
              source={{ uri: material.fileUrl }}
              style={styles.webview}
              onError={(syntheticEvent: any) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                Alert.alert('Error', 'Failed to load document');
              }}
            />
          );
        }
        return (
          <View style={styles.unsupportedContainer}>
            <Icon name="file" type="feather" size={64} color={COLORS.textSecondary} />
            <Text style={styles.unsupportedText}>
              This file type cannot be previewed in the app
            </Text>
            <Text style={styles.unsupportedSubtext}>
              Please download the file to view it
            </Text>
          </View>
        );

      default:
        return (
          <View style={styles.unsupportedContainer}>
            <Icon name="file" type="feather" size={64} color={COLORS.textSecondary} />
            <Text style={styles.unsupportedText}>
              This file type is not supported for preview
            </Text>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading material...</Text>
      </View>
    );
  }

  if (isError || !material) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" type="feather" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>Failed to load material</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-left" type="feather" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {material.title}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {material.subjectName}
            {material.chapterName && ` • ${material.chapterName}`}
          </Text>
        </View>
      </View>

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerButton: {
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.surface,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: SPACING.lg,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  pageIndicatorText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (9 / 16),
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  audioPlayer: {
    alignItems: 'center',
    width: '100%',
  },
  audioTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  audioDuration: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  playButton: {
    marginTop: SPACING.lg,
  },
  webview: {
    flex: 1,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  unsupportedText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  unsupportedSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
