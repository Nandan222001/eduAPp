import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

export interface BiometricAvailability {
  isAvailable: boolean;
  biometricType: string;
  hasHardware: boolean;
  isEnrolled: boolean;
}

export const biometricsService = {
  async checkAvailability(): Promise<BiometricAvailability> {
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
      const enabled = await secureStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  },

  async setEnabled(enabled: boolean): Promise<void> {
    try {
      await secureStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch (error) {
      console.error('Error setting biometric preference:', error);
      throw error;
    }
  },

  async authenticateForLogin(): Promise<boolean> {
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

  async getSupportedAuthenticationTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return LocalAuthentication.supportedAuthenticationTypesAsync();
  },

  getAuthenticationTypeName(type: LocalAuthentication.AuthenticationType): string {
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
    const availability = await this.checkAvailability();
    return availability.isAvailable;
  },
};
