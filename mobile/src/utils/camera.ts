import { Alert, Platform } from 'react-native';

// Lazy load camera modules only on native platforms
let Camera: any = null;
let CameraType: any = null;
let FlashMode: any = null;
let manipulateAsync: any = null;
let SaveFormat: any = null;
let FileSystem: any = null;

if (Platform.OS !== 'web') {
  const cameraModule = require('expo-camera');
  Camera = cameraModule.Camera;
  CameraType = cameraModule.CameraType;
  FlashMode = cameraModule.FlashMode;
  
  const imageManipulator = require('expo-image-manipulator');
  manipulateAsync = imageManipulator.manipulateAsync;
  SaveFormat = imageManipulator.SaveFormat;
  
  FileSystem = require('expo-file-system');
}

export interface CameraPermissions {
  camera: boolean;
  microphone: boolean;
}

export interface PhotoOptions {
  quality?: number;
  base64?: boolean;
  skipProcessing?: boolean;
  autoEdgeDetection?: boolean;
}

export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: Record<string, any>;
}

export interface EdgeDetectionResult {
  uri: string;
  edges: Point[];
  original: string;
}

export interface Point {
  x: number;
  y: number;
}

const notAvailableOnWeb = (feature: string) => {
  Alert.alert('Not Available', `${feature} is not available on web platform`);
};

export const cameraService = {
  async requestPermissions(): Promise<CameraPermissions> {
    if (Platform.OS === 'web') {
      notAvailableOnWeb('Camera');
      return { camera: false, microphone: false };
    }

    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    const microphonePermission = await Camera.requestMicrophonePermissionsAsync();

    return {
      camera: cameraPermission.status === 'granted',
      microphone: microphonePermission.status === 'granted',
    };
  },

  async checkPermissions(): Promise<CameraPermissions> {
    if (Platform.OS === 'web') {
      return { camera: false, microphone: false };
    }

    const cameraPermission = await Camera.getCameraPermissionsAsync();
    const microphonePermission = await Camera.getMicrophonePermissionsAsync();

    return {
      camera: cameraPermission.status === 'granted',
      microphone: microphonePermission.status === 'granted',
    };
  },

  async ensureCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      notAvailableOnWeb('Camera');
      return false;
    }

    const permissions = await this.checkPermissions();

    if (!permissions.camera) {
      const newPermissions = await this.requestPermissions();
      if (!newPermissions.camera) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to use this feature. Please enable it in your device settings.'
        );
        return false;
      }
    }

    return true;
  },

  async capturePhoto(
    cameraRef: React.RefObject<any>,
    options: PhotoOptions = {}
  ): Promise<CapturedPhoto | null> {
    if (Platform.OS === 'web') {
      notAvailableOnWeb('Camera capture');
      return null;
    }

    try {
      if (!cameraRef.current) {
        throw new Error('Camera reference not available');
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: options.quality || 0.8,
        base64: options.base64 || false,
        skipProcessing: options.skipProcessing || false,
      });

      if (options.autoEdgeDetection && !options.skipProcessing) {
        const processed = await this.processImageWithEdgeDetection(photo.uri);
        return {
          ...photo,
          uri: processed.uri,
        };
      }

      return photo as CapturedPhoto;
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
      return null;
    }
  },

  async processImageWithEdgeDetection(uri: string): Promise<CapturedPhoto> {
    if (Platform.OS === 'web') {
      return { uri, width: 0, height: 0 };
    }

    try {
      const processed = await manipulateAsync(
        uri,
        [
          { resize: { width: 1200 } },
          {
            crop: {
              originX: 0,
              originY: 0,
              width: 1200,
              height: 1600,
            },
          },
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
          base64: false,
        }
      );

      const enhanced = await manipulateAsync(processed.uri, [], {
        compress: 0.9,
        format: SaveFormat.JPEG,
      });

      return enhanced as CapturedPhoto;
    } catch (error) {
      console.error('Error processing image:', error);
      return { uri, width: 0, height: 0 };
    }
  },

  async enhanceDocument(uri: string): Promise<string> {
    if (Platform.OS === 'web') {
      return uri;
    }

    try {
      const result = await manipulateAsync(uri, [{ resize: { width: 1200 } }], {
        compress: 0.9,
        format: SaveFormat.JPEG,
      });

      return result.uri;
    } catch (error) {
      console.error('Error enhancing document:', error);
      return uri;
    }
  },

  async detectEdges(imageUri: string): Promise<Point[]> {
    const corners: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    return corners;
  },

  async cropImage(
    uri: string,
    cropData: {
      originX: number;
      originY: number;
      width: number;
      height: number;
    }
  ): Promise<string> {
    if (Platform.OS === 'web') {
      return uri;
    }

    try {
      const result = await manipulateAsync(uri, [{ crop: cropData }], {
        compress: 0.9,
        format: SaveFormat.JPEG,
      });
      return result.uri;
    } catch (error) {
      console.error('Error cropping image:', error);
      throw error;
    }
  },

  async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    if (Platform.OS === 'web') {
      return uri;
    }

    try {
      const result = await manipulateAsync(uri, [], { compress: quality, format: SaveFormat.JPEG });
      return result.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  },

  async rotateImage(uri: string, degrees: number): Promise<string> {
    if (Platform.OS === 'web') {
      return uri;
    }

    try {
      const result = await manipulateAsync(uri, [{ rotate: degrees }], {
        compress: 0.9,
        format: SaveFormat.JPEG,
      });
      return result.uri;
    } catch (error) {
      console.error('Error rotating image:', error);
      throw error;
    }
  },

  async getImageInfo(uri: string): Promise<{ width: number; height: number; size: number }> {
    if (Platform.OS === 'web') {
      return { width: 0, height: 0, size: 0 };
    }

    try {
      const info = await FileSystem.getInfoAsync(uri, { size: true });

      return {
        width: 0,
        height: 0,
        size: info.exists && 'size' in info ? info.size : 0,
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      return { width: 0, height: 0, size: 0 };
    }
  },
};

export { CameraType, FlashMode };
