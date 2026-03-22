// Native implementation for document scanner
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export const documentScannerService = {
  async pickDocument(): Promise<any> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      return {
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        type: result.assets[0].mimeType,
        size: result.assets[0].size,
      };
    } catch (error) {
      console.error('Error picking document:', error);
      return null;
    }
  },

  async readFile(uri: string): Promise<string | null> {
    try {
      return await FileSystem.readAsStringAsync(uri);
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  },
};

export default documentScannerService;
