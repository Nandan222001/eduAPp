# Offline-First Architecture - Setup Guide

## Quick Start

### 1. Install Dependencies

Run the following commands to install required packages:

```bash
# Install Expo packages
npx expo install expo-background-fetch expo-task-manager

# Install React Native packages
npm install @react-native-community/netinfo

# Or if using yarn
yarn add @react-native-community/netinfo
```

### 2. Update app.json

Add background fetch capabilities to your `app.json`:

```json
{
  "expo": {
    "name": "Your App Name",
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["fetch"]
      }
    },
    "android": {
      "permissions": [
        "ACCESS_NETWORK_STATE"
      ]
    }
  }
}
```

### 3. Update App.tsx

Replace your main App.tsx with the following structure:

```typescript
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { store, persistor } from '@store';
import { appInitializer } from '@utils/appInitializer';
import { useOfflineInit } from '@hooks';
import { OfflineIndicator, SyncStatusBanner } from '@components';

// Loading component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
);

// Main app content
const AppContent: React.FC = () => {
  const { isInitialized } = useOfflineInit();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {/* Global offline indicator */}
      <OfflineIndicator showWhenOnline />
      
      {/* Global sync status banner */}
      <SyncStatusBanner />
      
      {/* Your navigation stack */}
      {/* <YourNavigator /> */}
    </NavigationContainer>
  );
};

// Root App component
export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await appInitializer.initialize();
      } finally {
        setAppReady(true);
      }
    };

    initializeApp();

    return () => {
      appInitializer.cleanup();
    };
  }, []);

  if (!appReady) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}
```

### 4. Add TypeScript Configuration (if needed)

Ensure your tsconfig.json includes the necessary paths:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@api/*": ["src/api/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@store/*": ["src/store/*"],
      "@types": ["src/types"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

Update babel.config.js to support path aliases:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@api': './src/api',
            '@components': './src/components',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@types': './src/types',
            '@utils': './src/utils',
          },
        },
      ],
    ],
  };
};
```

## Step-by-Step Integration

### Step 1: Dashboard Screen

```typescript
import React, { useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useDashboardSync } from '@hooks';
import { CachedDataIndicator } from '@components';

export const DashboardScreen: React.FC = () => {
  const { syncDashboard, isSyncing, lastSynced } = useDashboardSync();
  const dashboardData = useAppSelector(state => state.dashboard);

  useEffect(() => {
    syncDashboard();
  }, []);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isSyncing} onRefresh={syncDashboard} />
      }
    >
      <CachedDataIndicator lastSynced={lastSynced} isSyncing={isSyncing} />
      {/* Your dashboard content */}
    </ScrollView>
  );
};
```

### Step 2: Assignments Screen with Offline Support

```typescript
import React, { useEffect } from 'react';
import { View, Button, Alert } from 'react-native';
import { useAssignmentsSync, useNetworkStatus } from '@hooks';
import { offlineAwareApi } from '@api/offlineAwareApi';
import { OfflineIndicator, CachedDataIndicator } from '@components';

