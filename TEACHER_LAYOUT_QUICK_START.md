# TeacherLayout Quick Start Guide

## Installation & Setup

### 1. Import the Component
```tsx
import { TeacherLayout } from '@/components/teacher';
```

### 2. Add to Router
```tsx
import { Routes, Route } from 'react-router-dom';
import { TeacherLayout } from '@/components/teacher';

function App() {
  return (
    <Routes>
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="attendance" element={<AttendanceMarking />} />
        <Route path="grading" element={<GradingQueue />} />
        <Route path="classes" element={<MyClasses />} />
        <Route path="performance" element={<ClassPerformance />} />
        {/* Add more routes as needed */}
      </Route>
    </Routes>
  );
}
```

## Key Features at a Glance

### Quick Access Buttons (App Bar)
- **Attendance**: Shows pending classes needing attendance
- **Grading**: Shows items waiting to be graded
- Click buttons to navigate directly to those sections

### Sidebar Quick Actions
When sidebar is expanded, you'll see:
- Mark All Present
- Bulk Grade
- Send Announcement

### Upcoming Classes Widget
Located at the bottom of the sidebar:
- Shows next 3 classes
- Displays time and room
- Click to view class details
- Quick link to full schedule

## Navigation Overview

### Primary Navigation
1. **Dashboard** - Overview and statistics
2. **Mark Attendance** - Quick attendance marking (has "Quick" badge)
3. **Grading Queue** - View and grade submissions (shows count)
4. **My Classes** - Manage your classes
5. **Assignments** - Create, manage, and review assignments
6. **Tests & Exams** - Test management and results
7. **Class Performance** - Analytics and dashboards
8. **Student Management** - Student information and progress
9. **Teaching Resources** - Access teaching materials
10. **My Schedule** - View your timetable
11. **Analytics** - Advanced teaching analytics
12. **Messages** - Communication center (shows unread count)

### Mobile Navigation
On mobile devices, use the bottom navigation bar:
- Dashboard
- Attendance
- Grading
- Classes
- Performance

## Customization Examples

### Update Pending Counts
Replace mock data with real API calls:

```tsx
// In TeacherAppBar.tsx
const [pendingGrading, setPendingGrading] = useState(0);
const [pendingAttendance, setPendingAttendance] = useState(0);

useEffect(() => {
  async function fetchPendingCounts() {
    const grading = await gradingAPI.getPendingCount();
    const attendance = await attendanceAPI.getPendingCount();
    setPendingGrading(grading);
    setPendingAttendance(attendance);
  }
  fetchPendingCounts();
}, []);
```

### Update Class Schedule
Replace mock data with API data:

```tsx
// In TeacherSidebar.tsx
const [upcomingClasses, setUpcomingClasses] = useState([]);

useEffect(() => {
  async function fetchSchedule() {
    const schedule = await scheduleAPI.getUpcoming(3);
    setUpcomingClasses(schedule);
  }
  fetchSchedule();
}, []);
```

### Add Custom Quick Action
```tsx
// In TeacherSidebar.tsx
const batchActions = [
  { id: 'mark-all-present', label: 'Mark All Present', icon: <ChecklistIcon /> },
  { id: 'grade-assignments', label: 'Bulk Grade', icon: <GradingIcon /> },
  { id: 'send-announcement', label: 'Send Announcement', icon: <MessagesIcon /> },
  // Add your custom action
  { id: 'export-grades', label: 'Export Grades', icon: <DownloadIcon /> },
];
```

### Handle Quick Actions
```tsx
const handleQuickAction = (actionId: string) => {
  switch (actionId) {
    case 'mark-all-present':
      // Navigate or show dialog
      navigate('/teacher/attendance/bulk');
      break;
    case 'grade-assignments':
      navigate('/teacher/grading/bulk');
      break;
    case 'send-announcement':
      setAnnouncementDialogOpen(true);
      break;
    case 'export-grades':
      handleExportGrades();
      break;
  }
};

// Update onClick in Chip
onClick={() => handleQuickAction(action.id)}
```

## Common Tasks

### Task 1: Mark Attendance for Today
1. Click "Attendance" button in app bar
2. Or click "Mark Attendance" in sidebar
3. Or click "Mark All Present" quick action

### Task 2: Grade Pending Assignments
1. Click "Grade" button in app bar (shows pending count)
2. Or navigate to "Grading Queue" in sidebar
3. Review and grade submissions

### Task 3: View Next Class
1. Check "Upcoming Classes" widget in sidebar
2. Click on a class card to view details
3. Or click arrow icon to view full schedule

### Task 4: Send Class Announcement
1. Click "Send Announcement" in quick actions
2. Or navigate to Messages → Compose
3. Select class and send message

### Task 5: Check Class Performance
1. Click "Class Performance" in sidebar
2. View dashboards and analytics
3. Generate reports as needed

## Mobile Usage

### On Small Screens (Phones)
- Navigation moves to bottom bar
- Sidebar becomes overlay (swipe or tap hamburger)
- Quick actions accessible via hamburger menu
- Widgets show in collapsed sidebar

### On Tablets
- Sidebar can collapse to icons only
- Quick actions always visible
- Widgets show when expanded
- Bottom nav hidden

## Keyboard Shortcuts

- **Tab**: Navigate between elements
- **Enter/Space**: Activate buttons and links
- **Esc**: Close menus and dialogs
- **Arrow Keys**: Navigate within menus

## Accessibility Features

- Skip to content link
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader announcements
- High contrast support
- Focus indicators

## Troubleshooting

### Sidebar Not Showing
- Check if you're on mobile (sidebar is hidden by default)
- Click hamburger menu to open
- On desktop, sidebar should be visible

### Quick Actions Not Working
- Ensure sidebar is expanded (not collapsed)
- Quick actions only show when `open={true}`

### Badge Counts Not Updating
- Replace mock data with real API calls
- Add useEffect hooks to fetch data periodically
- Consider WebSocket for real-time updates

### Navigation Not Working
- Verify routes are properly configured
- Check path matches in router
- Ensure TeacherLayout is parent route

## Performance Tips

1. **Lazy Load Routes**: Use React.lazy for route components
2. **Memoize Components**: Use React.memo for static widgets
3. **Debounce API Calls**: Don't fetch on every render
4. **Cache Data**: Store fetched data in state management
5. **Optimize Images**: Use proper sizes for avatars and icons

## Next Steps

1. Create page components for each route
2. Implement API integrations for real data
3. Add WebSocket for real-time notifications
4. Customize theme and colors
5. Add analytics tracking
6. Implement batch action functionality
7. Create dialogs for quick actions
8. Add permission-based feature visibility

## Support & Resources

- View full implementation: [TEACHER_LAYOUT_IMPLEMENTATION.md](TEACHER_LAYOUT_IMPLEMENTATION.md)
- Material-UI Documentation: https://mui.com/
- React Router Documentation: https://reactrouter.com/
- Accessibility Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
