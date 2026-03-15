import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Stack,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { ChildOverview, ComparativePerformanceData, PrivacySettings } from '@/types/parent';

interface ComparativePerformanceDashboardProps {
  data: ComparativePerformanceData[];
  selectedChildren?: ChildOverview[];
  privacySettings?: PrivacySettings;
}

const CHILD_COLORS = ['#1976d2', '#9c27b0', '#f57c00', '#388e3c', '#d32f2f', '#0288d1'];

export const ComparativePerformanceDashboard: React.FC<ComparativePerformanceDashboardProps> = ({
  data,
  selectedChildren: _selectedChildren,
  privacySettings,
}) => {
  const [viewMode, setViewMode] = useState<'scores' | 'assignments' | 'attendance'>('scores');

  if (privacySettings?.disable_sibling_comparisons) {
    return (
      <Alert severity="info">
        Sibling comparisons are disabled in your privacy settings. You can enable them in the
        Settings tab.
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert severity="info">No performance data available for comparison at this time.</Alert>
    );
  }

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode) {
      setViewMode(newMode as 'scores' | 'assignments' | 'attendance');
    }
  };

  const prepareBarChartData = () => {
    const subjects = data[0]?.subjects.map((s) => s.subject_name) || [];
    return subjects.map((subjectName) => {
      const dataPoint: Record<string, string | number> = { subject: subjectName };
      data.forEach((child) => {
        const subject = child.subjects.find((s) => s.subject_name === subjectName);
        if (subject) {
          if (viewMode === 'scores') {
            dataPoint[child.child_name] = subject.average_score;
          } else if (viewMode === 'assignments') {
            dataPoint[child.child_name] = subject.assignments_completed;
          } else {
            dataPoint[child.child_name] = subject.attendance_percentage;
          }
        }
      });
      return dataPoint;
    });
  };

  const prepareRadarChartData = () => {
    return (
      data[0]?.subjects.map((subject) => {
        const dataPoint: Record<string, string | number> = { subject: subject.subject_name };
        data.forEach((child) => {
          const childSubject = child.subjects.find((s) => s.subject_name === subject.subject_name);
          if (childSubject) {
            dataPoint[child.child_name] = childSubject.average_score;
          }
        });
        return dataPoint;
      }) || []
    );
  };

  const barChartData = prepareBarChartData();
  const radarChartData = prepareRadarChartData();

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Comparative Performance Analysis</Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="scores">Scores</ToggleButton>
              <ToggleButton value="assignments">Assignments</ToggleButton>
              <ToggleButton value="attendance">Attendance</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            This comparison is for informational purposes to help understand each child&apos;s
            strengths and areas for growth. Every child learns differently and at their own pace.
          </Alert>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {viewMode === 'scores' && 'Average Scores by Subject'}
                {viewMode === 'assignments' && 'Completed Assignments by Subject'}
                {viewMode === 'attendance' && 'Attendance Percentage by Subject'}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {data.map((child, idx) => (
                    <Bar
                      key={child.child_id}
                      dataKey={child.child_name}
                      fill={CHILD_COLORS[idx % CHILD_COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Performance Profile
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarChartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  {data.map((child, idx) => (
                    <Radar
                      key={child.child_id}
                      name={child.child_name}
                      dataKey={child.child_name}
                      stroke={CHILD_COLORS[idx % CHILD_COLORS.length]}
                      fill={CHILD_COLORS[idx % CHILD_COLORS.length]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Individual Subject Analysis
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {data.map((child, idx) => (
                  <Grid item xs={12} md={6} lg={4} key={child.child_id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: CHILD_COLORS[idx % CHILD_COLORS.length],
                            }}
                          />
                          <Typography variant="subtitle1" fontWeight="bold">
                            {child.child_name}
                          </Typography>
                        </Box>
                        <Stack spacing={1}>
                          {child.subjects.map((subject) => (
                            <Box
                              key={subject.subject_name}
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'background.default',
                              }}
                            >
                              <Typography variant="body2" fontWeight="medium">
                                {subject.subject_name}
                              </Typography>
                              <Box display="flex" justifyContent="space-between" mt={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                  Avg: {subject.average_score.toFixed(1)}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Assignments: {subject.assignments_completed}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Att: {subject.attendance_percentage.toFixed(1)}%
                                </Typography>
                              </Box>
                            </Box>
                          ))}
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
    </Box>
  );
};
