# Dashboard Widgets System Implementation

## Overview
A fully functional contextual dashboard widgets system that adapts based on user roles and activities, featuring drag-and-drop customization and persistent backend storage.

## Features

### Core Functionality
- **Role-Based Widgets**: Different default widgets for students, teachers, and parents
- **Drag-and-Drop**: Reorder widgets using intuitive drag-and-drop interface
- **Persistent Storage**: Widget configurations saved to backend database
- **Customization Mode**: Toggle between view and customize modes
- **Widget Visibility**: Show/hide individual widgets
- **Reset to Defaults**: Restore role-based default widget layout

### Available Widget Types

#### Student Widgets
1. **Upcoming Deadlines**: Shows assignments and exams with due dates
2. **Recent Grades**: Displays recent exam results with averages
3. **Quick Stats**: Key metrics (pending assignments, attendance %)
4. **Study Streak**: Current and longest study streaks
5. **Goal Tracker**: Progress on active goals
6. **Badges**: Recently earned achievement badges

#### Teacher Widgets
1. **Pending Grading**: Submissions awaiting grading with progress bars
2. **Class Performance**: Overall class statistics
3. **Attendance Alerts**: Students with low attendance
4. **Upcoming Exams**: Scheduled examinations
5. **Quick Actions**: Common teacher actions

#### Parent Widgets
1. **Attendance Alerts**: Children's attendance concerns
2. **Recent Grades**: Children's recent exam performance
3. **Upcoming Deadlines**: Children's upcoming assignments/exams
4. **Attendance Summary**: Overall attendance statistics
5. **Recent Announcements**: School announcements

## Backend Implementation

### Database Models

#### DashboardWidget Model
```python
- id: Primary key
- user_id: Foreign key to users table
- widget_type: Enum of available widget types
- title: Widget display title
- position: Order in dashboard (for drag-and-drop)
- size: small, medium, large, or full
- is_visible: Boolean for show/hide
- config: JSON field for widget-specific configuration
- created_at, updated_at: Timestamps
```

#### WidgetPreset Model
```python
- id: Primary key
- role_slug: Role identifier (student, teacher, parent)
- widget_type: Enum of widget types
- default_title: Default title for widget
- default_position: Default order
- default_size: Default size
- default_visible: Boolean
- default_config: JSON with default configuration
- description: Widget description
```

### API Endpoints

#### Widget Management
- `GET /api/v1/dashboard/widgets` - Get user's widgets
- `POST /api/v1/dashboard/widgets` - Create new widget
- `GET /api/v1/dashboard/widgets/{id}` - Get specific widget
- `PUT /api/v1/dashboard/widgets/{id}` - Update widget
- `DELETE /api/v1/dashboard/widgets/{id}` - Delete widget
- `POST /api/v1/dashboard/widgets/positions` - Bulk update positions
- `GET /api/v1/dashboard/widgets/{id}/data` - Get widget data
- `POST /api/v1/dashboard/widgets/initialize` - Initialize default widgets
- `POST /api/v1/dashboard/widgets/reset` - Reset to defaults
- `GET /api/v1/dashboard/presets` - Get role-based presets

### Service Layer

The `DashboardWidgetService` provides:
- Widget CRUD operations
- Position management for drag-and-drop
- Role-based default widget initialization
- Dynamic data loading for each widget type
- Contextual data based on user role and activities

### Widget Data Providers

Each widget type has a dedicated data provider method:
- `_get_upcoming_deadlines()`: Fetches assignments and exams
- `_get_pending_grading()`: Calculates pending submissions
- `_get_attendance_alerts()`: Identifies low attendance
- `_get_recent_grades()`: Retrieves recent exam marks
- `_get_quick_stats()`: Computes key statistics
- `_get_study_streak()`: Gets gamification streak data
- `_get_recent_badges()`: Fetches earned badges
- `_get_goal_tracker()`: Loads active goals with progress

## Frontend Implementation

### Component Architecture

```
DashboardWidgets (Main Container)
├── DndContext (Drag-and-Drop Provider)
├── DraggableWidget (Wrapper for each widget)
│   └── WidgetFactory (Renders specific widget type)
│       ├── UpcomingDeadlinesWidget
│       ├── PendingGradingWidget
│       ├── AttendanceAlertsWidget
│       ├── RecentGradesWidget
│       ├── QuickStatsWidget
│       ├── StudyStreakWidget
│       ├── BadgesWidget
│       └── GoalTrackerWidget
```

### Key Components

#### DashboardWidgets
Main container managing:
- Widget loading and state
- Drag-and-drop handlers
- Customize mode toggle
- Reset functionality
- Error handling

#### DraggableWidget
Wrapper providing:
- Drag-and-drop functionality via @dnd-kit
- Customize mode UI
- Widget visibility toggle
- Context menu actions

#### WidgetFactory
Router that instantiates the correct widget component based on `widget_type`.

#### Individual Widget Components
Each widget:
- Loads its own data from backend
- Handles loading and error states
- Displays data in role-appropriate format
- Auto-refreshes based on config

### Drag-and-Drop Implementation

Uses `@dnd-kit` library:
```typescript
- DndContext: Provides drag-and-drop context
- SortableContext: Manages sortable items
- useSortable: Hook for sortable behavior
- PointerSensor: Detects drag gestures
```

Features:
- 8px activation distance to prevent accidental drags
- Visual feedback during drag
- Optimistic UI updates
- Automatic backend sync

