import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Card, Badge, Icon, Button, Overlay, Input } from '@rneui/themed';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { MainStackScreenProps } from '@types';
import { doubtsApi } from '../../api/doubts';
import { studyMaterialsApi } from '../../api/studyMaterials';
import type { Doubt, Answer, Subject, CreateDoubtRequest } from '@types';

type Props = MainStackScreenProps<'DoubtForum'>;

const DoubtCard: React.FC<{
  doubt: Doubt;
  onPress: () => void;
  onUpvote: () => void;
}> = ({ doubt, onPress, onUpvote }) => {
  const getStatusColor = () => {
    const statusColors = {
      open: COLORS.warning,
      answered: COLORS.info,
      resolved: COLORS.success,
      closed: COLORS.textSecondary,
    };
    return statusColors[doubt.status];
  };

  const getPriorityColor = () => {
    const priorityColors = {
      low: COLORS.textSecondary,
      medium: COLORS.warning,
      high: COLORS.error,
    };
    return priorityColors[doubt.priority];
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card containerStyle={styles.doubtCard}>
        <View style={styles.doubtHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {doubt.studentProfilePhoto ? (
                <Icon name="user" type="feather" size={20} color={COLORS.textSecondary} />
              ) : (
                <Icon name="user" type="feather" size={20} color={COLORS.textSecondary} />
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{doubt.studentName}</Text>
              <Text style={styles.timestamp}>
                {format(parseISO(doubt.createdAt), 'MMM dd, yyyy h:mm a')}
              </Text>
            </View>
          </View>
          <View style={styles.badges}>
            <Badge value={doubt.status} badgeStyle={{ backgroundColor: getStatusColor() }} />
            <Badge
              value={doubt.priority}
              badgeStyle={{ backgroundColor: getPriorityColor(), marginLeft: SPACING.xs }}
            />
          </View>
        </View>

        <Text style={styles.doubtTitle}>{doubt.title}</Text>

        <Text style={styles.doubtDescription} numberOfLines={3}>
          {doubt.description}
        </Text>

        <View style={styles.doubtMeta}>
          <View style={styles.metaItem}>
            <Icon name="book" type="feather" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{doubt.subjectName}</Text>
          </View>
          {doubt.chapterName && (
            <View style={styles.metaItem}>
              <Icon name="bookmark" type="feather" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{doubt.chapterName}</Text>
            </View>
          )}
        </View>

        {doubt.tags && doubt.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {doubt.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.doubtFooter}>
          <TouchableOpacity onPress={onUpvote} style={styles.upvoteButton}>
            <Icon
              name={doubt.isUpvoted ? 'arrow-up-circle' : 'arrow-up'}
              type="feather"
              size={20}
              color={doubt.isUpvoted ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.footerText, doubt.isUpvoted && { color: COLORS.primary }]}>
              {doubt.upvoteCount}
            </Text>
          </TouchableOpacity>
          <View style={styles.footerItem}>
            <Icon name="message-circle" type="feather" size={18} color={COLORS.textSecondary} />
            <Text style={styles.footerText}>{doubt.answerCount} answers</Text>
          </View>
          <View style={styles.footerItem}>
            <Icon name="eye" type="feather" size={18} color={COLORS.textSecondary} />
            <Text style={styles.footerText}>{doubt.viewCount}</Text>
          </View>
        </View>

        {doubt.attachments && doubt.attachments.length > 0 && (
          <View style={styles.attachmentsIndicator}>
            <Icon name="paperclip" type="feather" size={14} color={COLORS.textSecondary} />
            <Text style={styles.attachmentText}>
              {doubt.attachments.length} attachment{doubt.attachments.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const AnswerCard: React.FC<{
  answer: Answer;
  onUpvote: () => void;
  onAccept?: () => void;
  canAccept?: boolean;
}> = ({ answer, onUpvote, onAccept, canAccept }) => {
  return (
    <Card containerStyle={styles.answerCard}>
      <View style={styles.answerHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, answer.isAccepted && styles.acceptedAvatar]}>
            <Icon name="user" type="feather" size={18} color={COLORS.textSecondary} />
          </View>
          <View style={styles.userDetails}>
            <View style={styles.answerUserRow}>
              <Text style={styles.userName}>{answer.answeredByName}</Text>
              <Badge
                value={answer.answeredByRole}
                badgeStyle={{
                  backgroundColor:
                    answer.answeredByRole === 'teacher' ? COLORS.primary : COLORS.secondary,
                  marginLeft: SPACING.xs,
                }}
                textStyle={{ fontSize: FONT_SIZES.xs }}
              />
              {answer.isAccepted && (
                <Icon
                  name="check-circle"
                  type="feather"
                  size={16}
                  color={COLORS.success}
                  style={{ marginLeft: SPACING.xs }}
                />
              )}
            </View>
            <Text style={styles.timestamp}>
              {format(parseISO(answer.createdAt), 'MMM dd, yyyy h:mm a')}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.answerContent}>{answer.content}</Text>

      {answer.attachments && answer.attachments.length > 0 && (
        <View style={styles.answerAttachments}>
          {answer.attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentItem}>
              <Icon name="image" type="feather" size={16} color={COLORS.primary} />
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachment.fileName}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.answerFooter}>
        <TouchableOpacity onPress={onUpvote} style={styles.upvoteButton}>
          <Icon
            name={answer.isUpvoted ? 'arrow-up-circle' : 'arrow-up'}
            type="feather"
            size={18}
            color={answer.isUpvoted ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.footerText, answer.isUpvoted && { color: COLORS.primary }]}>
            {answer.upvoteCount}
          </Text>
        </TouchableOpacity>
        {canAccept && !answer.isAccepted && onAccept && (
          <TouchableOpacity onPress={onAccept} style={styles.acceptButton}>
            <Icon name="check" type="feather" size={16} color={COLORS.success} />
            <Text style={styles.acceptButtonText}>Accept Answer</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const DoubtComposer: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSubmit: (doubt: CreateDoubtRequest) => void;
  subjects: Subject[];
}> = ({ visible, onClose, onSubmit, subjects }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);

  const { data: chapters } = useQuery({
    queryKey: ['chapters', selectedSubject],
    queryFn: () => studyMaterialsApi.getChaptersBySubject(selectedSubject!),
    enabled: !!selectedSubject,
  });

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setAttachments([...attachments, ...result.assets]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !selectedSubject) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const doubt: CreateDoubtRequest = {
      title: title.trim(),
      description: description.trim(),
      subjectId: selectedSubject,
      chapterId: selectedChapter || undefined,
      priority,
      tags: tags.length > 0 ? tags : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    onSubmit(doubt);
    setTitle('');
    setDescription('');
    setSelectedSubject(null);
    setSelectedChapter(null);
    setPriority('medium');
    setTags([]);
    setAttachments([]);
  };

  return (
    <Overlay
      isVisible={visible}
      onBackdropPress={onClose}
      overlayStyle={styles.composerOverlay}
      fullScreen
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.composerContainer}
      >
        <View style={styles.composerHeader}>
          <Text style={styles.composerTitle}>Post a Doubt</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="x" type="feather" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.composerContent}>
          <Input
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            containerStyle={styles.inputContainer}
            inputContainerStyle={styles.input}
          />

          <View style={styles.textAreaContainer}>
            <TextInput
              placeholder="Describe your doubt in detail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              style={styles.textArea}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Subject *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  onPress={() => setSelectedSubject(subject.id)}
                  style={[
                    styles.chip,
                    selectedSubject === subject.id && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedSubject === subject.id && styles.chipTextSelected,
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedSubject && chapters && chapters.length > 0 && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Chapter (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {chapters.map(chapter => (
                  <TouchableOpacity
                    key={chapter.id}
                    onPress={() => setSelectedChapter(chapter.id)}
                    style={[
                      styles.chip,
                      selectedChapter === chapter.id && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedChapter === chapter.id && styles.chipTextSelected,
                      ]}
                    >
                      {chapter.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.priorityButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      priority === p && styles.priorityTextSelected,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                placeholder="Add tag and press enter"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                style={styles.tagInput}
              />
              <TouchableOpacity onPress={handleAddTag} style={styles.addTagButton}>
                <Icon name="plus" type="feather" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <Icon name="x" type="feather" size={14} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Attachments</Text>
            <TouchableOpacity onPress={handleImagePick} style={styles.attachButton}>
              <Icon name="image" type="feather" size={20} color={COLORS.primary} />
              <Text style={styles.attachButtonText}>Add Images/Diagrams</Text>
            </TouchableOpacity>
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment, index) => (
                  <View key={index} style={styles.attachmentPreview}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      Image {index + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setAttachments(attachments.filter((_, i) => i !== index))}
                    >
                      <Icon name="x" type="feather" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.composerFooter}>
          <Button
            title="Cancel"
            onPress={onClose}
            type="outline"
            containerStyle={styles.footerButton}
          />
          <Button
            title="Post Doubt"
            onPress={handleSubmit}
            containerStyle={styles.footerButton}
          />
        </View>
      </KeyboardAvoidingView>
    </Overlay>
  );
};

export const DoubtForumScreen: React.FC<Props> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'answered' | 'resolved'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [answerText, setAnswerText] = useState('');

  const queryClient = useQueryClient();

  const { data: doubts, isLoading: loadingDoubts } = useQuery({
    queryKey: ['doubts', filterStatus, searchQuery],
    queryFn: async () => {
      const filter = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchQuery || undefined,
      };
      return doubtsApi.getDoubts(filter);
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: studyMaterialsApi.getSubjects,
  });

  const { data: answers, isLoading: loadingAnswers } = useQuery({
    queryKey: ['answers', selectedDoubt?.id],
    queryFn: () => doubtsApi.getAnswers(selectedDoubt!.id),
    enabled: !!selectedDoubt,
  });

  const postDoubtMutation = useMutation({
    mutationFn: doubtsApi.postDoubt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doubts'] });
      setShowComposer(false);
      Alert.alert('Success', 'Your doubt has been posted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to post doubt. Please try again.');
    },
  });

  const postAnswerMutation = useMutation({
    mutationFn: doubtsApi.postAnswer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers'] });
      queryClient.invalidateQueries({ queryKey: ['doubts'] });
      setAnswerText('');
      Alert.alert('Success', 'Your answer has been posted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to post answer. Please try again.');
    },
  });

  const upvoteDoubtMutation = useMutation({
    mutationFn: async (doubtId: number) => {
      const doubt = doubts?.find(d => d.id === doubtId);
      if (doubt?.isUpvoted) {
        await doubtsApi.removeUpvoteDoubt(doubtId);
      } else {
        await doubtsApi.upvoteDoubt(doubtId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doubts'] });
    },
  });

  const upvoteAnswerMutation = useMutation({
    mutationFn: async (answerId: number) => {
      const answer = answers?.find(a => a.id === answerId);
      if (answer?.isUpvoted) {
        await doubtsApi.removeUpvoteAnswer(answerId);
      } else {
        await doubtsApi.upvoteAnswer(answerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers'] });
    },
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: doubtsApi.acceptAnswer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers'] });
      queryClient.invalidateQueries({ queryKey: ['doubts'] });
      Alert.alert('Success', 'Answer has been accepted');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['doubts'] });
    setRefreshing(false);
  };

  const handleDoubtPress = (doubt: Doubt) => {
    setSelectedDoubt(doubt);
  };

  const handlePostAnswer = () => {
    if (!answerText.trim() || !selectedDoubt) return;

    postAnswerMutation.mutate({
      doubtId: selectedDoubt.id,
      content: answerText.trim(),
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (selectedDoubt) {
    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedDoubt(null)} style={styles.backButton}>
            <Icon name="arrow-left" type="feather" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Doubt Details</Text>
        </View>

        <ScrollView style={styles.detailContent}>
          <Card containerStyle={styles.doubtDetailCard}>
            <View style={styles.doubtHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Icon name="user" type="feather" size={20} color={COLORS.textSecondary} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{selectedDoubt.studentName}</Text>
                  <Text style={styles.timestamp}>
                    {format(parseISO(selectedDoubt.createdAt), 'MMM dd, yyyy h:mm a')}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.doubtDetailTitle}>{selectedDoubt.title}</Text>
            <Text style={styles.doubtDetailDescription}>{selectedDoubt.description}</Text>

            <View style={styles.doubtMeta}>
              <View style={styles.metaItem}>
                <Icon name="book" type="feather" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>{selectedDoubt.subjectName}</Text>
              </View>
              {selectedDoubt.chapterName && (
                <View style={styles.metaItem}>
                  <Icon name="bookmark" type="feather" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{selectedDoubt.chapterName}</Text>
                </View>
              )}
            </View>

            {selectedDoubt.tags && selectedDoubt.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {selectedDoubt.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <View style={styles.answersSection}>
            <Text style={styles.answersSectionTitle}>
              {selectedDoubt.answerCount} Answer{selectedDoubt.answerCount !== 1 ? 's' : ''}
            </Text>

            {loadingAnswers ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : answers && answers.length > 0 ? (
              answers.map(answer => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  onUpvote={() => upvoteAnswerMutation.mutate(answer.id)}
                  onAccept={() => acceptAnswerMutation.mutate(answer.id)}
                  canAccept={selectedDoubt.status === 'answered' && !answer.isAccepted}
                />
              ))
            ) : (
              <View style={styles.noAnswersContainer}>
                <Icon name="message-circle" type="feather" size={48} color={COLORS.textSecondary} />
                <Text style={styles.noAnswersText}>No answers yet</Text>
                <Text style={styles.noAnswersSubtext}>Be the first to answer this doubt</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.answerComposer}>
          <TextInput
            placeholder="Write your answer..."
            value={answerText}
            onChangeText={setAnswerText}
            multiline
            style={styles.answerInput}
          />
          <TouchableOpacity
            onPress={handlePostAnswer}
            style={[styles.sendButton, !answerText.trim() && styles.sendButtonDisabled]}
            disabled={!answerText.trim()}
          >
            <Icon
              name="send"
              type="feather"
              size={20}
              color={answerText.trim() ? COLORS.primary : COLORS.disabled}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" type="feather" size={20} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Search doubts..."
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {(['all', 'open', 'answered', 'resolved'] as const).map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilterStatus(status)}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loadingDoubts ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : doubts && doubts.length > 0 ? (
        <FlatList
          data={doubts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <DoubtCard
              doubt={item}
              onPress={() => handleDoubtPress(item)}
              onUpvote={() => upvoteDoubtMutation.mutate(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      ) : (
        <View style={styles.centerContainer}>
          <Icon name="help-circle" type="feather" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No doubts found</Text>
          <Text style={styles.emptySubtext}>Post your first doubt to get started</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => setShowComposer(true)} style={styles.fab}>
        <Icon name="plus" type="feather" size={28} color={COLORS.background} />
      </TouchableOpacity>

      {subjects && (
        <DoubtComposer
          visible={showComposer}
          onClose={() => setShowComposer(false)}
          onSubmit={(doubt) => postDoubtMutation.mutate(doubt)}
          subjects={subjects}
        />
      )}
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filterBar: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.background,
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
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  doubtCard: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doubtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  acceptedAvatar: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
  },
  doubtTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  doubtDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  doubtMeta: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  doubtFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  attachmentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachmentText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  composerOverlay: {
    padding: 0,
    margin: 0,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  composerContainer: {
    flex: 1,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  composerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  composerContent: {
    flex: 1,
    padding: SPACING.md,
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  textAreaContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  textArea: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 120,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.background,
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priorityButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priorityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  priorityTextSelected: {
    color: COLORS.background,
    fontWeight: '600',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  tagInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  addTagButton: {
    padding: SPACING.sm,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  attachButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  attachmentsList: {
    marginTop: SPACING.sm,
  },
  attachmentPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  attachmentName: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  composerFooter: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  detailHeaderTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  detailContent: {
    flex: 1,
  },
  doubtDetailCard: {
    borderRadius: BORDER_RADIUS.lg,
    margin: SPACING.md,
    padding: SPACING.md,
  },
  doubtDetailTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  doubtDetailDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  answersSection: {
    padding: SPACING.md,
  },
  answersSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  answerCard: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  answerHeader: {
    marginBottom: SPACING.sm,
  },
  answerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerContent: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  answerAttachments: {
    marginBottom: SPACING.sm,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  answerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
  },
  acceptButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: '600',
    marginLeft: 4,
  },
  noAnswersContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noAnswersText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  noAnswersSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  answerComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  answerInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    maxHeight: 100,
    marginRight: SPACING.sm,
  },
  sendButton: {
    padding: SPACING.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
