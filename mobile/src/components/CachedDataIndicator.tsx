import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';

interface CachedDataIndicatorProps {
  lastSynced: string | null;
  isSyncing?: boolean;
  style?: any;
}

export const CachedDataIndicator: React.FC<CachedDataIndicatorProps> = ({
  lastSynced,
  isSyncing = false,
  style,
}) => {
  if (!lastSynced && !isSyncing) {
    return null;
  }

  const getTimestamp = () => {
    if (isSyncing) return 'Syncing...';
    if (!lastSynced) return 'Cached data';

    try {
      const timeAgo = formatDistanceToNow(new Date(lastSynced), { addSuffix: true });
      return `Updated ${timeAgo}`;
    } catch {
      return 'Cached data';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.indicator, isSyncing && styles.indicatorSyncing]} />
      <Text style={styles.text}>{getTimestamp()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9E9E9E',
    marginRight: 6,
  },
  indicatorSyncing: {
    backgroundColor: '#4CAF50',
  },
  text: {
    color: '#616161',
    fontSize: 11,
    fontWeight: '500',
  },
});
