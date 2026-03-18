# Offline-First Architecture Implementation

## Overview

This mobile app implements a comprehensive offline-first architecture using Redux Persist, offline queue management, and background sync capabilities. The implementation ensures users can continue working even without network connectivity, with automatic synchronization when connection is restored.

## Features

### 1. Redux Persist Configuration
- **Location**: `/mobile/src/store/store.ts`
- **Persisted State**: Auth, User, Dashboard, Assignments, Grades, Attendance
- **Storage**: AsyncStorage
- **Configuration**: Whitelist approach for selective persistence

### 2. Offline Queue Manager
- **Location**: `/mobile/src/utils/offlineQueue.ts`
- **Features**:
  - Queues failed API requests when offline
  - Automatic retry with exponential backoff
  - Maximum retry attempts (3 by default)
  - Request metadata tracking
  - Network state monitoring using @react-native-community/netinfo

**Supported Request Types**:
- Assignment Submissions
- Attendance Marking
- Doubt Posts
- Doubt Answers
- Profile Updates

### 3. Background Sync Service
- **Location**: `/mobile/src/utils/backgroundSync.ts`
- **Features**:
  - Periodic background sync using expo-background-fetch
  - Task scheduling with expo-task-manager
  - Sync interval: 15 minutes
  - Manual sync trigger
  - Last sync result tracking

### 4. Offline-Aware API Layer
- **Location**: `/mobile/src/api/offlineAwareApi.ts`
- **Features**:
  - Automatic offline detection
  - Queue requests when offline
  - Optimistic UI updates
  - Rollback on failure
  - Network error handling

### 5. UI Components

#### OfflineIndicator
- **Location**: `/mobile/src/components/OfflineIndicator.tsx`
- Shows current online/offline status
- Displays pending queue count
- Shows last sync timestamp

#### SyncStatusBanner
- **Location**: `/mobile/src/components/SyncStatusBanner.tsx`
- Displays pending and failed sync items
- Manual sync trigger button
- Shows sync progress

#### CachedDataIndicator
- **Location**: `/mobile/src/components/CachedDataIndicator.tsx`
- Shows when data was last updated
- Indicates cached data usage
- Syncing animation

#### ManualSyncButton
- **Location**: `/mobile/src/components/ManualSyncButton.tsx`
- Trigger manual sync
- Shows pending count badge
- Sync progress indicator

#### OfflineQueueViewer
- **Location**: `/mobile/src/components/OfflineQueueViewer.tsx`
- Lists all queued requests
- Shows request details and metadata
- Retry and clear actions

### 6. Custom Hooks

#### useOfflineSync
- **Location**: `/mobile/src/hooks/useOfflineSync.ts`
- Subscribe to queue state changes
- Trigger manual sync
- Clear queue operations

#### useNetworkStatus
- **Location**: `/mobile/src/hooks/useNetworkStatus.ts`
- Real-time network status
- Connection type detection
- Internet reachability check

#### useOfflineInit
- **Location**: `/mobile/src/hooks/useOfflineInit.ts`
- Initialize offline features
- Register background tasks
- Process pending queue on startup

#### Data Sync Hooks
- **useDashboardSync**: Sync dashboard data
- **useAssignmentsSync**: Sync assignments
- **useGradesSync**: Sync grades
- **useAttendanceSync**: Sync attendance

## Installation

Install required dependencies:

```bash
npx expo install expo-background-fetch expo-task-manager
npm install @react-native-community/netinfo
```

## Usage

### 1. Initialize Offline Features

In your App component:

```typescript
import { useOfflineInit } from '@hooks';

function App() {
  const { isInitialized, error } = useOfflineInit();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return <MainApp />;
}
```

### 2. Use Offline-Aware API

