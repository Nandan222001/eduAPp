# Advanced Mobile Features Documentation

This document provides comprehensive information about the advanced mobile features implemented in the EDU Mobile application.

## Table of Contents

1. [Biometric Authentication](#biometric-authentication)
2. [Enhanced Camera Integration](#enhanced-camera-integration)
3. [Document Scanner](#document-scanner)
4. [File Download Manager](#file-download-manager)
5. [Image Viewer](#image-viewer)
6. [QR Code Scanner](#qr-code-scanner)
7. [Sharing Functionality](#sharing-functionality)

---

## Biometric Authentication

### Overview
Secure authentication using Face ID/Touch ID for iOS and fingerprint/face recognition for Android.

### Features
- Automatic detection of available biometric hardware
- Support for Face ID, Touch ID, and fingerprint sensors
- Secure credential storage
- Easy toggle in ProfileScreen

### Usage

```typescript
import { biometricsService } from '@utils';

// Check availability
const availability = await biometricsService.checkAvailability();
console.log(availability.biometricType); // "Face ID", "Touch ID", etc.

// Authenticate user
const authenticated = await biometricsService.authenticate('Sign in to EDU Mobile');

// Enable/disable biometric login
await biometricsService.setEnabled(true);
const isEnabled = await biometricsService.isEnabled();
```

### Configuration
In ProfileScreen, users can toggle biometric authentication under the Security section.

---

## Enhanced Camera Integration

### Overview
Professional camera features with auto-edge detection for assignment submissions.

### Features
- High-quality photo capture (adjustable quality)
- Auto-edge detection for documents
- Image processing and enhancement
- Compression and optimization

### Usage

```typescript
import { cameraService } from '@utils';
import { Camera } from 'expo-camera';

const cameraRef = useRef<Camera>(null);

// Capture photo with edge detection
const photo = await cameraService.capturePhoto(cameraRef, {
  quality: 0.8,
  base64: true,
  autoEdgeDetection: true,
});

// Process image
const processedUri = await cameraService.processImageWithEdgeDetection(photo.uri);

// Enhance document
const enhancedUri = await cameraService.enhanceDocument(imageUri);
```

### Implementation in AssignmentDetailScreen
The camera integration is demonstrated in `AssignmentDetailScreen` with auto-edge detection for assignment photos.

---

## Document Scanner

### Overview
Multi-page document scanning with real-time preview and enhancement.

### Features
- Multi-page scanning
- Real-time camera preview
- Document edge detection guidelines
- Image enhancement (contrast, brightness)
- Page management (add, remove, reorder)
- Flash/torch support

### Usage

```typescript
import { DocumentScanner } from '@components/shared';

<DocumentScanner
  visible={showScanner}
  onClose={() => setShowScanner(false)}
  onComplete={(pages) => {
    console.log('Scanned pages:', pages);
  }}
  multiPage={true}
  title="Scan Homework"
/>
```

### API

```typescript
import { documentScanner } from '@utils';

// Scan single page
const page = await documentScanner.scanDocument(cameraRef, {
  quality: 0.9,
  enhanceContrast: true,
  autoRotate: true,
});

// Scan multiple pages
const document = await documentScanner.scanMultiplePages(cameraRef);

// Convert to PDF
const pdfPath = await documentScanner.convertToPDF(pages);
```

---

## File Download Manager

### Overview
Robust file download system with progress tracking, pause/resume, and offline availability.

### Features
- Background downloads
- Progress tracking
- Pause/resume downloads
- Cancel downloads
- Offline file availability
- Download history
- File size formatting

### Usage

```typescript
import { fileDownloadManager } from '@utils';

// Initialize (done automatically in AppInitializer)
await fileDownloadManager.initialize();

// Start download
const localUri = await fileDownloadManager.startDownload(
  'https://example.com/file.pdf',
  {
    fileName: 'study-material.pdf',
    onProgress: (progress, downloaded, total) => {
      console.log(`Progress: ${progress}%`);
    },
    onComplete: (uri) => {
      console.log('Downloaded to:', uri);
    },
  }
);

// Pause/Resume
await fileDownloadManager.pauseDownload(taskId);
await fileDownloadManager.resumeDownload(taskId);

// Cancel
await fileDownloadManager.cancelDownload(taskId);

// Check offline availability
const isAvailable = await fileDownloadManager.isFileAvailableOffline(url);
const offlineUri = await fileDownloadManager.getOfflineFileUri(url);
```

### Component

```typescript
import { FileDownloadList } from '@components/shared';

<FileDownloadList
  onOpenFile={(uri) => {
    // Open file
  }}
/>
```

---

## Image Viewer

### Overview
Full-featured image viewer with pinch-to-zoom, pan, and save/share capabilities.

### Features
- Pinch-to-zoom (1x to 4x)
- Pan gesture support
- Double-tap to zoom
- Multi-image gallery
- Save to device
- Share functionality
- Image rotation
- Full-screen viewing

### Usage

```typescript
import { ImageViewer } from '@components/shared';

<ImageViewer
  visible={showViewer}
  images={imageUrls}
  initialIndex={0}
  onClose={() => setShowViewer(false)}
  onSave={(uri) => console.log('Saved:', uri)}
  showControls={true}
/>
```

### Gestures
- **Pinch**: Zoom in/out
- **Pan**: Move image (when zoomed)
- **Double-tap**: Toggle zoom (1x/2x)
- **Single-tap**: Toggle controls

---

## QR Code Scanner

### Overview
Fast and accurate QR code scanning for quick access features.

### Features
- Real-time QR code scanning
- Multiple barcode format support
- Vibration feedback
- Flash/torch control
- Scan history
- Auto-parse common formats (URLs, JSON)

### Usage

```typescript
import { QRScanner } from '@components/shared';

<QRScanner
  visible={showScanner}
  onClose={() => setShowScanner(false)}
  onScan={(data, type) => {
    console.log('Scanned:', data);
  }}
  title="Scan QR Code"
  showInstructions={true}
  vibrate={true}
/>
```

### Service API

```typescript
import { qrScannerService } from '@utils';

// Parse QR data
const parsed = qrScannerService.parseQRData(scanResult);
// Returns: { type: 'url' | 'assignment' | 'attendance' | 'text', data: any }

// Handle scan result
await qrScannerService.handleScanResult(scanResult, navigation);

// Generate QR data
const qrData = qrScannerService.generateQRData('assignment', {
  id: 123,
  title: 'Math Homework',
});
```

### Supported QR Types
- **URL**: Opens in browser
- **Assignment**: Navigates to assignment detail
- **Attendance**: Marks attendance
- **Student**: Shows student info
- **Text**: Displays as plain text

---

## Sharing Functionality

### Overview
Share grades, achievements, schedules, and documents via native share sheet.

### Features
- Share as text
- Share as PDF
- Multiple file sharing
- Grade reports (text and PDF)
- Achievement sharing
- Attendance reports
- Schedule sharing

### Usage

```typescript
import { sharingService } from '@utils';

// Share grades as text
await sharingService.shareGrades(grades, 'Student Name');

// Share grades as PDF
await sharingService.shareGradesAsPDF(grades, 'Student Name');

// Share achievement
await sharingService.shareAchievement(achievement);

// Share file
await sharingService.shareFile(fileUri, {
  mimeType: 'application/pdf',
  dialogTitle: 'Share Document',
});

// Share text
await sharingService.shareText('Hello World', {
  title: 'Share Message',
});

// Share URL
await sharingService.shareUrl('https://example.com', {
  message: 'Check this out!',
});
```

### Grade Sharing in GradesScreen
The GradesScreen includes share buttons in the header:
- **Share icon**: Shares grades as text
- **Download icon**: Shares grades as PDF

---

## Permissions

### Required Permissions

The app requires the following permissions for these features:

#### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access for photos and document scanning</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo library access to save images</string>
<key>NSFaceIDUsageDescription</key>
<string>Face ID for secure authentication</string>
```

#### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

These are automatically configured in `app.json` via Expo plugins.

---

## Installation

### Required Packages

```bash
# Install all required dependencies
npx expo install expo-local-authentication
npx expo install expo-barcode-scanner
npx expo install expo-file-system
npx expo install expo-image-manipulator
npx expo install expo-media-library
npx expo install expo-sharing
```

These packages are already included in `package.json`.

---

## Utilities Reference

### File Locations

- **Biometrics**: `/mobile/src/utils/biometrics.ts`
- **Camera**: `/mobile/src/utils/camera.ts`
- **Document Scanner**: `/mobile/src/utils/documentScanner.ts`
- **File Download Manager**: `/mobile/src/utils/fileDownloadManager.ts`
- **Image Viewer**: `/mobile/src/utils/imageViewer.ts`
- **QR Scanner**: `/mobile/src/utils/qrScanner.ts`
- **Sharing**: `/mobile/src/utils/sharing.ts`

### Components

- **ImageViewer**: `/mobile/src/components/shared/ImageViewer.tsx`
- **QRScanner**: `/mobile/src/components/shared/QRScanner.tsx`
- **DocumentScanner**: `/mobile/src/components/shared/DocumentScanner.tsx`
- **FileDownloadList**: `/mobile/src/components/shared/FileDownloadList.tsx`

---

## Examples

### Complete Assignment Submission Flow

```typescript
const AssignmentSubmission = () => {
  const [attachments, setAttachments] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  // Scan homework
  const handleScan = () => setShowScanner(true);
  
  const handleScanComplete = (pages) => {
    const newAttachments = pages.map(page => ({
      uri: page.uri,
      name: `page_${page.pageNumber}.jpg`,
      type: 'image/jpeg',
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  // View attachment
  const handleViewImage = (index) => {
    setSelectedIndex(index);
    setShowViewer(true);
  };

  return (
    <>
      <Button title="Scan Homework" onPress={handleScan} />
      
      {attachments.map((file, index) => (
        <TouchableOpacity key={index} onPress={() => handleViewImage(index)}>
          <Text>{file.name}</Text>
        </TouchableOpacity>
      ))}

      <DocumentScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onComplete={handleScanComplete}
        multiPage={true}
      />

      <ImageViewer
        visible={showViewer}
        images={attachments.map(a => a.uri)}
        onClose={() => setShowViewer(false)}
      />
    </>
  );
};
```

---

## Best Practices

1. **Permissions**: Always check and request permissions before using camera or media features
2. **Error Handling**: Implement try-catch blocks for all async operations
3. **User Feedback**: Show loading states and progress indicators
4. **Cleanup**: Clean up resources (camera refs, listeners) when components unmount
5. **Performance**: Compress images and optimize file sizes before uploading
6. **Security**: Use biometric authentication for sensitive operations
7. **Offline Support**: Leverage file download manager for offline availability

---

## Troubleshooting

### Common Issues

1. **Camera not working**: Check permissions in device settings
2. **Biometrics not available**: Ensure device has biometric hardware and it's set up
3. **Downloads failing**: Check network connectivity and storage permissions
4. **QR codes not scanning**: Ensure good lighting and steady hold

### Debug Mode

Enable debug logging in development:

```typescript
// In your App.tsx
if (__DEV__) {
  console.log('[Features] Advanced features initialized');
}
```

---

## Support

For issues or questions:
- Check the inline code documentation
- Review the example screens
- Consult Expo documentation for specific APIs

---

## Future Enhancements

Potential improvements:
- OCR text extraction from scanned documents
- Advanced image filters for document enhancement
- Batch QR code scanning
- Cloud backup for downloads
- Advanced biometric settings (timeout, retry limits)
