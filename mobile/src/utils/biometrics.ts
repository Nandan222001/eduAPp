import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';

// Lazy load LocalAuthentication only on native platforms
let LocalAuthentication: any = null;
if (Platform.OS !== 'web') {
  LocalAuthentication = require('expo-local-authentication');
}

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

export interface BiometricAvailability {
  isAvailable: boolean;
  biometricType: string;
  hasHardware: boolean;
  isEnrolled: boolean;
}

export const biometricsService = {
  async checkAvailability(): Promise<BiometricAvailability> {
    // Biometrics not available on web
    if (Platform.OS === 'web') {
      return {
        isAvailable: false,
        biometricType: 'None',
        hasHardware: false,
        isEnrolled: false,
      };
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType = 'None';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'Iris';
    }

    return {
      isAvailable: hasHardware && isEnrolled,
      biometricType,
      hasHardware,
      isEnrolled,
    };
  },

  async authenticate(reason?: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const availability = await this.checkAvailability();

      if (!availability.isAvailable) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Passcode',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  },

  async isEnabled(): Promise<boolean> {
    try {
      const enabled = await secureStorage.getBiometricEnabled();
      return enabled;
    } catch (error) {
      return false;
    }
  },

  async setEnabled(enabled: boolean): Promise<void> {
    try {
      await secureStorage.setBiometricEnabled(enabled);
    } catch (error) {
      console.error('Error setting biometric preference:', error);
      throw error;
    }
  },

  async authenticateForLogin(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    const isEnabled = await this.isEnabled();

    if (!isEnabled) {
      return false;
    }

    const availability = await this.checkAvailability();
    if (!availability.isAvailable) {
      return false;
    }

    return this.authenticate(`Use ${availability.biometricType} to sign in to EDU Mobile`);
  },

  async getSupportedAuthenticationTypes(): Promise<any[]> {
    if (Platform.OS === 'web') {
      return [];
    }
    return LocalAuthentication.supportedAuthenticationTypesAsync();
  },

  getAuthenticationTypeName(type: any): string {
    if (Platform.OS === 'web') {
      return 'Not Available';
    }

    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris';
      default:
        return 'Unknown';
    }
  },

  async canAuthenticateWithBiometrics(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    const availability = await this.checkAvailability();
    return availability.isAvailable;
  },
};
