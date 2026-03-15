import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Divider,
  Stack,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  School as SchoolIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import recognitionApi from '@/api/recognition';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const recognitionTypeLabels: Record<string, string> = {
  academic_excellence: 'Academic Excellence',
  helpful_peer: 'Helpful Peer',
  team_player: 'Team Player',
  creative_thinker: 'Creative Thinker',
  leadership: 'Leadership',
  kindness: 'Kindness',
  perseverance: 'Perseverance',
  improvement: 'Most Improved',
};

const recognitionTypeColors: Record<string, string> = {
  academic_excellence: '#FFD700',
  helpful_peer: '#4CAF50',
  team_player: '#2196F3',
  creative_thinker: '#FF9800',
  leadership: '#9C27B0',
  kindness: '#E91E63',
  perseverance: '#FF5722',
  improvement: '#00BCD4',
};

export default function SchoolCultureAnalyticsDashboard() {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['schoolCultureAnalytics', dateRange.start, dateRange.end],
    queryFn: () => recognitionApi.getSchoolCultureAnalytics(dateRange.start, dateRange.end),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No analytics data available</Alert>
      </Box>
    );
  }

  const trendChartData = {
    labels: analytics.recognition_trend.map((item) =>
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Recognitions',
        data: analytics.recognition_trend.map((item) => item.count),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const typeChartData = {
    labels: Object.keys(analytics.by_type).map((type) => recognitionTypeLabels[type] || type),
    datasets: [
      {
        label: 'Recognitions by Type',
        data: Object.values(analytics.by_type),
        backgroundColor: Object.keys(analytics.by_type).map(
          (type) => recognitionTypeColors[type] || theme.palette.primary.main
        ),
      },
    ],
  };

  const gradeChartData = {
    labels: Object.keys(analytics.by_grade),
    datasets: [
      {
        data: Object.values(analytics.by_grade),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ],
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <HeartIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'error.main' }} />
          School Culture Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track peer recognition trends and their impact on school culture
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Start Date"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrophyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Recognitions</Typography>
              </Box>
              <Typography variant="h3" color="primary.main">
                {analytics.total_recognitions.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In selected period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GroupIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Active Participants</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {analytics.active_participants}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Students engaged
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Participation Rate</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {analytics.participation_rate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Of total students
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {analytics.climate_correlation && (
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SchoolIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">Climate Score</Typography>
                </Box>
                <Typography variant="h3" color="info.main">
                  {analytics.climate_correlation.climate_score.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Correlation: {(analytics.climate_correlation.correlation * 100).toFixed(0)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <TimelineIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Recognition Trend
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Line
                data={trendChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              By Grade
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={gradeChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recognition Types
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Bar
                data={typeChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Senders
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {analytics.top_senders.slice(0, 5).map((sender, index) => (
                <ListItem
                  key={sender.student_id}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: index === 0 ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          index === 0
                            ? theme.palette.primary.main
                            : alpha(theme.palette.primary.main, 0.2),
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={sender.student_name}
                    secondary={`${sender.count} recognitions sent`}
                  />
                  {index === 0 && (
                    <Chip icon={<TrophyIcon />} label="Top Sender" size="small" color="primary" />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Recipients
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {analytics.top_recipients.slice(0, 5).map((recipient, index) => (
                <ListItem
                  key={recipient.student_id}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: index === 0 ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          index === 0
                            ? theme.palette.success.main
                            : alpha(theme.palette.success.main, 0.2),
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={recipient.student_name}
                    secondary={`${recipient.count} recognitions received`}
                  />
                  {index === 0 && (
                    <Chip
                      icon={<TrophyIcon />}
                      label="Most Recognized"
                      size="small"
                      color="success"
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recognition Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {Object.entries(analytics.by_type).map(([type, count]) => (
                <Box
                  key={type}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: alpha(recognitionTypeColors[type] || theme.palette.primary.main, 0.1),
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {recognitionTypeLabels[type] || type}
                  </Typography>
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      bgcolor: recognitionTypeColors[type] || theme.palette.primary.main,
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
