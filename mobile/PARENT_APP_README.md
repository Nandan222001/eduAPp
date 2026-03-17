# Parent Mobile App - Multi-Child Management

This document describes the implementation of the Parent mobile app with multi-child management features.

## Features Implemented

### 1. ParentDashboard Component (`src/components/ParentDashboard.tsx`)
A comprehensive dashboard for parents to monitor their children's academic progress.

**Features:**
- **Child Selector Dropdown**: Switch between multiple children easily
- **Child Overview Cards**: Display child photo (or initials placeholder) and basic info
- **Stats Display**: 
  - Attendance percentage
  - Class rank
  - Average score
- **Today's Attendance**: Shows current day attendance status with alert badge for absences
- **Recent Grades**: Last 3 grades with subject, exam, marks, and percentage
- **Pending Assignments**: Up to 3 pending/overdue assignments
- **Fee Payment Status**: View payment status with color-coded badges
- **Teacher Communication Preview**: Quick access to communication screen

### 2. AttendanceMonitorScreen (`src/screens/parent/AttendanceMonitorScreen.tsx`)
Detailed attendance tracking and visualization.

**Features:**
- **Monthly Calendar Heatmap**: Visual representation of attendance for the selected month
  - Color coding: Green (Present), Red (Absent), Orange (Late), Blue (Excused)
- **Attendance Percentage Gauge**: Overall attendance percentage with color-based status
- **Subject-wise Breakdown**: Attendance percentage for each subject with progress bars
- **Calendar Legend**: Clear legend explaining color codes

**Note**: Currently uses custom calendar implementation. To use `react-native-calendars`:
```bash
npm install react-native-calendars
```
Then replace the custom calendar grid with the Calendar component from the library.

### 3. GradesMonitorScreen (`src/screens/parent/GradesMonitorScreen.tsx`)
Comprehensive grades monitoring with visual analytics.

**Features:**
- **Term Filter**: Filter exam results by academic term
- **Exam Results by Term**: View detailed results for each exam
- **Subject Performance Cards**: Track performance trends per subject
  - Average, highest, and lowest scores
  - Performance trend indicators (📈 improving, 📉 declining, ➡️ stable)
- **Grade Comparison Charts**: Custom bar charts showing subject-wise performance
- **Color-coded Grades**: Visual feedback based on percentage achieved

**Note**: Currently uses custom chart implementation. To use `react-native-chart-kit`:
```bash
npm install react-native-chart-kit react-native-svg
```
Then import and use BarChart from react-native-chart-kit for enhanced visualizations.

### 4. CommunicationScreen (`src/screens/parent/CommunicationScreen.tsx`)
Centralized communication hub for parents and teachers.

**Features:**
- **Two Tabs**: Messages and Announcements
- **Messages Tab**:
  - Unread messages section (highlighted)
  - Read messages section
  - Priority badges (High, Medium, Low)
  - Mark as read functionality
  - Sender information (name and role)
- **Announcements Tab**:
  - Important announcements section (highlighted with 📌)
  - Regular announcements
  - Category badges
  - Attachment indicators
  - Author and date information
- **Pull-to-Refresh**: Refresh messages and announcements

## State Management

### Redux Slice (`src/store/slices/parentSlice.ts`)
Manages all parent-related state including:
- Children list
- Selected child ID
- Child statistics
- Attendance data (today and calendar)
- Grades and exam results
- Assignments
- Fee payments
- Messages and announcements
- Subject-wise performance

### API Integration (`src/api/parentApi.ts`)
RESTful API client with endpoints for:
- Fetching children list
- Getting child statistics
- Retrieving attendance data
- Fetching grades and exam results
- Getting assignments and fee payments
- Managing messages and announcements

## Types (`src/types/parent.ts`)
Comprehensive TypeScript interfaces for:
- Child information
- Attendance records
- Grades and exam results
- Assignments
- Fee payments
- Messages and announcements
- Performance metrics

## Navigation Updates

### ParentNavigator (`src/navigation/ParentNavigator.tsx`)
Updated to include:
- Stack navigator for dashboard-related screens
- New bottom tab for ParentDashboard
- Routes for AttendanceMonitor, GradesMonitor, and Communication screens

### Navigation Types (`src/types/navigation.ts`)
Added new screen params:
- `ParentDashboard`
- `AttendanceMonitor: { childId: number }`
- `GradesMonitor: { childId: number }`
- `Communication`

## Installation & Usage

### 1. Install Dependencies (if not already installed)
```bash
cd mobile
npm install
```

### 2. Optional: Install Additional Visualization Libraries
For enhanced calendar features:
```bash
npm install react-native-calendars
```

For advanced charts:
```bash
npm install react-native-chart-kit react-native-svg
```

### 3. Run the App
```bash
npm start
# Then press 'a' for Android or 'i' for iOS
```

## API Endpoints Required

The parent app expects the following backend endpoints:

### Children Management
- `GET /api/v1/parent/children` - Get list of children
- `GET /api/v1/parent/children/:id/stats` - Get child statistics

### Attendance
- `GET /api/v1/parent/children/:id/attendance/today` - Today's attendance
- `GET /api/v1/parent/children/:id/attendance/calendar` - Monthly calendar
- `GET /api/v1/parent/children/:id/attendance/subjects` - Subject-wise attendance

### Grades & Exams
- `GET /api/v1/parent/children/:id/grades/recent` - Recent grades
- `GET /api/v1/parent/children/:id/exams/results` - Exam results
- `GET /api/v1/parent/children/:id/performance/subjects` - Subject performance

### Assignments & Fees
- `GET /api/v1/parent/children/:id/assignments/pending` - Pending assignments
- `GET /api/v1/parent/children/:id/fees` - Fee payments

### Communication
- `GET /api/v1/parent/messages` - Get messages
- `GET /api/v1/parent/announcements` - Get announcements
- `PATCH /api/v1/parent/messages/:id/read` - Mark message as read
- `POST /api/v1/parent/messages` - Send message

## Styling

All components follow a consistent design system:
- Primary Color: `#5856D6` (Purple)
- Success Color: `#34C759` (Green)
- Warning Color: `#FF9500` (Orange)
- Error Color: `#FF3B30` (Red)
- Text Color: `#1C1C1E` (Dark Gray)
- Secondary Text: `#8E8E93` (Gray)
- Background: `#F2F2F7` (Light Gray)

## Performance Optimizations

- Redux state persistence with AsyncStorage
- Optimized re-renders with proper memoization
- Lazy loading of child-specific data
- Efficient list rendering with proper keys
- Pull-to-refresh for data updates

## Future Enhancements

1. **Push Notifications**: Alert parents of absences, low grades, or new messages
2. **Attendance Comparison**: Compare attendance across multiple children
3. **Grade Trends**: Line charts showing grade trends over time
4. **Message Threading**: Group messages into conversations
5. **File Attachments**: View and download message attachments
6. **Calendar Integration**: Sync important dates with device calendar
7. **Offline Support**: Cache data for offline viewing
8. **Dark Mode**: Support for dark theme

## Testing

The implementation follows React Native best practices and is ready for:
- Unit testing with Jest
- Integration testing with React Testing Library
- E2E testing with Detox

## Troubleshooting

### Issue: Children not loading
- Check API endpoint configuration in `.env`
- Verify authentication token is valid
- Check network connectivity

### Issue: Navigation not working
- Ensure all screens are properly registered in ParentNavigator
- Verify navigation types match screen names

### Issue: Redux state not persisting
- Clear AsyncStorage cache
- Check redux-persist configuration

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
