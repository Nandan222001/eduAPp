// Native implementation for biometric authentication
import * as LocalAuthentication from 'expo-local-authentication';

export const biometricsService = {
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async authenticate(reason?: string): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason || 'Authenticate to continue',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });
    return result.success;
  },

  async getSupportedTypes(): Promise<string[]> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'face';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'iris';
        default:
          return 'unknown';
      }
    });
  },
};

export default biometricsService;
