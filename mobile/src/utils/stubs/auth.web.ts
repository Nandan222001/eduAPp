// Web stub for expo-local-authentication
export const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3,
};

export const hasHardwareAsync = async () => false;
export const isEnrolledAsync = async () => false;
export const authenticateAsync = async () => ({ success: false });
export const supportedAuthenticationTypesAsync = async () => [];

export default {
  AuthenticationType,
  hasHardwareAsync,
  isEnrolledAsync,
  authenticateAsync,
  supportedAuthenticationTypesAsync,
};
