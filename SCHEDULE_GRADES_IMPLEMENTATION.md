# Schedule and Grades Screens Implementation

## Overview
This document outlines the implementation of the Student Schedule and Grades screens for the mobile application, including API wrappers and UI components.

## Implemented Components

### 1. API Wrappers

#### `/mobile/src/api/schedule.ts`
- **Interfaces**:
  - `TimetableEntry`: Represents a single class entry with subject, time, room, and teacher details
  - `DailySchedule`: Contains entries for a specific day
  - `WeeklySchedule`: Contains schedule for an entire week
  - `TimetableParams`: Query parameters for fetching timetable

- **API Methods**:
  - `getTimetable(params)`: Fetch timetable with optional date/week filters
  - `getWeeklySchedule(weekStart, weekEnd)`: Get schedule for a specific week
  - `getDailySchedule(date)`: Get schedule for a specific date

#### `/mobile/src/api/grades.ts`
- **Interfaces**:
  - `ExamDetail`: Exam information including type, marks, and status
  - `GradeDetail`: Grade information with marks, percentage, rank, and comments
  - `SubjectGrades`: Aggregated grades per subject
  - `GradeDistribution`: Distribution of grades (A, B, C, etc.)
  - `PerformanceInsights`: Overall performance metrics and trends
  - `GradesParams` & `ExamsParams`: Query parameters for filtering

- **API Methods**:
  - `getGrades(params)`: Fetch grades with term/subject filters
  - `getExams(params)`: Fetch exam list with filters
  - `getGradeById(gradeId)`: Get detailed grade information
  - `getSubjectGrades(subject, term)`: Get all grades for a subject
  - `getGradeDistribution(term)`: Get grade distribution chart data
  - `getPerformanceInsights(term)`: Get performance analytics

### 2. ScheduleScreen (`/mobile/src/screens/student/ScheduleScreen.tsx`)

#### Features:
- **Weekly Timetable View**:
  - Displays schedule for the current week
  - Week navigation with previous/next arrows
  - Horizontal scrollable day selector
  - Today's date highlighted with indicator dot
  - Selected date highlighted with primary color

- **Class Cards**:
  - Subject name and code
  - Time range (start - end)
  - Room location with icon
  - Teacher name
  - Class type badges (Lecture, Lab, Tutorial, Practical)
  - Color-coded left border by class type

- **Swipe Gestures**:
  - Integrated with `react-native-gesture-handler`
  - Ready for swipe left/right for day navigation

- **Pull-to-Refresh**: Refresh timetable data

- **Empty States**: 
  - Shows friendly message when no classes scheduled
  - Different message for today vs other days

#### API Integration:
- Fetches from `/api/v1/timetable` endpoint
- Supports week-based filtering with `week_start` and `week_end` parameters
- Automatically loads data for current week on mount

### 3. GradesScreen (`/mobile/src/screens/student/GradesScreen.tsx`)

#### Features:
- **Performance Overview Card**:
  - Overall average percentage
  - Current grade
  - Total exams count
  - Trend indicator (improving/stable/declining) with emoji

- **Performance Trend Chart**:
  - Line chart showing recent exam performance
  - Displays last 6 exams
  - Uses `react-native-chart-kit` library
  - Shows percentage trend over time

- **Grade Distribution Chart**:
  - Bar chart showing distribution of grades (A, B, C, etc.)
  - Count of each grade type
  - Visual representation of overall performance

- **Filters**:
  - Term filter (All Terms, Term 1, Term 2, etc.)
  - Subject filter (All Subjects, Math, Science, etc.)
  - Horizontal scrollable chip-based UI
  - Dynamic filter options based on available data

- **Subject-wise Grade Cards**:
  - Grouped by subject
  - Shows subject average and exam count
  - Grid layout of exam results
  - Each exam card shows:
    - Exam name
    - Marks obtained/total
    - Percentage
    - Grade badge (color-coded: A+ green, B blue, C yellow, D orange, F red)

