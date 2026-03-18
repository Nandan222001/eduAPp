/**
 * Example App.tsx Integration
 *
 * This file demonstrates how to integrate the offline-first architecture
 * into your main App component.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@store';
import { appInitializer } from '@utils/appInitializer';
import { OfflineIndicator, SyncStatusBanner } from '@components';
import { useOfflineInit } from '@hooks';

// Loading component while Redux persist rehydrates
const PersistGateLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2196F3" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Main app content after initialization
const AppContent: React.FC = () => {
  const { isInitialized, error } = useOfflineInit();

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Initializing offline features...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      {/* Global offline indicator */}
      <View style={styles.statusBar}>
        <OfflineIndicator showWhenOnline />
      </View>

      {/* Global sync status banner */}
      <SyncStatusBanner />

      {/* Your main app navigation goes here */}
      {/* <NavigationContainer>...</NavigationContainer> */}

      <View style={styles.placeholder}>
        <Text>Your App Content Here</Text>
      </View>
    </View>
  );
};

// Root App component with providers
export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Initialize app services
    const initializeApp = async () => {
      try {
        await appInitializer.initialize();
        setAppReady(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setAppReady(true); // Continue anyway
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      appInitializer.cleanup();
    };
  }, []);

  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Starting app...</Text>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<PersistGateLoading />} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statusBar: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
