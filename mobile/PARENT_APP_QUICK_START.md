# Parent App - Quick Start Guide

## Overview
This guide provides quick access to the Parent mobile app implementation for developers.

## Quick Navigation

### Main Files
- **Dashboard**: `src/components/ParentDashboard.tsx`
- **Attendance**: `src/screens/parent/AttendanceMonitorScreen.tsx`
- **Grades**: `src/screens/parent/GradesMonitorScreen.tsx`
- **Communication**: `src/screens/parent/CommunicationScreen.tsx`

### State Management
- **Redux Slice**: `src/store/slices/parentSlice.ts`
- **API Client**: `src/api/parentApi.ts`
- **Types**: `src/types/parent.ts`

### Navigation
- **Navigator**: `src/navigation/ParentNavigator.tsx`
- **Types**: `src/types/navigation.ts` (ParentStackParamList)

## How to Use

### 1. Access Parent Dashboard
The ParentDashboard is the main entry point for parents. It's automatically displayed when a parent user logs in.

```typescript
// In your navigation, the parent sees:
ParentDashboard (Tab) -> ParentDashboardScreen -> ParentDashboard Component
```

### 2. Data Flow

```typescript
// 1. Component dispatches action
dispatch(fetchChildren())

// 2. Redux thunk calls API
parentApi.getChildren()

// 3. API returns data
// 4. Redux updates state
// 5. Component re-renders with new data
```

### 3. Navigate to Detail Screens

```typescript
// From ParentDashboard
navigation.navigate('AttendanceMonitor', { childId: selectedChild.id })
navigation.navigate('GradesMonitor', { childId: selectedChild.id })
navigation.navigate('Communication')
```

## Key Components

### ParentDashboard
Main dashboard showing overview of selected child.

**Props**:
```typescript
interface ParentDashboardProps {
  navigation: any; // Navigation object
}
```

**Key Features**:
- Child selector
- Stats cards
- Attendance status
- Recent grades
- Pending assignments
- Fee status
- Communication button

### AttendanceMonitorScreen
Detailed attendance tracking.

**Route Params**:
```typescript
{ childId: number }
```

**Key Features**:
- Calendar heatmap
- Attendance gauge
- Subject breakdown

### GradesMonitorScreen
Comprehensive grades monitoring.

**Route Params**:
```typescript
{ childId: number }
```

**Key Features**:
- Exam results
- Term filter
- Bar charts
- Performance trends

### CommunicationScreen
Messages and announcements.

**Key Features**:
- Messages tab
- Announcements tab
- Read/unread status
- Priority indicators

## Redux State Structure

```typescript
state.parent = {
  children: Child[],
  selectedChildId: number | null,
  childStats: { [childId]: ChildStats },
  todayAttendance: { [childId]: TodayAttendance },
  recentGrades: { [childId]: Grade[] },
  pendingAssignments: { [childId]: Assignment[] },
  feePayments: { [childId]: FeePayment[] },
  messages: TeacherMessage[],
  announcements: Announcement[],
  attendanceCalendar: { [childId]: AttendanceCalendar },
  subjectAttendance: { [childId]: SubjectAttendance[] },
  examResults: { [childId]: ExamResult[] },
  subjectPerformance: { [childId]: SubjectPerformance[] },
  isLoading: boolean,
  error: string | null
}
```

## Common Operations

### Select a Child
```typescript
import { setSelectedChild } from '../store/slices/parentSlice';

dispatch(setSelectedChild(childId));
```

### Load Child Data
```typescript
import { 
  fetchChildStats, 
  fetchTodayAttendance, 
  fetchRecentGrades 
} from '../store/slices/parentSlice';

// Load all data for a child
await Promise.all([
  dispatch(fetchChildStats(childId)),
  dispatch(fetchTodayAttendance(childId)),
  dispatch(fetchRecentGrades(childId))
]);
```

### Mark Message as Read
```typescript
import { markMessageAsRead } from '../store/slices/parentSlice';

dispatch(markMessageAsRead(messageId));
```

### Load Attendance Calendar
```typescript
import { fetchAttendanceCalendar } from '../store/slices/parentSlice';

dispatch(fetchAttendanceCalendar({ 
  childId, 
  year: 2024, 
  month: 1 
}));
```

## API Response Formats

### Children List
```typescript
GET /api/v1/parent/children

Response: Child[]
[
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    photo_url: "https://...",
    grade: "Grade 10",
    class_name: "Class A",
    student_id: "ST12345"
  }
]
```

### Child Stats
```typescript
GET /api/v1/parent/children/:id/stats

Response: ChildStats
{
  attendance_percentage: 85.5,
  rank: 5,
  average_score: 87.3,
  total_subjects: 8
}
```

### Today's Attendance
```typescript
GET /api/v1/parent/children/:id/attendance/today

Response: TodayAttendance
{
  child_id: 1,
  date: "2024-01-15",
  status: "present", // or "absent", "late", "excused"
  marked_at: "2024-01-15T08:30:00Z",
  marked_by: "Teacher Name"
}
```

## Styling

### Color Palette
```typescript
const colors = {
  primary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  white: '#FFFFFF'
};
```

### Common Styles
```typescript
// Card
{
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2
}

// Section
{
  padding: 16
}

// Title
{
  fontSize: 20,
  fontWeight: 'bold',
  color: '#1C1C1E'
}
```

## Testing

### Unit Test Example
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { ParentDashboard } from '../components/ParentDashboard';

test('renders child selector', () => {
  const { getByText } = render(<ParentDashboard navigation={mockNavigation} />);
  expect(getByText('Select Child:')).toBeTruthy();
});
```

### Redux Test Example
```typescript
import parentReducer, { setSelectedChild } from '../store/slices/parentSlice';

test('sets selected child', () => {
  const state = parentReducer(initialState, setSelectedChild(1));
  expect(state.selectedChildId).toBe(1);
});
```

## Troubleshooting

### Issue: Data not loading
**Solution**: Check API endpoints and authentication token

### Issue: Navigation not working
**Solution**: Verify screen names match in ParentNavigator

### Issue: State not persisting
**Solution**: Check Redux Persist configuration

### Issue: Images not displaying
**Solution**: Verify photo_url format and network connectivity

## Performance Tips

1. **Memoize expensive calculations**
```typescript
const stats = useMemo(() => calculateStats(data), [data]);
```

2. **Use proper keys in lists**
```typescript
{items.map((item) => <Item key={item.id} {...item} />)}
```

3. **Debounce rapid actions**
```typescript
const debouncedRefresh = debounce(handleRefresh, 500);
```

4. **Lazy load images**
```typescript
<Image source={{ uri: url }} loadingIndicatorSource={placeholder} />
```

## Resources

- **Full Documentation**: See `PARENT_APP_README.md`
- **File List**: See `PARENT_APP_FILES.md`
- **Implementation Summary**: See `PARENT_APP_IMPLEMENTATION_SUMMARY.md`
- **Type Definitions**: See `src/types/parent.ts`
- **API Client**: See `src/api/parentApi.ts`

## Support

For questions or issues:
1. Check the full documentation files
2. Review type definitions for data structures
3. Inspect Redux DevTools for state issues
4. Check console logs for API errors
5. Verify navigation stack in React Navigation DevTools

## Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Type check
npm run type-check

# Lint
npm run lint
```

## Environment Variables

Ensure `.env` file has:
```
API_BASE_URL=http://your-api-url
API_VERSION=v1
```

## Ready to Code!

You're all set! The Parent app is fully implemented and ready for:
- Backend integration
- Testing
- Further customization
- Production deployment

Happy coding! 🚀
