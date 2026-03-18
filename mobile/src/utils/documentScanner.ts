import { Camera } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface ScannedDocument {
  uri: string;
  width: number;
  height: number;
  pages: DocumentPage[];
  createdAt: Date;
}

export interface DocumentPage {
  uri: string;
  pageNumber: number;
  width: number;
  height: number;
  timestamp: Date;
}

export interface ScanOptions {
  quality?: number;
  enhanceContrast?: boolean;
  autoRotate?: boolean;
  multiPage?: boolean;
}

export const documentScanner = {
  async scanDocument(
    cameraRef: React.RefObject<Camera>,
    options: ScanOptions = {}
  ): Promise<DocumentPage | null> {
    try {
      if (!cameraRef.current) {
        throw new Error('Camera reference not available');
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: options.quality || 0.9,
        skipProcessing: false,
      });

      let processedUri = photo.uri;

      if (options.enhanceContrast !== false) {
        processedUri = await this.enhanceDocument(photo.uri);
      }

      if (options.autoRotate) {
        processedUri = await this.autoRotateDocument(processedUri);
      }

      return {
        uri: processedUri,
        pageNumber: 1,
        width: photo.width,
        height: photo.height,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error scanning document:', error);
      Alert.alert('Error', 'Failed to scan document');
      return null;
    }
  },

  async enhanceDocument(uri: string): Promise<string> {
    try {
      const enhanced = await manipulateAsync(uri, [{ resize: { width: 1600 } }], {
        compress: 0.95,
        format: SaveFormat.JPEG,
      });

      return enhanced.uri;
    } catch (error) {
      console.error('Error enhancing document:', error);
      return uri;
    }
  },

  async autoRotateDocument(uri: string): Promise<string> {
    return uri;
  },

  async convertToPDF(pages: DocumentPage[]): Promise<string> {
    try {
      const pdfDir = `${FileSystem.documentDirectory}scanned_documents/`;
      await FileSystem.makeDirectoryAsync(pdfDir, { intermediates: true });

      const pdfPath = `${pdfDir}document_${Date.now()}.pdf`;

      return pdfPath;
    } catch (error) {
      console.error('Error converting to PDF:', error);
      throw error;
    }
  },

  async scanMultiplePages(
    cameraRef: React.RefObject<Camera>,
    options: ScanOptions = {}
  ): Promise<ScannedDocument | null> {
    try {
      const pages: DocumentPage[] = [];
      const firstPage = await this.scanDocument(cameraRef, options);

      if (!firstPage) {
        return null;
      }

      pages.push(firstPage);

      return {
        uri: firstPage.uri,
        width: firstPage.width,
        height: firstPage.height,
        pages,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error scanning multiple pages:', error);
      return null;
    }
  },

  async cropToDocument(uri: string, corners?: { x: number; y: number }[]): Promise<string> {
    try {
      if (!corners || corners.length !== 4) {
        return uri;
      }

      const result = await manipulateAsync(uri, [], { compress: 0.9, format: SaveFormat.JPEG });

      return result.uri;
    } catch (error) {
      console.error('Error cropping document:', error);
      return uri;
    }
  },

  async applyFilter(uri: string, filter: 'grayscale' | 'blackwhite' | 'color'): Promise<string> {
    try {
      const result = await manipulateAsync(uri, [], { compress: 0.9, format: SaveFormat.JPEG });

      return result.uri;
    } catch (error) {
      console.error('Error applying filter:', error);
      return uri;
    }
  },

  async saveScan(document: ScannedDocument, name: string): Promise<string> {
    try {
      const saveDir = `${FileSystem.documentDirectory}documents/`;
      await FileSystem.makeDirectoryAsync(saveDir, { intermediates: true });

      const savePath = `${saveDir}${name}_${Date.now()}.jpg`;
      await FileSystem.copyAsync({
        from: document.uri,
        to: savePath,
      });

      return savePath;
    } catch (error) {
      console.error('Error saving scan:', error);
      throw error;
    }
  },

  async deleteScan(uri: string): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Error deleting scan:', error);
    }
  },
};
