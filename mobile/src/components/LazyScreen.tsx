import React, { Suspense, ComponentType, lazy as reactLazy } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@constants';

interface LazyScreenProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  [key: string]: any;
}

const LoadingFallback = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

export const LazyScreen: React.FC<LazyScreenProps> = ({ loader, ...props }) => {
  const LazyComponent = reactLazy(loader);
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
});

export default LazyScreen;