```typescript
import { offlineAwareApi } from '@api/offlineAwareApi';

// Submit assignment with optimistic update
const handleSubmit = async (data: SubmitAssignmentData) => {
  const result = await offlineAwareApi.submitAssignment(data, {
    optimistic: true,
    onSuccess: () => console.log('Submitted'),
    onError: (error) => console.error(error),
  });

  if (result.queued) {
    Alert.alert('Queued', 'Will sync when online');
  }
};
```

### 3. Display Network Status

```typescript
import { OfflineIndicator } from '@components';

function Header() {
  return (
    <View>
      <OfflineIndicator showWhenOnline />
    </View>
  );
}
```

### 4. Sync Data

```typescript
import { useDashboardSync } from '@hooks';

function DashboardScreen() {
  const { syncDashboard, isSyncing, lastSynced } = useDashboardSync();

  useEffect(() => {
    syncDashboard();
  }, []);

  return (
    <View>
      <CachedDataIndicator lastSynced={lastSynced} isSyncing={isSyncing} />
      {/* Dashboard content */}
    </View>
  );
}
```

### 5. Manual Sync Trigger

```typescript
import { ManualSyncButton } from '@components';

function SettingsScreen() {
  return (
    <View>
      <ManualSyncButton
        onSyncComplete={(success, result) => {
          console.log('Sync result:', result);
        }}
      />
    </View>
  );
}
```

## Data Flow

### Online Mode
1. User performs action
2. API request sent immediately
3. Response updates Redux state
4. State persisted to AsyncStorage
5. UI updates with new data

### Offline Mode
1. User performs action
2. Optimistic UI update (if enabled)
3. Request queued in offline queue
4. Queue persisted to AsyncStorage
5. UI shows "queued" indicator
6. When connection restored:
   - Background sync or manual sync triggered
   - Queued requests processed
   - Redux state updated
   - UI refreshed

## Error Handling

### Network Errors
- Automatically detected and handled
- Requests queued for retry
- User notified of offline state

### Sync Failures
- Failed requests marked in queue
- Retry count tracked
- Manual retry available
- Clear failed requests option

### Optimistic Update Rollback
- Original state preserved
- Automatic rollback on failure
- User notified of error

## Configuration

### Queue Settings
```typescript
// In offlineQueue.ts
const MAX_RETRY_ATTEMPTS = 3;
const OFFLINE_QUEUE_KEY = '@offline_queue';
```

### Background Sync Settings
```typescript
// In backgroundSync.ts
minimumInterval: 15 * 60, // 15 minutes
stopOnTerminate: false,
startOnBoot: true,
```

### Persist Configuration
```typescript
// In store.ts
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'dashboard', 'assignments', 'grades', 'attendance'],
};
```

## Testing

### Test Offline Mode
1. Enable airplane mode
2. Perform actions (submit assignment, post doubt)
3. Verify requests queued
4. Disable airplane mode
5. Verify automatic sync

### Test Background Sync
1. Queue requests while offline
2. Close app
3. Restore connection
4. Wait 15 minutes
5. Check sync results

### Test Optimistic Updates
1. Enable optimistic updates
2. Go offline
3. Submit assignment
4. Verify UI update
5. Go online
6. Verify sync success

## Troubleshooting

### Background Sync Not Working
- Check background permissions
- Verify task registration
- Check expo-background-fetch status

### Queue Not Processing
- Verify network connection
- Check queue state
- Trigger manual sync

### Data Not Persisting
- Check AsyncStorage permissions
- Verify persist configuration
- Check storage space

## Best Practices

1. **Always use offline-aware APIs** for write operations
2. **Display network status** prominently
3. **Show cached data indicators** on data-heavy screens
4. **Handle optimistic updates** carefully
5. **Provide manual sync** as fallback
6. **Clear failed requests** periodically
7. **Monitor queue size** to prevent overflow
8. **Test offline scenarios** thoroughly

## Future Enhancements

- Conflict resolution for concurrent updates
- Delta sync for large datasets
- Compression for queued requests
- Advanced retry strategies
- Sync priority levels
- Offline analytics
- Data migration strategies