- **Grade Detail Modal**:
  - Opens when clicking any grade card
  - Shows comprehensive exam details:
    - Exam name and subject
    - Large grade badge
    - Total score and percentage
    - Class rank (if available)
    - Class average comparison
    - Highest and lowest scores
    - Performance insights section:
      - Above/below average indicator
      - Difference from class average
    - Teacher remarks
    - Teacher comments

- **Performance Insights**:
  - Strengths and improvement areas
  - Trend analysis
  - Comparison with class performance

- **Pull-to-Refresh**: Refresh all grade data

- **Empty States**: Informative message when no grades available

#### API Integration:
- Fetches from `/api/v1/grades` and `/api/v1/exams` endpoints
- Also calls `/api/v1/grades/distribution` and `/api/v1/grades/insights`
- Supports filtering by term, subject, and exam type
- Parallel data fetching for better performance

## Dependencies Installed

```json
{
  "react-native-chart-kit": "^6.12.0",
  "react-native-svg": "^15.15.3"
}
```

### Existing Dependencies Used:
- `react-native-gesture-handler`: For swipe gestures
- `date-fns`: For date manipulation and formatting
- `@rneui/themed`: For UI components (Card, Button, Text)
- `@tanstack/react-query`: Ready for integration (currently using useState)

## API Endpoints Expected

### Timetable API:
```
GET /api/v1/timetable
Query params:
  - date?: string (YYYY-MM-DD)
  - week_start?: string (YYYY-MM-DD)
  - week_end?: string (YYYY-MM-DD)

Response: TimetableEntry[]
```

### Grades APIs:
```
GET /api/v1/grades
Query params:
  - term?: string
  - subject?: string
  - exam_type?: string
  - page?: number
  - limit?: number

Response: GradeDetail[]

GET /api/v1/exams
Query params:
  - term?: string
  - subject?: string
  - status?: 'scheduled' | 'completed' | 'cancelled'

Response: ExamDetail[]

GET /api/v1/grades/distribution
Query params:
  - term?: string

Response: GradeDistribution[]

GET /api/v1/grades/insights
Query params:
  - term?: string

Response: PerformanceInsights

GET /api/v1/grades/:gradeId
Response: GradeDetail
```

## UI/UX Features

### ScheduleScreen:
- Clean, modern card-based design
- Easy week navigation
- Today highlighting for quick reference
- Empty state with appropriate messaging
- Loading states with activity indicator
- Color-coded class types for quick identification
- Comprehensive class information at a glance

### GradesScreen:
- Rich data visualization with charts
- Intuitive filtering system
- Detailed performance metrics
- Subject-wise organization
- Interactive grade cards
- Comprehensive detail modal
- Performance insights and trends
- Comparison with class average
- Teacher feedback display
- Color-coded grade badges for quick assessment

## Code Quality

- TypeScript interfaces for type safety
- Proper error handling with try-catch
- Loading and refreshing states
- Memoized computed values for performance
- Clean separation of concerns
- Reusable styling patterns
- Responsive design considerations
- Consistent with existing codebase patterns

## Future Enhancements

### Potential Additions:
1. **ScheduleScreen**:
   - Add to calendar integration
   - Class reminders/notifications
   - Classroom navigation/maps
   - Teacher contact quick actions
   - Filter by class type

2. **GradesScreen**:
   - Export grades as PDF
   - Share performance reports
   - Goal setting and tracking
   - Subject-wise performance comparison
   - Historical performance analysis
   - Predicted grade trends
   - Study recommendations based on weak areas

## Integration Notes

- Both screens are already exported in `/mobile/src/screens/index.ts`
- API wrappers are exported in `/mobile/src/api/index.ts`
- Screens follow the existing navigation pattern with `StudentTabScreenProps`
- Ready to integrate with navigation stack
- Can be enhanced with React Query hooks for caching and background updates
