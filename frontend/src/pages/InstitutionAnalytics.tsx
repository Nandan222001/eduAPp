import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Avatar,
  Divider,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import superAdminApi, { InstitutionAnalytics } from '@/api/superAdmin';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function InstitutionAnalyticsPage() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<InstitutionAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    if (id) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminApi.getInstitutionAnalytics(Number(id), timeRange);
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Analytics not found'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/super-admin/institutions/${id}`)}
          sx={{ mt: 2 }}
        >
          Back to Institution
        </Button>
      </Box>
    );
  }

  const usageTrendsData = {
    labels: analytics.usage_trends.map((item) =>
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Active Users',
        data: analytics.usage_trends.map((item) => item.active_users),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
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
  };

  const userMetricsData = {
    labels: ['Total Users', 'Active Users', 'Students', 'Teachers'],
    datasets: [
      {
        label: 'Count',
        data: [
          analytics.user_metrics.total_users,
          analytics.user_metrics.active_users,
          analytics.user_metrics.students,
          analytics.user_metrics.teachers,
        ],
        backgroundColor: [
          alpha(theme.palette.primary.main, 0.8),
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.info.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
        ],
      },
    ],
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/super-admin/institutions/${id}`)}
        >
          Back to Institution
        </Button>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Usage Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {analytics.institution_name}
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            label="Time Range"
          >
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
            <MenuItem value={180}>Last 6 months</MenuItem>
            <MenuItem value={365}>Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mr: 2,
                  }}
                >
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {analytics.user_metrics.total_users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    mr: 2,
                  }}
                >
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {analytics.user_metrics.active_users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    mr: 2,
                  }}
                >
                  <PersonAddIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {analytics.user_metrics.new_users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New Users
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Last {timeRange} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    mr: 2,
                  }}
                >
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{(analytics.revenue_metrics.total_revenue / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              User Activity Trend
            </Typography>
            <Box sx={{ height: 400, mt: 2 }}>
              <Line data={usageTrendsData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              User Distribution
            </Typography>
            <Box sx={{ height: 400, mt: 2 }}>
              <Bar
                data={userMetricsData}
                options={{
                  ...chartOptions,
                  indexAxis: 'y' as const,
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              mr: 2,
            }}
          >
            <AssessmentIcon />
          </Avatar>
          <Typography variant="h6" fontWeight={600}>
            Engagement Metrics
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Daily Active Users
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {analytics.engagement_metrics.daily_active_users}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Weekly Active Users
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {analytics.engagement_metrics.weekly_active_users}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Monthly Active Users
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {analytics.engagement_metrics.monthly_active_users}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Engagement Rate
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {analytics.engagement_metrics.engagement_rate.toFixed(1)}%
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mt: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Revenue Summary
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {analytics.revenue_metrics.currency}{' '}
                {analytics.revenue_metrics.total_revenue.toLocaleString()}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Recent Revenue (Last {timeRange} days)
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {analytics.revenue_metrics.currency}{' '}
                {analytics.revenue_metrics.recent_revenue.toLocaleString()}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
