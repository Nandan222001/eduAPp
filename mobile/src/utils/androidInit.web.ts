/**
 * Android Platform Initialization - Web Stub
 * 
 * This module provides web-compatible stubs for Android-specific initialization.
 * All Android features are no-ops on web platform.
 */

export const initializeAndroidPlatform = async (): Promise<void> => {
  // No-op on web
  console.log('[Android Web] Skipping Android-specific initialization on web platform');
};

export const handleAndroidDeepLink = (_url: string): void => {
  // No-op on web
};

export const configureAndroidUI = (): void => {
  // No-op on web
};

export const checkAndroidCompatibility = async (): Promise<boolean> => {
  // Always compatible on web
  return true;
};
