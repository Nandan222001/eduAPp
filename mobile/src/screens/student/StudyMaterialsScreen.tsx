import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text, Card, Icon } from '@rneui/themed';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { MainStackScreenProps } from '@types';
import { studyMaterialsApi } from '../../api/studyMaterials';
import type { StudyMaterial, Subject, Chapter, Topic } from '@types';

type Props = MainStackScreenProps<'StudyMaterials'>;

const FILE_TYPE_ICONS = {
  pdf: { name: 'file-pdf', type: 'font-awesome-5', color: '#DC2626' },
  video: { name: 'video', type: 'feather', color: '#7C3AED' },
  audio: { name: 'music', type: 'feather', color: '#10B981' },
  document: { name: 'file-text', type: 'feather', color: '#3B82F6' },
  presentation: { name: 'presentation', type: 'material-community', color: '#F59E0B' },
  link: { name: 'link', type: 'feather', color: '#6B7280' },
  ebook: { name: 'book', type: 'feather', color: '#EC4899' },
};

const MaterialCard: React.FC<{
  material: StudyMaterial;
  onPress: () => void;
  onDownload: () => void;
  onBookmark: () => void;
}> = ({ material, onPress, onDownload, onBookmark }) => {
  const iconConfig = FILE_TYPE_ICONS[material.type] || FILE_TYPE_ICONS.document;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card containerStyle={styles.materialCard}>
        <View style={styles.materialHeader}>
          <View style={styles.materialIconContainer}>
            <Icon
              name={iconConfig.name}
              type={iconConfig.type}
              size={32}
              color={iconConfig.color}
            />
          </View>
          <View style={styles.materialInfo}>
            <Text style={styles.materialTitle} numberOfLines={2}>
              {material.title}
            </Text>
            <Text style={styles.materialSubject}>{material.subjectName}</Text>
            {material.chapterName && (
              <Text style={styles.materialChapter} numberOfLines={1}>
                {material.chapterName}
                {material.topicName && ` • ${material.topicName}`}
              </Text>
            )}
          </View>
        </View>

        {material.description && (
          <Text style={styles.materialDescription} numberOfLines={2}>
            {material.description}
          </Text>
        )}

        <View style={styles.materialMeta}>
          {material.fileSize && (
            <View style={styles.metaItem}>
              <Icon name="hard-drive" type="feather" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatFileSize(material.fileSize)}</Text>
            </View>
          )}
          {material.pageCount && (
            <View style={styles.metaItem}>
              <Icon name="file-text" type="feather" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{material.pageCount} pages</Text>
            </View>
          )}
          {material.duration && (
            <View style={styles.metaItem}>
              <Icon name="clock" type="feather" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{Math.round(material.duration / 60)} min</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Icon name="eye" type="feather" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{material.viewCount}</Text>
          </View>
        </View>

        <View style={styles.materialActions}>
          <TouchableOpacity onPress={onBookmark} style={styles.actionButton}>
            <Icon
              name={material.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              type="material-community"
              size={20}
              color={material.isBookmarked ? COLORS.accent : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDownload} style={styles.downloadButton}>
            <Icon name="download" type="feather" size={18} color={COLORS.background} />
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.uploadedBy}>
          Uploaded by {material.uploadedByName || 'Teacher'} •{' '}
          {format(parseISO(material.uploadedAt), 'MMM dd, yyyy')}
        </Text>
      </Card>
    </TouchableOpacity>
  );
};

