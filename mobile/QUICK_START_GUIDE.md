# Quick Start Guide: Study Materials & Doubt Forum

## Installation

```bash
cd mobile
npm install
```

## Usage Examples

### Navigating to Study Materials
```typescript
import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation();
  
  // Navigate to Study Materials
  const openStudyMaterials = () => {
    navigation.navigate('StudyMaterials');
  };
  
  return (
    <Button title="Study Materials" onPress={openStudyMaterials} />
  );
};
```

### Navigating to Doubt Forum
```typescript
// Navigate to Doubt Forum
const openDoubtForum = () => {
  navigation.navigate('DoubtForum');
};
```

### Opening Material Viewer
```typescript
// Open specific material
const viewMaterial = (materialId: number) => {
  navigation.navigate('MaterialViewer', { materialId });
};
```

## Component Props

### StudyMaterialsScreen
```typescript
type Props = MainStackScreenProps<'StudyMaterials'>;
// No parameters required
```

### DoubtForumScreen
```typescript
type Props = MainStackScreenProps<'DoubtForum'>;
// No parameters required
```

### MaterialViewerScreen
```typescript
type Props = MainStackScreenProps<'MaterialViewer'> & {
  route: {
    params: {
      materialId: number;  // Required: ID of material to view
    };
  };
};
```

## Key Features

### Study Materials
- **Browse**: Subject → Chapter → Topic → Materials
- **Recent**: Last 10 accessed materials
- **Bookmarks**: Saved materials for quick access
- **Download**: Save materials for offline viewing
- **View**: Open materials in viewer

### Doubt Forum
- **Post**: Create new doubts with images
- **Answer**: Respond to doubts
- **Upvote**: Support helpful content
- **Accept**: Mark correct answers
- **Search**: Find specific doubts
- **Filter**: By status (open/answered/resolved)

### Material Viewer
- **PDF**: Page navigation, zoom
- **Video**: Play, pause, seek, fullscreen
- **Audio**: Play, pause, duration
- **Web**: Online documents and links

## API Requirements

Ensure your backend implements these endpoints:

### Study Materials
```
GET    /api/v1/study-materials/subjects
GET    /api/v1/study-materials/subjects/:id/chapters
GET    /api/v1/study-materials/chapters/:id/topics
GET    /api/v1/study-materials/topic/:id
GET    /api/v1/study-materials/:id
GET    /api/v1/study-materials/:id/download
GET    /api/v1/study-materials/bookmarks
POST   /api/v1/study-materials/:id/bookmark
DELETE /api/v1/study-materials/:id/bookmark
GET    /api/v1/study-materials/recent
POST   /api/v1/study-materials/:id/view
```

### Doubts
```
GET    /api/v1/doubts
GET    /api/v1/doubts/:id
POST   /api/v1/doubts
GET    /api/v1/doubts/:id/answers
POST   /api/v1/doubts/:id/answers
POST   /api/v1/doubts/:id/upvote
DELETE /api/v1/doubts/:id/upvote
POST   /api/v1/doubts/answers/:id/upvote
DELETE /api/v1/doubts/answers/:id/upvote
POST   /api/v1/doubts/answers/:id/accept
```

## Permissions

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-media-library",
        {
          "photosPermission": "Allow access to upload diagrams to doubts"
        }
      ]
    ]
  }
}
```

## Common Issues

### PDF Not Loading
- Verify file URL is accessible
- Check network connectivity
- Ensure CORS headers on server

### Video Not Playing
- Verify video format (MP4 recommended)
- Check file URL accessibility
- Ensure proper video encoding

### Upload Failing
- Check file size limits
- Verify multipart/form-data support
- Check network timeout settings

### Navigation Error
- Ensure screens are registered in navigator
- Verify navigation types in `navigation.ts`
- Check parameter types match

## Customization

### Styling
All styles use constants from `@constants`:
```typescript
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants';
```

### File Type Icons
Customize in `StudyMaterialsScreen.tsx`:
```typescript
const FILE_TYPE_ICONS = {
  pdf: { name: 'file-pdf', type: 'font-awesome-5', color: '#DC2626' },
  video: { name: 'video', type: 'feather', color: '#7C3AED' },
  // Add more types...
};
```

### API Endpoints
Modify in `src/api/studyMaterials.ts` and `src/api/doubts.ts`

## Performance Tips

1. **Pagination**: Implement for large material lists
2. **Image Optimization**: Use compressed images for attachments
3. **Lazy Loading**: Already implemented with React Query
4. **Cache Management**: Clear old downloads periodically
5. **Network Efficiency**: Use WiFi for large downloads

## Support

For issues or questions:
1. Check IMPLEMENTATION_SUMMARY.md for detailed info
2. Check STUDY_MATERIALS_SETUP.md for setup help
3. Verify API endpoints are working
4. Check console logs for errors
