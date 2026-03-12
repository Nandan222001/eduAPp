# Dashboard Widgets - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Backend dependencies (if not already installed)
pip install fastapi sqlalchemy alembic pydantic

# Frontend dependencies
cd frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns
```

### Step 2: Run Database Migration

```bash
# From project root
alembic upgrade head
```

This creates:
- `dashboard_widgets` table
- `widget_presets` table
- Required indexes

### Step 3: Import and Use

```typescript
// In any dashboard page (e.g., StudentDashboard.tsx)
import DashboardWidgets from '@/components/dashboard/DashboardWidgets';

function StudentDashboard() {
  return (
    <Box>
      <DashboardWidgets />
    </Box>
  );
}
```

That's it! The component will:
1. Auto-load widgets from backend
2. Initialize role-based defaults if none exist
3. Enable drag-and-drop customization
4. Persist changes automatically

## 📋 Features at a Glance

### For End Users
- **View Mode**: See personalized widgets based on role
- **Customize Mode**: Click settings icon → "Customize Dashboard"
- **Drag & Drop**: Reorder widgets by dragging
- **Hide Widgets**: Use widget menu to hide unwanted widgets
- **Reset**: Restore default layout anytime

### For Developers
- **Role-Based**: Automatic widget selection per user role
- **Extensible**: Easy to add new widget types
- **API-Driven**: RESTful endpoints for all operations
- **Configurable**: JSON-based widget configuration

## 🎨 Widget Types by Role

### Students See:
- Upcoming Deadlines
- Recent Grades
- Quick Stats
- Study Streak
- Goal Tracker
- Badges

### Teachers See:
- Pending Grading
- Class Performance
- Attendance Alerts
- Upcoming Exams
- Quick Actions

### Parents See:
- Attendance Alerts (Children)
- Recent Grades (Children)
- Upcoming Deadlines (Children)
- Attendance Summary
- Recent Announcements

## 🔌 Quick API Reference

```typescript
import dashboardWidgetsApi from '@/api/dashboardWidgets';

// Get all widgets
const widgets = await dashboardWidgetsApi.getWidgets();

// Get widget data
const data = await dashboardWidgetsApi.getWidgetData(widgetId);

// Update positions after drag
await dashboardWidgetsApi.updatePositions({
  updates: [
    { widget_id: 1, position: 0 },
    { widget_id: 2, position: 1 }
  ]
});

// Hide a widget
await dashboardWidgetsApi.updateWidget(widgetId, { is_visible: false });

// Reset to defaults
await dashboardWidgetsApi.resetToDefaults();
```

## 🎯 Common Use Cases

### 1. Add Widget to Existing Dashboard

```typescript
// Replace static content with DashboardWidgets
function Dashboard() {
  return (
    <Container>
      <Typography variant="h4" mb={3}>Dashboard</Typography>
      <DashboardWidgets />
    </Container>
  );
}
```

### 2. Control Customize Mode Externally

```typescript
function Dashboard() {
  const [customizing, setCustomizing] = useState(false);

  return (
    <>
      <Button onClick={() => setCustomizing(!customizing)}>
        {customizing ? 'Done' : 'Customize'}
      </Button>
      
      <DashboardWidgets
        customizeMode={customizing}
        onCustomizeModeChange={setCustomizing}
      />
    </>
  );
}
```

### 3. Create New Widget Type

```typescript
// 1. Add to WidgetType enum in backend and frontend
// 2. Create widget component
function MyCustomWidget({ widget }: { widget: DashboardWidget }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [widget.id]);

  const loadData = async () => {
    const response = await dashboardWidgetsApi.getWidgetData(widget.id);
    setData(response.data);
  };

  return <Box>{/* Your widget UI */}</Box>;
}

// 3. Add to WidgetFactory
case WidgetType.MY_CUSTOM:
  return <MyCustomWidget widget={widget} />;

// 4. Add data provider in service
@staticmethod
def _get_my_custom(db: Session, user: User, config: Dict) -> Dict[str, Any]:
    # Return widget data
    return {'data': 'value'}
```

## 📱 Responsive Behavior

Widgets automatically adapt:
- **Desktop**: 2-4 columns based on widget size
- **Tablet**: 1-2 columns
- **Mobile**: 1 column (stacked)

## ⚙️ Widget Configuration

Each widget supports config options:

```typescript
{
  refresh_interval: 300,    // Refresh every 5 minutes
  max_items: 10,            // Show max 10 items
  show_icons: true,         // Display icons
  compact_view: false,      // Compact layout
  threshold: 75.0          // Custom threshold (e.g., attendance %)
}
```

Update via API:
```typescript
await dashboardWidgetsApi.updateWidget(widgetId, {
  config: { max_items: 20, threshold: 80 }
});
```

## 🐛 Troubleshooting

### Widgets Not Loading
1. Check authentication (user must be logged in)
2. Verify API endpoint is registered in backend
3. Check browser console for errors

### Drag-and-Drop Not Working
1. Ensure @dnd-kit packages are installed
2. Check customize mode is enabled
3. Verify widget has valid ID

### Widget Data Empty
1. Check user has appropriate permissions
2. Verify data exists in database
3. Check service layer logic for role

### Backend Errors
1. Run migrations: `alembic upgrade head`
2. Check database connection
3. Verify models are imported in `__init__.py`

## 📚 Learn More

- **Full Documentation**: See `DASHBOARD_WIDGETS_IMPLEMENTATION.md`
- **API Endpoints**: Visit `/docs` in your FastAPI app
- **Examples**: Check widget component files in `frontend/src/components/dashboard/widgets/`

## 💡 Tips

1. **Start Simple**: Use default widgets first, customize later
2. **Role Testing**: Test with different user roles to see variations
3. **Performance**: Limit max_items for better performance
4. **Mobile**: Test drag-and-drop on touch devices
5. **Accessibility**: Ensure keyboard navigation works

## 🎉 You're Ready!

The dashboard widgets system is now set up and ready to use. Your users can enjoy a personalized, role-adapted dashboard experience!

---

**Need Help?**
- Check the full implementation guide: `DASHBOARD_WIDGETS_IMPLEMENTATION.md`
- Review component examples in the widgets directory
- Test endpoints using FastAPI's built-in `/docs` interface