const SubjectCard: React.FC<{ subject: Subject; onPress: () => void }> = ({
  subject,
  onPress,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Card containerStyle={styles.navigationCard}>
      <View style={styles.navigationCardContent}>
        <View style={[styles.subjectIcon, { backgroundColor: subject.color || COLORS.primary }]}>
          <Text style={styles.subjectIconText}>{subject.code?.charAt(0) || 'S'}</Text>
        </View>
        <View style={styles.navigationCardInfo}>
          <Text style={styles.navigationCardTitle}>{subject.name}</Text>
          <Text style={styles.navigationCardSubtitle}>
            {subject.materialCount || 0} materials
          </Text>
        </View>
        <Icon name="chevron-right" type="feather" size={24} color={COLORS.textSecondary} />
      </View>
    </Card>
  </TouchableOpacity>
);

const ChapterCard: React.FC<{ chapter: Chapter; onPress: () => void }> = ({
  chapter,
  onPress,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Card containerStyle={styles.navigationCard}>
      <View style={styles.navigationCardContent}>
        <View style={styles.chapterIcon}>
          <Icon name="book-open" type="feather" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.navigationCardInfo}>
          <Text style={styles.navigationCardTitle}>{chapter.name}</Text>
          {chapter.description && (
            <Text style={styles.navigationCardSubtitle} numberOfLines={1}>
              {chapter.description}
            </Text>
          )}
          <Text style={styles.navigationCardSubtitle}>
            {chapter.materialCount || 0} materials
          </Text>
        </View>
        <Icon name="chevron-right" type="feather" size={24} color={COLORS.textSecondary} />
      </View>
    </Card>
  </TouchableOpacity>
);

const TopicCard: React.FC<{ topic: Topic; onPress: () => void }> = ({ topic, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Card containerStyle={styles.navigationCard}>
      <View style={styles.navigationCardContent}>
        <View style={styles.topicIcon}>
          <Icon name="layers" type="feather" size={20} color={COLORS.secondary} />
        </View>
        <View style={styles.navigationCardInfo}>
          <Text style={styles.navigationCardTitle}>{topic.name}</Text>
          {topic.description && (
            <Text style={styles.navigationCardSubtitle} numberOfLines={1}>
              {topic.description}
            </Text>
          )}
          <Text style={styles.navigationCardSubtitle}>
            {topic.materialCount || 0} materials
          </Text>
        </View>
        <Icon name="chevron-right" type="feather" size={24} color={COLORS.textSecondary} />
      </View>
    </Card>
  </TouchableOpacity>
);

export const StudyMaterialsScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'recent' | 'bookmarks'>('browse');

  const queryClient = useQueryClient();

  const { data: subjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: studyMaterialsApi.getSubjects,
    enabled: !selectedSubject && activeTab === 'browse',
  });

  const { data: chapters, isLoading: loadingChapters } = useQuery({
    queryKey: ['chapters', selectedSubject?.id],
    queryFn: () => studyMaterialsApi.getChaptersBySubject(selectedSubject!.id),
    enabled: !!selectedSubject && !selectedChapter,
  });

  const { data: topics, isLoading: loadingTopics } = useQuery({
    queryKey: ['topics', selectedChapter?.id],
    queryFn: () => studyMaterialsApi.getTopicsByChapter(selectedChapter!.id),
    enabled: !!selectedChapter && !selectedTopic,
  });

  const { data: materials, isLoading: loadingMaterials } = useQuery({
    queryKey: ['materials', selectedTopic?.id, selectedChapter?.id, selectedSubject?.id],
    queryFn: async () => {
      if (selectedTopic) {
        return studyMaterialsApi.getMaterialsByTopic(selectedTopic.id);
      } else if (selectedChapter) {
        return studyMaterialsApi.getMaterialsByChapter(selectedChapter.id);
      } else if (selectedSubject) {
        return studyMaterialsApi.getMaterialsBySubject(selectedSubject.id);
      }
      return [];
    },
    enabled: !!selectedSubject && (!!selectedChapter || !!selectedTopic),
  });

  const { data: recentMaterials, isLoading: loadingRecent } = useQuery({
    queryKey: ['recentMaterials'],
    queryFn: () => studyMaterialsApi.getRecentlyViewed(10),
    enabled: activeTab === 'recent',
  });

  const { data: bookmarks, isLoading: loadingBookmarks } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: studyMaterialsApi.getBookmarks,
    enabled: activeTab === 'bookmarks',
  });

  const { data: bookmarkedMaterials, isLoading: loadingBookmarkedMaterials } = useQuery({
    queryKey: ['bookmarkedMaterials', bookmarks],
    queryFn: async () => {
      if (!bookmarks || bookmarks.length === 0) return [];
      const materialPromises = bookmarks.map(b =>
        studyMaterialsApi.getMaterialById(b.materialId)
      );
      return Promise.all(materialPromises);
    },
    enabled: activeTab === 'bookmarks' && !!bookmarks && bookmarks.length > 0,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ materialId, isBookmarked }: { materialId: number; isBookmarked: boolean }) => {
      if (isBookmarked) {
        await studyMaterialsApi.removeBookmark(materialId);
      } else {
        await studyMaterialsApi.bookmarkMaterial(materialId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarkedMaterials'] });
    },
  });

  const handleDownload = async (material: StudyMaterial) => {
    try {
      const { downloadUrl, fileName } = await studyMaterialsApi.downloadMaterial(material.id);
      
      const fileUri = FileSystem.documentDirectory + fileName;
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${(progress * 100).toFixed(0)}%`);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        Alert.alert(
          'Download Complete',
          'File downloaded successfully. Do you want to open it?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open',
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(result.uri);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file. Please try again.');
    }
  };

  const handleMaterialPress = (material: StudyMaterial) => {
    studyMaterialsApi.recordView(material.id);
    navigation.navigate('MaterialViewer', { materialId: material.id });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const handleBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
    } else if (selectedChapter) {
      setSelectedChapter(null);
    } else if (selectedSubject) {
      setSelectedSubject(null);
    }
  };

  const getBreadcrumb = () => {
    const parts = [];
    if (selectedSubject) parts.push(selectedSubject.name);
    if (selectedChapter) parts.push(selectedChapter.name);
    if (selectedTopic) parts.push(selectedTopic.name);
    return parts.join(' > ');
  };

  const renderContent = () => {
    if (activeTab === 'recent') {
      if (loadingRecent) {
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );
      }

      if (!recentMaterials || recentMaterials.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <Icon name="clock" type="feather" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No recently accessed materials</Text>
          </View>
        );
      }

      return (
        <FlatList
          data={recentMaterials}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <MaterialCard
              material={item}
              onPress={() => handleMaterialPress(item)}
              onDownload={() => handleDownload(item)}
              onBookmark={() => bookmarkMutation.mutate({ materialId: item.id, isBookmarked: item.isBookmarked })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        />
      );
    }

    if (activeTab === 'bookmarks') {
      if (loadingBookmarks || loadingBookmarkedMaterials) {
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );
      }

      if (!bookmarkedMaterials || bookmarkedMaterials.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <Icon name="bookmark" type="feather" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No bookmarked materials</Text>
          </View>
        );
      }

      return (
        <FlatList
          data={bookmarkedMaterials}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <MaterialCard
              material={item}
              onPress={() => handleMaterialPress(item)}
              onDownload={() => handleDownload(item)}
              onBookmark={() => bookmarkMutation.mutate({ materialId: item.id, isBookmarked: item.isBookmarked })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        />
      );
    }

    if (selectedSubject && (selectedChapter || selectedTopic)) {
      if (loadingMaterials) {
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );
      }

      if (!materials || materials.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <Icon name="folder" type="feather" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No materials found</Text>
          </View>
        );
      }

      return (
        <FlatList
          data={materials}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <MaterialCard
              material={item}
              onPress={() => handleMaterialPress(item)}
              onDownload={() => handleDownload(item)}
              onBookmark={() => bookmarkMutation.mutate({ materialId: item.id, isBookmarked: item.isBookmarked })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        />
      );
    }

    if (selectedChapter) {
      if (loadingTopics) {
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );
      }

      if (!topics || topics.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <Icon name="layers" type="feather" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No topics found</Text>
          </View>
        );
      }

      return (
        <FlatList
          data={topics}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TopicCard topic={item} onPress={() => setSelectedTopic(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        />
      );
    }

    if (selectedSubject) {
      if (loadingChapters) {
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );
      }

      if (!chapters || chapters.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <Icon name="book-open" type="feather" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No chapters found</Text>
          </View>
        );
      }

      return (
        <FlatList
          data={chapters}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <ChapterCard chapter={item} onPress={() => setSelectedChapter(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        />
      );
    }

    if (loadingSubjects) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (!subjects || subjects.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="book" type="feather" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No subjects found</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={subjects}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <SubjectCard subject={item} onPress={() => setSelectedSubject(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
            onPress={() => {
              setActiveTab('browse');
              setSelectedSubject(null);
              setSelectedChapter(null);
              setSelectedTopic(null);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
              Browse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
            onPress={() => setActiveTab('recent')}
          >
            <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bookmarks' && styles.activeTab]}
            onPress={() => setActiveTab('bookmarks')}
          >
            <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.activeTabText]}>
              Bookmarks
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'browse' && (selectedSubject || selectedChapter || selectedTopic) && (
          <View style={styles.breadcrumbContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Icon name="arrow-left" type="feather" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.breadcrumb} numberOfLines={1}>
              {getBreadcrumb()}
            </Text>
          </View>
        )}
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
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  breadcrumb: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  listContent: {
    padding: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  materialCard: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  materialHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  materialIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  materialSubject: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  materialChapter: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  materialDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  materialMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginBottom: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  materialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  downloadButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  uploadedBy: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  navigationCard: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  navigationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  subjectIconText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.background,
    fontWeight: '700',
  },
  chapterIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  navigationCardInfo: {
    flex: 1,
  },
  navigationCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  navigationCardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