## Usage

### Basic Integration

```typescript
import DashboardWidgets from '@/components/dashboard/DashboardWidgets';

function Dashboard() {
  return <DashboardWidgets />;
}
```

### With Customize Mode Control

```typescript
const [customizeMode, setCustomizeMode] = useState(false);

<DashboardWidgets
  customizeMode={customizeMode}
  onCustomizeModeChange={setCustomizeMode}
/>
```

### API Client Usage

```typescript
import dashboardWidgetsApi from '@/api/dashboardWidgets';

// Get widgets
const widgets = await dashboardWidgetsApi.getWidgets();

// Initialize defaults
const defaultWidgets = await dashboardWidgetsApi.initializeDefaultWidgets();

// Update positions
await dashboardWidgetsApi.updatePositions({
  updates: [
    { widget_id: 1, position: 0 },
    { widget_id: 2, position: 1 }
  ]
});

// Get widget data
const data = await dashboardWidgetsApi.getWidgetData(widgetId);
```

## Database Migration

Run the migration to create necessary tables:

```bash
alembic upgrade head
```

The migration creates:
- `dashboard_widgets` table
- `widget_presets` table
- Required indexes for performance
- Enum types for widget_type and widget_size

## Responsive Design

Widgets adapt to screen size:
- **Small widgets**: 3 columns on desktop, 2 on tablet, 1 on mobile
- **Medium widgets**: 3 columns on desktop, 2 on tablet, 1 on mobile
- **Large widgets**: 2 columns on desktop, 1 on tablet/mobile
- **Full widgets**: Always full width

## Customization Options

### Widget Configuration
Each widget supports a `config` JSON field:
```json
{
  "refresh_interval": 300,
  "max_items": 10,
  "show_icons": true,
  "compact_view": false,
  "threshold": 75.0
}
```

### Widget Sizes
- **small**: Compact display (25% width on desktop)
- **medium**: Standard display (33% width on desktop)
- **large**: Expanded display (50% width on desktop)
- **full**: Full width display (100% width)

## Performance Considerations

1. **Lazy Loading**: Widget data loaded on-demand
2. **Caching**: Backend implements caching for expensive queries
3. **Pagination**: Widgets limit items via `max_items` config
4. **Debouncing**: Drag operations debounced to reduce API calls
5. **Optimistic Updates**: UI updates immediately, syncs in background

## Error Handling

- Widget-level error boundaries prevent cascade failures
- Graceful degradation when data unavailable
- User-friendly error messages
- Retry mechanisms for failed requests
- Fallback to empty state displays

## Future Enhancements

1. **Widget Library**: Marketplace for custom widgets
2. **Shared Layouts**: Save and share widget configurations
3. **Widget Themes**: Custom color schemes per widget
4. **Advanced Filters**: Filter widget data by date ranges, subjects, etc.
5. **Real-time Updates**: WebSocket integration for live data
6. **Export Layouts**: Save configurations as JSON
7. **Widget Analytics**: Track widget usage and engagement
8. **Mobile Gestures**: Swipe actions for mobile optimization

## Files Created

### Backend
- `src/models/dashboard_widget.py` - Database models
- `src/models/user_settings.py` - User settings model (referenced)
- `src/schemas/dashboard_widget.py` - Pydantic schemas
- `src/services/dashboard_widget_service.py` - Business logic
- `src/api/v1/dashboard_widgets.py` - API endpoints
- `alembic/versions/001_add_dashboard_widgets.py` - Migration

### Frontend
- `frontend/src/api/dashboardWidgets.ts` - API client
- `frontend/src/components/dashboard/DashboardWidgets.tsx` - Main component
- `frontend/src/components/dashboard/DraggableWidget.tsx` - Draggable wrapper
- `frontend/src/components/dashboard/WidgetFactory.tsx` - Widget router
- `frontend/src/components/dashboard/widgets/UpcomingDeadlinesWidget.tsx`
- `frontend/src/components/dashboard/widgets/PendingGradingWidget.tsx`
- `frontend/src/components/dashboard/widgets/AttendanceAlertsWidget.tsx`
- `frontend/src/components/dashboard/widgets/RecentGradesWidget.tsx`
- `frontend/src/components/dashboard/widgets/QuickStatsWidget.tsx`
- `frontend/src/components/dashboard/widgets/StudyStreakWidget.tsx`
- `frontend/src/components/dashboard/widgets/BadgesWidget.tsx`
- `frontend/src/components/dashboard/widgets/GoalTrackerWidget.tsx`

## Dependencies

### Required NPM Packages
```json
{
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^7.0.0",
  "@dnd-kit/utilities": "^3.2.0",
  "date-fns": "^2.30.0"
}
```

### Python Packages (Already Included)
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic

## Testing Recommendations

1. **Unit Tests**: Test individual widget data providers
2. **Integration Tests**: Test full widget CRUD operations
3. **E2E Tests**: Test drag-and-drop and customization flow
4. **Performance Tests**: Measure widget data loading times
5. **Role Tests**: Verify correct widgets for each role

## Security Considerations

- All endpoints require authentication
- User can only access their own widgets
- Widget data filtered by user permissions
- SQL injection prevention via ORM
- XSS prevention via proper escaping
- CSRF protection on state-changing operations

## Accessibility

- Keyboard navigation support
- Screen reader compatible
- ARIA labels on interactive elements
- Focus management during drag operations
- High contrast mode compatible
- Reduced motion support for animations
