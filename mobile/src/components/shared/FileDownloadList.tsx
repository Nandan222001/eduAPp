import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Icon } from '@rneui/themed';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
import { fileDownloadManager, DownloadTask } from '@utils';

interface FileDownloadListProps {
  onOpenFile?: (uri: string) => void;
}

export const FileDownloadList: React.FC<FileDownloadListProps> = ({ onOpenFile }) => {
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);

  useEffect(() => {
    const unsubscribe = fileDownloadManager.subscribe(setDownloads);
    return unsubscribe;
  }, []);

  const handlePause = async (taskId: string) => {
    await fileDownloadManager.pauseDownload(taskId);
  };

  const handleResume = async (taskId: string) => {
    await fileDownloadManager.resumeDownload(taskId);
  };

  const handleCancel = async (taskId: string) => {
    Alert.alert('Cancel Download', 'Are you sure you want to cancel this download?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          await fileDownloadManager.cancelDownload(taskId);
        },
      },
    ]);
  };

  const handleDelete = async (taskId: string) => {
    Alert.alert('Delete Download', 'Are you sure you want to delete this file?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          await fileDownloadManager.deleteDownload(taskId);
        },
      },
    ]);
  };

  const handleOpenFile = (task: DownloadTask) => {
    if (task.status === 'completed' && task.localUri && onOpenFile) {
      onOpenFile(task.localUri);
    }
  };

  const renderDownloadItem = ({ item }: { item: DownloadTask }) => {
    const getStatusIcon = () => {
      switch (item.status) {
        case 'downloading':
          return 'download';
        case 'paused':
          return 'pause';
        case 'completed':
          return 'check-circle';
        case 'failed':
          return 'alert-circle';
        case 'cancelled':
          return 'x-circle';
        default:
          return 'file';
      }
    };

    const getStatusColor = () => {
      switch (item.status) {
        case 'downloading':
          return COLORS.primary;
        case 'paused':
          return COLORS.warning;
        case 'completed':
          return COLORS.success;
        case 'failed':
          return COLORS.error;
        case 'cancelled':
          return COLORS.textSecondary;
        default:
          return COLORS.textSecondary;
      }
    };

    return (
      <TouchableOpacity
        style={styles.downloadItem}
        onPress={() => handleOpenFile(item)}
        disabled={item.status !== 'completed'}
      >
        <View style={styles.downloadIcon}>
          <Icon name={getStatusIcon()} type="feather" size={24} color={getStatusColor()} />
        </View>

        <View style={styles.downloadInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.fileName}
          </Text>

          {item.status === 'downloading' || item.status === 'paused' ? (
            <>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.progress}%`, backgroundColor: getStatusColor() },
                  ]}
                />
              </View>
              <Text style={styles.downloadStats}>
                {fileDownloadManager.formatFileSize(item.bytesDownloaded)} /{' '}
                {fileDownloadManager.formatFileSize(item.totalBytes)} ({item.progress.toFixed(0)}
                %)
              </Text>
            </>
          ) : (
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              {item.status === 'failed' && item.error && `: ${item.error}`}
            </Text>
          )}
        </View>

        <View style={styles.downloadActions}>
          {item.status === 'downloading' && (
            <>
              <TouchableOpacity onPress={() => handlePause(item.id)} style={styles.actionButton}>
                <Icon name="pause" type="feather" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleCancel(item.id)} style={styles.actionButton}>
                <Icon name="x" type="feather" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </>
          )}

          {item.status === 'paused' && (
            <>
              <TouchableOpacity onPress={() => handleResume(item.id)} style={styles.actionButton}>
                <Icon name="play" type="feather" size={20} color={COLORS.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleCancel(item.id)} style={styles.actionButton}>
                <Icon name="x" type="feather" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </>
          )}

          {(item.status === 'completed' ||
            item.status === 'failed' ||
            item.status === 'cancelled') && (
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
              <Icon name="trash-2" type="feather" size={20} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (downloads.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name="download" type="feather" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>No downloads</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={downloads}
      renderItem={renderDownloadItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: SPACING.md,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  downloadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  downloadInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  fileName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    marginVertical: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  downloadStats: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  downloadActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  emptyState: {
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
});