export const AssignmentsScreen: React.FC = () => {
  const { syncAssignments, isSyncing, lastSynced, assignments } = useAssignmentsSync();
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    syncAssignments();
  }, []);

  const handleSubmit = async (assignmentId: number) => {
    try {
      const result = await offlineAwareApi.submitAssignment({
        assignmentId,
        comments: 'My submission',
        attachments: [],
      }, {
        optimistic: true,
        onSuccess: () => Alert.alert('Success', 'Submitted'),
        onError: (err) => Alert.alert('Error', err.message),
      });

      if (result.queued) {
        Alert.alert('Queued', 'Will sync when online');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View>
      <OfflineIndicator />
      <CachedDataIndicator lastSynced={lastSynced} isSyncing={isSyncing} />
      
      {/* Assignment list */}
      {assignments.map(assignment => (
        <View key={assignment.id}>
          {/* Assignment details */}
          <Button title="Submit" onPress={() => handleSubmit(assignment.id)} />
        </View>
      ))}
    </View>
  );
};
```

### Step 3: Settings Screen with Offline Controls

```typescript
import React from 'react';
import { View } from 'react-native';
import { OfflineSettingsScreen } from '@screens/OfflineSettingsScreen';

// Or create your own simplified version:
export const SettingsScreen: React.FC = () => {
  return (
    <View>
      <OfflineSettingsScreen />
    </View>
  );
};
```

## Common Patterns

### Pattern 1: Data Fetching with Offline Cache

```typescript
const { syncData, isSyncing, lastSynced, error } = useDataSync();

useEffect(() => {
  syncData(); // Always try to sync on mount
}, []);

// Data will come from Redux store (cached) if offline
const data = useAppSelector(state => state.yourSlice.data);
```

### Pattern 2: Optimistic Updates

```typescript
const handleAction = async () => {
  const result = await offlineAwareApi.doAction(data, {
    optimistic: true, // Update UI immediately
  });
  
  if (result.queued) {
    // Show queued message
  }
};
```

### Pattern 3: Network-Aware UI

```typescript
const { isConnected } = useNetworkStatus();

return (
  <View>
    {!isConnected && (
      <View style={styles.offlineBanner}>
        <Text>Offline Mode</Text>
      </View>
    )}
    {/* Content */}
  </View>
);
```

### Pattern 4: Manual Sync

```typescript
import { ManualSyncButton } from '@components';

<ManualSyncButton
  onSyncComplete={(success, result) => {
    if (success) {
      // Refresh your data
      syncData();
    }
  }}
/>
```

## Testing Your Implementation

### 1. Test Offline Mode

```bash
# On iOS Simulator
Hardware > Network Link Conditioner > 100% Loss

# On Android Emulator
Extended Controls > Cellular > Network type: None

# On Physical Device
Enable Airplane Mode
```

### 2. Test Background Sync

```typescript
// Check if background task is registered
import { backgroundSyncService } from '@utils/backgroundSync';

const isRegistered = await backgroundSyncService.isTaskRegistered();
console.log('Background sync registered:', isRegistered);
```

### 3. Test Queue

```typescript
import { offlineQueueManager } from '@utils/offlineQueue';

const queueState = offlineQueueManager.getQueueState();
console.log('Queue state:', queueState);
```

### 4. Debug Logs

Enable detailed logs in development:

```typescript
// In offlineQueue.ts and backgroundSync.ts
console.log('[Component] Action:', data);
```

## Troubleshooting

### Issue: Background sync not working

**Solution:**
1. Check if task is registered:
```typescript
const isRegistered = await backgroundSyncService.isTaskRegistered();
```

2. Check background fetch status:
```typescript
const status = await backgroundSyncService.getStatus();
```

3. Verify app.json configuration includes UIBackgroundModes

### Issue: Data not persisting

**Solution:**
1. Check Redux persist configuration in store.ts
2. Verify AsyncStorage permissions
3. Check if slice is in whitelist

### Issue: Queue not processing

**Solution:**
1. Check network status
2. Verify queue has items:
```typescript
const state = offlineQueueManager.getQueueState();
```
3. Trigger manual sync

### Issue: Optimistic updates not rolling back

**Solution:**
1. Ensure original state is preserved before update
2. Check error handling in offlineAwareApi
3. Verify rollback action is dispatched

## Performance Tips

1. **Limit persisted data**: Only persist necessary state
2. **Throttle syncs**: Don't sync on every render
3. **Use refresh controls**: Let users manually refresh
4. **Clear old queue items**: Periodically clean up old requests
5. **Monitor queue size**: Alert if queue gets too large

## Best Practices

1. **Always show network status** in critical screens
2. **Provide manual sync option** as fallback
3. **Use optimistic updates** for better UX
4. **Handle errors gracefully** with user-friendly messages
5. **Test thoroughly offline** before deploying
6. **Document offline behavior** for users
7. **Monitor sync failures** in production

## Production Checklist

- [ ] Dependencies installed
- [ ] app.json updated with background modes
- [ ] App.tsx properly configured
- [ ] All screens use sync hooks
- [ ] Network indicators visible
- [ ] Error handling implemented
- [ ] Offline tested thoroughly
- [ ] Background sync tested
- [ ] Queue management working
- [ ] Documentation updated
- [ ] User guide created

## Next Steps

1. Review OFFLINE_IMPLEMENTATION.md for detailed documentation
2. Check USAGE_EXAMPLES.tsx for code examples
3. Implement offline features in your screens
4. Test thoroughly in offline mode
5. Monitor queue and sync in production

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the implementation files
3. Check console logs for errors
4. Verify network status and queue state

## Conclusion

You now have a complete offline-first architecture. Follow this guide to integrate it into your screens, and your users will be able to work seamlessly even without internet connectivity!
