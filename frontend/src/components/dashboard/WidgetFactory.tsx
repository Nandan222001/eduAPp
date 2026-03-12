import { DashboardWidget, WidgetType } from '@/api/dashboardWidgets';
import UpcomingDeadlinesWidget from './widgets/UpcomingDeadlinesWidget';
import PendingGradingWidget from './widgets/PendingGradingWidget';
import AttendanceAlertsWidget from './widgets/AttendanceAlertsWidget';
import RecentGradesWidget from './widgets/RecentGradesWidget';
import QuickStatsWidget from './widgets/QuickStatsWidget';
import StudyStreakWidget from './widgets/StudyStreakWidget';
import BadgesWidget from './widgets/BadgesWidget';
import GoalTrackerWidget from './widgets/GoalTrackerWidget';
import { Box, Typography } from '@mui/material';

interface WidgetFactoryProps {
  widget: DashboardWidget;
}

export default function WidgetFactory({ widget }: WidgetFactoryProps) {
  switch (widget.widget_type) {
    case WidgetType.UPCOMING_DEADLINES:
      return <UpcomingDeadlinesWidget widget={widget} />;
    case WidgetType.PENDING_GRADING:
      return <PendingGradingWidget widget={widget} />;
    case WidgetType.ATTENDANCE_ALERTS:
      return <AttendanceAlertsWidget widget={widget} />;
    case WidgetType.RECENT_GRADES:
      return <RecentGradesWidget widget={widget} />;
    case WidgetType.QUICK_STATS:
      return <QuickStatsWidget widget={widget} />;
    case WidgetType.STUDY_STREAK:
      return <StudyStreakWidget widget={widget} />;
    case WidgetType.BADGES:
      return <BadgesWidget widget={widget} />;
    case WidgetType.GOAL_TRACKER:
      return <GoalTrackerWidget widget={widget} />;
    default:
      return (
        <Box p={2} textAlign="center">
          <Typography color="text.secondary">Widget type not implemented</Typography>
        </Box>
      );
  }
}
