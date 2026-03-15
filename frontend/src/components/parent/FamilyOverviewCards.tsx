import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type { FamilyOverviewMetrics } from '@/types/parent';

interface FamilyOverviewCardsProps {
  metrics: FamilyOverviewMetrics;
}

export const FamilyOverviewCards: React.FC<FamilyOverviewCardsProps> = ({ metrics }) => {
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'warning';
    return 'error';
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'primary.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PeopleIcon color="primary" fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {metrics.total_children}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Children
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'warning.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AssignmentIcon color="warning" fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {metrics.total_assignments_due}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assignments Due
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'info.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EventIcon color="info" fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {metrics.upcoming_events_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming Events
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'success.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleIcon color="success" fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {metrics.average_attendance.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg. Attendance
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Individual Child Metrics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {metrics.children_metrics.map((child) => (
                <Grid item xs={12} md={6} lg={4} key={child.child_id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {child.child_name}
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Attendance
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={getAttendanceColor(child.attendance_percentage)}
                            >
                              {child.attendance_percentage.toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={child.attendance_percentage}
                            color={getAttendanceColor(child.attendance_percentage)}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Assignments Due
                          </Typography>
                          <Chip
                            label={child.assignments_due}
                            size="small"
                            color={child.assignments_due > 0 ? 'warning' : 'success'}
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Average Score
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {child.average_score.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
