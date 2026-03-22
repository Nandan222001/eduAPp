// Web stub for expo-camera
export const Camera = null;
export const CameraType = { back: 'back', front: 'front' };

export default {
  Camera,
  CameraType,
  requestCameraPermissionsAsync: async () => ({ status: 'denied' }),
  getCameraPermissionsAsync: async () => ({ status: 'denied' }),
};
