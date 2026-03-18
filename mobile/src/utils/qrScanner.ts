import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { Alert } from 'react-native';

export interface QRScanResult {
  data: string;
  type: string;
  bounds?: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  cornerPoints?: { x: number; y: number }[];
}

export interface ParsedQRData {
  type: 'url' | 'text' | 'assignment' | 'attendance' | 'student' | 'unknown';
  data: any;
  raw: string;
}

export const qrScannerService = {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  },

  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await BarCodeScanner.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  },

  async ensurePermissions(): Promise<boolean> {
    const hasPermission = await this.checkPermissions();

    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to scan QR codes. Please enable it in your device settings.'
        );
        return false;
      }
    }

    return true;
  },

  parseQRData(scanResult: BarCodeScannerResult): ParsedQRData {
    const { data, type } = scanResult;

    if (this.isURL(data)) {
      return {
        type: 'url',
        data: { url: data },
        raw: data,
      };
    }

    try {
      const jsonData = JSON.parse(data);

      if (jsonData.type === 'assignment' && jsonData.id) {
        return {
          type: 'assignment',
          data: jsonData,
          raw: data,
        };
      }

      if (jsonData.type === 'attendance' && jsonData.classId) {
        return {
          type: 'attendance',
          data: jsonData,
          raw: data,
        };
      }

      if (jsonData.type === 'student' && jsonData.studentId) {
        return {
          type: 'student',
          data: jsonData,
          raw: data,
        };
      }
    } catch (e) {}

    return {
      type: 'text',
      data: { text: data },
      raw: data,
    };
  },

  isURL(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  },

  async handleScanResult(scanResult: BarCodeScannerResult, navigation: any): Promise<void> {
    const parsed = this.parseQRData(scanResult);

    switch (parsed.type) {
      case 'url':
        Alert.alert('Open URL', `Do you want to open ${parsed.data.url}?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: async () => {
              const RN = require('react-native');
              const supported = await RN.Linking.canOpenURL(parsed.data.url);
              if (supported) {
                await RN.Linking.openURL(parsed.data.url);
              }
            },
          },
        ]);
        break;

      case 'assignment':
        navigation.navigate('AssignmentDetail', { assignmentId: parsed.data.id });
        break;

      case 'attendance':
        Alert.alert('Attendance', `Marking attendance for class ${parsed.data.classId}`);
        break;

      case 'student':
        Alert.alert('Student Info', `Student ID: ${parsed.data.studentId}`);
        break;

      default:
        Alert.alert('QR Code', parsed.raw);
        break;
    }
  },

  generateQRData(type: 'assignment' | 'attendance' | 'student', data: any): string {
    return JSON.stringify({
      type,
      ...data,
      timestamp: new Date().toISOString(),
    });
  },

  getSupportedBarcodeTypes(): string[] {
    return [
      BarCodeScanner.Constants.BarCodeType.qr,
      BarCodeScanner.Constants.BarCodeType.pdf417,
      BarCodeScanner.Constants.BarCodeType.aztec,
      BarCodeScanner.Constants.BarCodeType.code128,
      BarCodeScanner.Constants.BarCodeType.code39,
      BarCodeScanner.Constants.BarCodeType.code93,
      BarCodeScanner.Constants.BarCodeType.ean13,
      BarCodeScanner.Constants.BarCodeType.ean8,
      BarCodeScanner.Constants.BarCodeType.upc_e,
    ];
  },

  validateQRData(data: string): boolean {
    if (!data || data.trim() === '') {
      return false;
    }

    try {
      JSON.parse(data);
      return true;
    } catch {
      return this.isURL(data) || data.length > 0;
    }
  },
};
