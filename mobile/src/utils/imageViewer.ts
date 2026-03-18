import { Dimensions } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export interface ImageViewerState {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
}

export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  name?: string;
}

export const imageViewerService = {
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  },

  async saveToGallery(uri: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return false;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      return false;
    }
  },

  async shareImage(uri: string): Promise<void> {
    try {
      const RN = require('react-native');
      await RN.Share.share({
        url: uri,
        message: 'Shared from EDU Mobile',
      });
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  },

  async rotateImage(uri: string, degrees: 90 | 180 | 270): Promise<string> {
    try {
      const result = await manipulateAsync(uri, [{ rotate: degrees }], {
        compress: 1,
        format: SaveFormat.PNG,
      });
      return result.uri;
    } catch (error) {
      console.error('Error rotating image:', error);
      throw error;
    }
  },

  async getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    try {
      const RN = require('react-native');
      return new Promise((resolve, reject) => {
        RN.Image.getSize(
          uri,
          (width: number, height: number) => resolve({ width, height }),
          (error: any) => reject(error)
        );
      });
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return { width: 0, height: 0 };
    }
  },

  calculateImageScale(
    imageWidth: number,
    imageHeight: number,
    containerWidth?: number,
    containerHeight?: number
  ): number {
    const screenWidth = containerWidth || Dimensions.get('window').width;
    const screenHeight = containerHeight || Dimensions.get('window').height;

    const widthScale = screenWidth / imageWidth;
    const heightScale = screenHeight / imageHeight;

    return Math.min(widthScale, heightScale);
  },

  async downloadImage(url: string, fileName?: string): Promise<string> {
    try {
      const downloadDir = `${FileSystem.documentDirectory}images/`;
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });

      const name = fileName || `image_${Date.now()}.jpg`;
      const localUri = `${downloadDir}${name}`;

      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      return downloadResult.uri;
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  },

  async getImageInfo(uri: string): Promise<FileSystem.FileInfo> {
    try {
      const info = await FileSystem.getInfoAsync(uri, { size: true });
      return info;
    } catch (error) {
      console.error('Error getting image info:', error);
      throw error;
    }
  },

  async cacheImage(url: string): Promise<string> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}images/`;
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

      const fileName = url.split('/').pop() || `cached_${Date.now()}.jpg`;
      const localUri = `${cacheDir}${fileName}`;

      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists) {
        return localUri;
      }

      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      return downloadResult.uri;
    } catch (error) {
      console.error('Error caching image:', error);
      return url;
    }
  },

  async clearImageCache(): Promise<void> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}images/`;
      const info = await FileSystem.getInfoAsync(cacheDir);
      if (info.exists) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
      }
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  },

  getInitialViewerState(): ImageViewerState {
    return {
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotation: 0,
    };
  },

  formatImageSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },
};
