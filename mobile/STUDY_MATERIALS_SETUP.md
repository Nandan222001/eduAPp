# Study Materials and Doubt Forum Setup

## Required Package Installation

The required packages have been added to `package.json`. To install them, run:

```bash
cd mobile
npm install
```

Or if using Expo:

```bash
cd mobile
npx expo install
```

### Packages Added

- **expo-av** (~13.10.6) - For video and audio playback
- **react-native-pdf** (^6.7.5) - For PDF viewing
- **react-native-webview** (13.6.4) - For web content and online documents

Note: `expo-file-system`, `expo-sharing`, and `expo-image-picker` were already in the project.

## Features Implemented

### Study Materials Screen (`/mobile/src/screens/student/StudyMaterialsScreen.tsx`)

- **Hierarchical Navigation**: Browse materials by Subject → Chapter → Topic
- **Three Tabs**:
  - Browse: Navigate through hierarchical structure
  - Recent: View recently accessed materials
  - Bookmarks: Access bookmarked materials
- **Material Cards** with:
  - File type icons (PDF, Video, Audio, Document, etc.)
  - Preview information (file size, page count, duration)
  - Download button with progress tracking
  - Bookmark toggle
  - Offline availability indicators
  - View count and metadata
- **API Integration**:
  - `/api/v1/study-materials` - Get all materials
  - `/api/v1/study-materials/subjects` - Get subjects
  - `/api/v1/study-materials/subjects/{id}/chapters` - Get chapters
  - `/api/v1/study-materials/chapters/{id}/topics` - Get topics
  - `/api/v1/study-materials/topic/{id}` - Get materials by topic
  - `/api/v1/study-materials/bookmarks` - Get/manage bookmarks
  - `/api/v1/study-materials/recent` - Get recently viewed materials
  - `/api/v1/study-materials/{id}/download` - Download material

### Doubt Forum Screen (`/mobile/src/screens/student/DoubtForumScreen.tsx`)

- **Question Feed** with:
  - Search functionality
  - Filter by status (all, open, answered, resolved)
  - Sort and filter options
  - Upvote system
  - Status badges (open, answered, resolved, closed)
  - Priority indicators (low, medium, high)
  - View count and answer count
- **Post Composer**:
  - Rich text input for doubt description
  - Subject/Chapter selector
  - Priority selection
  - Tags support
  - Image upload for diagrams (using expo-image-picker)
  - Attachment preview
- **Doubt Detail View**:
  - Full doubt description
  - Answers list with upvote buttons
  - Accept answer functionality (for doubt author)
  - Role badges for answerers (teacher, student, admin)
  - Timestamp information
- **API Integration**:
  - `/api/v1/doubts` - Get doubts with filters
  - `/api/v1/doubts/{doubtId}` - Get doubt details
  - `/api/v1/doubts` (POST) - Create new doubt
  - `/api/v1/doubts/{doubtId}/answers` - Get/post answers
  - `/api/v1/doubts/{doubtId}/upvote` - Upvote doubt
  - `/api/v1/doubts/answers/{answerId}/upvote` - Upvote answer
  - `/api/v1/doubts/answers/{answerId}/accept` - Accept answer

### Material Viewer Screen (`/mobile/src/screens/student/MaterialViewerScreen.tsx`)

- **PDF Renderer**: Using `react-native-pdf`
  - Page navigation
  - Page counter display
  - Pinch to zoom support (built-in)
- **Video Player**: Using `expo-av`
  - Native controls
  - Full screen support
  - Playback controls
- **Audio Player**: Using `expo-av`
  - Play/pause controls
  - Duration display
  - Custom UI
- **WebView Support**: For links and online documents
- **File Type Support**:
  - PDF documents
  - Video files (MP4, etc.)
  - Audio files (MP3, WAV, etc.)
  - Web links
  - Google Docs/Drive files (via WebView)
  - Fallback for unsupported types

## Navigation Setup

The screens need to be added to your navigation configuration. Update your navigator to include:

```typescript
<Stack.Screen 
  name="StudyMaterials" 
  component={StudyMaterialsScreen}
  options={{ title: 'Study Materials' }}
/>
<Stack.Screen 
  name="MaterialViewer" 
  component={MaterialViewerScreen}
  options={{ title: 'View Material', headerShown: false }}
/>
<Stack.Screen 
  name="DoubtForum" 
  component={DoubtForumScreen}
  options={{ title: 'Doubt Forum' }}
/>
```

## Offline Support

The Study Materials screen includes offline availability indicators. To fully implement offline functionality:

1. Download files to local storage using `expo-file-system`
2. Store download metadata in AsyncStorage or SQLite
3. Check file existence before attempting download
4. Display offline indicator when file is available locally
5. Implement background sync for bookmarks and view history

## Permissions Required

Add the following permissions to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-media-library",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos for uploading diagrams.",
          "savePhotosPermission": "Allow $(PRODUCT_NAME) to save materials to your photo library."
        }
      ]
    ]
  }
}
```

## API Types

All necessary TypeScript types have been added to:
- `/mobile/src/types/studyMaterials.ts` - Subject, Chapter, Topic interfaces
- `/mobile/src/types/doubts.ts` - Already existed
- `/mobile/src/api/studyMaterials.ts` - Updated with new endpoints
- `/mobile/src/api/doubts.ts` - Already existed

## Usage Notes

1. **File Downloads**: Files are downloaded to the app's document directory using `expo-file-system`
2. **Image Uploads**: Uses `expo-image-picker` for selecting diagrams in doubt posts
3. **React Query**: All data fetching uses React Query for caching and optimistic updates
4. **Error Handling**: Comprehensive error handling with user-friendly alerts
5. **Responsive Design**: Adapts to different screen sizes
6. **Accessibility**: Includes proper touch targets and semantic information
