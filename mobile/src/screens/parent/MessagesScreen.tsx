import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Card, Icon, Badge } from '@rneui/themed';
import { useMessageThreads, useThreadMessages, useSendMessage } from '@hooks/useParentQueries';
import { LoadingState } from '@components/shared/LoadingState';
import { ErrorState } from '@components/shared/ErrorState';
import { EmptyState } from '@components/shared/EmptyState';
import { COLORS, SPACING } from '@constants';
import type { MessageThread, TeacherMessage } from '../../types/parent';

export const MessagesScreen = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');

  const {
    data: threads,
    isLoading: isLoadingThreads,
    isError: isErrorThreads,
    error: threadsError,
    refetch: refetchThreads,
    isRefetching: isRefetchingThreads,
  } = useMessageThreads();

  const { data: threadDetails, refetch: refetchMessages } = useThreadMessages(selectedThreadId);

  const sendMessageMutation = useSendMessage();

  const handleSendMessage = () => {
    if (!messageText.trim() || !threadDetails) return;

    sendMessageMutation.mutate(
      {
        childId: threadDetails.childId,
        teacherId: threadDetails.teacherId,
        subject: threadDetails.subject,
        message: messageText,
        threadId: threadDetails.id,
      },
      {
        onSuccess: () => {
          setMessageText('');
          refetchMessages();
        },
        onError: (error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
          alert(errorMessage);
        },
      }
    );
  };

  if (isLoadingThreads) {
    return <LoadingState message="Loading messages..." />;
  }

  if (isErrorThreads) {
    return (
      <ErrorState
        message={threadsError?.message || 'Failed to load messages'}
        onRetry={() => refetchThreads()}
      />
    );
  }

  if (!threads || threads.length === 0) {
    return <EmptyState title="No Messages" message="No messages found" />;
  }

  if (selectedThreadId && threadDetails) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.threadDetailHeader}>
          <TouchableOpacity onPress={() => setSelectedThreadId(null)} style={styles.backButton}>
            <Icon name="arrow-back" type="material" color={COLORS.primary} size={24} />
          </TouchableOpacity>
          <View style={styles.threadHeaderInfo}>
            <Text style={styles.threadHeaderTitle}>{threadDetails.teacherName}</Text>
            <Text style={styles.threadHeaderSubtitle}>
              {threadDetails.childName} - {threadDetails.subject}
            </Text>
          </View>
        </View>

        <FlatList
          data={threadDetails.messages}
          keyExtractor={item => item.id.toString()}
          inverted
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }: { item: TeacherMessage }) => (
            <View
              style={[
                styles.messageItem,
                item.senderRole === 'parent' ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.senderRole === 'parent' ? styles.myMessageBubble : styles.theirMessageBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageSender,
                    item.senderRole === 'parent' ? styles.myMessageText : styles.theirMessageText,
                  ]}
                >
                  {item.senderName}
                </Text>
                <Text
                  style={[
                    styles.messageText,
                    item.senderRole === 'parent' ? styles.myMessageText : styles.theirMessageText,
                  ]}
                >
                  {item.message}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    item.senderRole === 'parent' ? styles.myMessageTime : styles.theirMessageTime,
                  ]}
                >
                  {new Date(item.sentAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            style={[
              styles.sendButton,
              (!messageText.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
            ]}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            <Icon
              name="send"
              type="material"
              color={
                messageText.trim() && !sendMessageMutation.isPending
                  ? COLORS.primary
                  : COLORS.disabled
              }
              size={24}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <FlatList
      data={threads}
      keyExtractor={item => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={isRefetchingThreads} onRefresh={refetchThreads} />
      }
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }: { item: MessageThread }) => (
        <TouchableOpacity onPress={() => setSelectedThreadId(item.id)}>
          <Card containerStyle={styles.threadCard}>
            <View style={styles.threadRow}>
              <View style={styles.threadIconContainer}>
                <Icon name="person" type="material" color={COLORS.primary} size={32} />
                {item.unreadCount > 0 && (
                  <Badge
                    value={item.unreadCount}
                    status="error"
                    containerStyle={styles.unreadBadge}
                  />
                )}
              </View>
              <View style={styles.threadContent}>
                <View style={styles.threadHeader}>
                  <Text style={styles.teacherName}>{item.teacherName}</Text>
                  <Text style={styles.messageDate}>
                    {new Date(item.lastMessageAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <Text style={styles.childInfo}>
                  {item.childName} - {item.subject}
                </Text>
                <Text style={styles.lastMessage} numberOfLines={2}>
                  {item.lastMessage}
                </Text>
              </View>
              <Icon name="chevron-right" type="material" color={COLORS.textSecondary} />
            </View>
          </Card>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<EmptyState title="No Threads" message="No message threads" />}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    padding: SPACING.sm,
  },
  threadCard: {
    borderRadius: 8,
    marginHorizontal: 0,
    marginVertical: SPACING.xs,
    padding: SPACING.md,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threadIconContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  messageDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  childInfo: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  threadDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  threadHeaderInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  threadHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  threadHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  messagesList: {
    padding: SPACING.md,
  },
  messageItem: {
    marginVertical: SPACING.xs,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: SPACING.sm,
    borderRadius: 12,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
  },
  theirMessageBubble: {
    backgroundColor: COLORS.surface,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
