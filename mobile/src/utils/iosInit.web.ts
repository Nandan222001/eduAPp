/**
 * iOS Platform Initialization - Web Stub
 * 
 * This module provides web-compatible stubs for iOS-specific initialization.
 * All iOS features are no-ops on web platform.
 */

export const initializeIOSPlatform = async (): Promise<void> => {
  // No-op on web
  console.log('[iOS Web] Skipping iOS-specific initialization on web platform');
};

export const handleIOSDeepLink = (_url: string): void => {
  // No-op on web
};

export const configureIOSUI = (): void => {
  // No-op on web
};

export const checkIOSCompatibility = async (): Promise<boolean> => {
  // Always compatible on web
  return true;
};
