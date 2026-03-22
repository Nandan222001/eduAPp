import { Platform } from 'react-native';

// Lazy load FileSystem only on native platforms
let FileSystem: any = null;
let MATERIALS_DIR = '';

if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
  MATERIALS_DIR = `${FileSystem.documentDirectory}materials/`;
}

export { MATERIALS_DIR };

export const fileManager = {
  async ensureDirectoryExists(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    const dirInfo = await FileSystem.getInfoAsync(MATERIALS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MATERIALS_DIR, { intermediates: true });
    }
  },

  async downloadFile(url: string, filename: string, onProgress?: (progress: number) => void): Promise<string> {
    if (Platform.OS === 'web') {
      // On web, just return the URL - browser will handle download
      window.open(url, '_blank');
      return url;
    }

    await this.ensureDirectoryExists();
    
    const localPath = `${MATERIALS_DIR}${filename}`;
    
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localPath,
      {},
      (downloadProgress: any) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (onProgress) {
          onProgress(progress);
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    
    if (!result || !result.uri) {
      throw new Error('Download failed');
    }

    return result.uri;
  },

  async deleteFile(filePath: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
  },

  async isFileDownloaded(filename: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    const localPath = `${MATERIALS_DIR}${filename}`;
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    return fileInfo.exists;
  },

  async getFileInfo(filePath: string): Promise<any> {
    if (Platform.OS === 'web') {
      return { exists: false };
    }

    return await FileSystem.getInfoAsync(filePath);
  },

  async getAllDownloadedFiles(): Promise<string[]> {
    if (Platform.OS === 'web') {
      return [];
    }

    await this.ensureDirectoryExists();
    
    const dirInfo = await FileSystem.getInfoAsync(MATERIALS_DIR);
    if (!dirInfo.exists || !dirInfo.isDirectory) {
      return [];
    }

    return await FileSystem.readDirectoryAsync(MATERIALS_DIR);
  },

  async clearAllDownloads(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    const dirInfo = await FileSystem.getInfoAsync(MATERIALS_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(MATERIALS_DIR, { idempotent: true });
      await this.ensureDirectoryExists();
    }
  },

  getLocalPath(filename: string): string {
    if (Platform.OS === 'web') {
      return '';
    }
    return `${MATERIALS_DIR}${filename}`;
  },
};
