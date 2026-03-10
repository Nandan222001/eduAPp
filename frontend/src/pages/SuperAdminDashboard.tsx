import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  TableSortLabel,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  SelectChangeEvent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  AddBusiness as AddBusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import superAdminApi, { SuperAdminDashboardResponse } from '@/api/superAdmin';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: number;
}

function MetricCard({ title, value, icon, color, subtitle, trend }: MetricCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box
          sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon
                  sx={{
                    fontSize: 16,
                    color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    transform: trend < 0 ? 'rotate(180deg)' : 'none',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    ml: 0.5,
                    color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main,
                  }}
                >
                  {Math.abs(trend)}% vs last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

type SortField = 'name' | 'total_users' | 'active_users' | 'revenue' | 'engagement';
type SortOrder = 'asc' | 'desc';

export default function SuperAdminDashboard() {
  const theme = useTheme();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<SuperAdminDashboardResponse | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminApi.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value);
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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    metrics_summary,
    subscription_distribution,
    platform_usage,
    revenue_trends,
    recent_activities,
    institution_performance,
    quick_actions,
  } = dashboardData;

  const subscriptionData = [
    {
      status: 'Active',
      count: subscription_distribution.active,
      color: theme.palette.success.main,
    },
    { status: 'Trial', count: subscription_distribution.trial, color: theme.palette.info.main },
    {
      status: 'Expired',
      count: subscription_distribution.expired,
      color: theme.palette.error.main,
    },
    {
      status: 'Cancelled',
      count: subscription_distribution.cancelled,
      color: theme.palette.warning.main,
    },
  ];

  const totalInstitutions = metrics_summary.total_institutions;
  const activeSubscriptions = metrics_summary.active_subscriptions;

  const filteredInstitutions = institution_performance.filter(
    (inst) => filterStatus === 'all' || inst.subscription_status.toLowerCase() === filterStatus
  );

  const sortedInstitutions = [...filteredInstitutions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return multiplier * aValue.localeCompare(bValue);
    }
    return multiplier * (Number(aValue) - Number(bValue));
  });

  const getStatusChip = (status: string) => {
    const statusConfig: Record<
      string,
      {
        color: 'success' | 'info' | 'error' | 'warning' | 'default';
        icon: React.ReactElement | null;
      }
    > = {
      active: { color: 'success', icon: <CheckCircleIcon /> },
      trial: { color: 'info', icon: <ScheduleIcon /> },
      expired: { color: 'error', icon: <CancelIcon /> },
      cancelled: { color: 'warning', icon: <WarningIcon /> },
      none: { color: 'default', icon: null },
    };

    const config = statusConfig[status.toLowerCase()] || { color: 'default' as const, icon: null };

    const chipProps: {
      label: string;
      color: 'success' | 'info' | 'error' | 'warning' | 'default';
      size: 'small';
      sx: { fontWeight: number };
      icon?: React.ReactElement;
    } = {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: config.color,
      size: 'small',
      sx: { fontWeight: 600 },
    };

    if (config.icon) {
      chipProps.icon = config.icon;
    }

    return <Chip {...chipProps} />;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      institution: <SchoolIcon />,
      subscription: <TrendingUpIcon />,
      payment: <MoneyIcon />,
      alert: <WarningIcon />,
    };
    return icons[type] || <BusinessIcon />;
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      institution: theme.palette.primary.main,
      subscription: theme.palette.success.main,
      payment: theme.palette.info.main,
      alert: theme.palette.warning.main,
    };
    return colors[type] || theme.palette.grey[500];
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Super Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage all institutions across the platform
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <IconButton onClick={fetchDashboardData} color="primary">
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddBusinessIcon />} size="large">
            Add New Institution
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Institutions"
            value={totalInstitutions}
            icon={<BusinessIcon />}
            color={theme.palette.primary.main}
            subtitle="Across all statuses"
            trend={metrics_summary.institution_growth_trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Subscriptions"
            value={activeSubscriptions}
            icon={<CheckCircleIcon />}
            color={theme.palette.success.main}
            subtitle={`${totalInstitutions > 0 ? ((activeSubscriptions / totalInstitutions) * 100).toFixed(1) : 0}% of total`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Monthly Recurring Revenue"
            value={`₹${(metrics_summary.mrr / 1000).toFixed(0)}K`}
            icon={<MoneyIcon />}
            color={theme.palette.info.main}
            subtitle="Current month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Annual Recurring Revenue"
            value={`₹${(metrics_summary.arr / 100000).toFixed(1)}L`}
            icon={<TrendingUpIcon />}
            color={theme.palette.warning.main}
            subtitle="Based on current MRR"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" fontWeight={600}>
                Subscription Status Distribution
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {subscriptionData.map((item) => (
                <Grid item xs={6} key={item.status}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(item.color, 0.1),
                      border: `1px solid ${alpha(item.color, 0.3)}`,
                    }}
                  >
                    <Typography variant="h4" fontWeight={700} color={item.color}>
                      {item.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.status}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={totalInstitutions > 0 ? (item.count / totalInstitutions) * 100 : 0}
                      sx={{
                        mt: 1,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: alpha(item.color, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: item.color,
                        },
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" fontWeight={600}>
                Platform Usage Statistics
              </Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700} color="primary">
                    {platform_usage.dau.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Daily Active Users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700} color="secondary">
                    {platform_usage.mau.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Monthly Active Users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      DAU/MAU Ratio
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {platform_usage.dau_mau_ratio.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {platform_usage.total_users.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {platform_usage.active_users.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" fontWeight={600}>
                Revenue Trend
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip label="MRR" color="primary" size="small" />
                <Chip label="ARR" color="secondary" size="small" variant="outlined" />
              </Stack>
            </Box>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {revenue_trends.map((data) => {
                const maxValue = Math.max(...revenue_trends.map((d) => d.mrr));
                const height = maxValue > 0 ? (data.mrr / maxValue) * 100 : 0;
                return (
                  <Box key={data.month} sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 1, display: 'block' }}
                    >
                      ₹{(data.mrr / 1000).toFixed(0)}K
                    </Typography>
                    <Box
                      sx={{
                        height: `${Math.max(height, 5)}%`,
                        bgcolor: theme.palette.primary.main,
                        borderRadius: 1,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark,
                          transform: 'scaleY(1.05)',
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      {data.month}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Activity
            </Typography>
            <List sx={{ p: 0 }}>
              {recent_activities.slice(0, 5).map((activity, index) => (
                <ListItem key={index} sx={{ px: 0, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: alpha(getActivityColor(activity.type), 0.1),
                        color: getActivityColor(activity.type),
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Institution Performance Comparison
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select value={filterStatus} onChange={handleFilterChange} label="Filter by Status">
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="trial">Trial</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortField === 'name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Institution Name
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'total_users'}
                    direction={sortField === 'total_users' ? sortOrder : 'asc'}
                    onClick={() => handleSort('total_users')}
                  >
                    Total Users
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'active_users'}
                    direction={sortField === 'active_users' ? sortOrder : 'asc'}
                    onClick={() => handleSort('active_users')}
                  >
                    Active Users
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'revenue'}
                    direction={sortField === 'revenue' ? sortOrder : 'asc'}
                    onClick={() => handleSort('revenue')}
                  >
                    Revenue (₹)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'engagement'}
                    direction={sortField === 'engagement' ? sortOrder : 'asc'}
                    onClick={() => handleSort('engagement')}
                  >
                    Engagement
                  </TableSortLabel>
                </TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedInstitutions.map((institution) => (
                <TableRow key={institution.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {institution.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{institution.total_users.toLocaleString()}</TableCell>
                  <TableCell align="right">{institution.active_users.toLocaleString()}</TableCell>
                  <TableCell>{getStatusChip(institution.subscription_status)}</TableCell>
                  <TableCell align="right">
                    {institution.revenue > 0 ? `₹${institution.revenue.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 1,
                      }}
                    >
                      <LinearProgress
                        variant="determinate"
                        value={institution.engagement}
                        sx={{
                          width: 60,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      />
                      <Typography variant="body2">{institution.engagement.toFixed(1)}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(institution.last_activity).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<AddBusinessIcon />} size="large">
          Onboard New Institution
        </Button>
        <Button variant="outlined" startIcon={<SchoolIcon />} size="large">
          Bulk Import Institutions
        </Button>
        <Button variant="outlined" startIcon={<AssignmentIcon />} size="large">
          Generate Reports
        </Button>
        <Button variant="outlined" startIcon={<EventIcon />} size="large">
          Schedule Demo
        </Button>
      </Box>

      {quick_actions &&
        (quick_actions.trials_expiring_soon > 0 ||
          quick_actions.grace_period_ending > 0 ||
          quick_actions.pending_onboarding > 0) && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 3,
              border: `1px solid ${theme.palette.warning.main}`,
              bgcolor: alpha(theme.palette.warning.main, 0.05),
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <WarningIcon color="warning" />
              Quick Actions Required
            </Typography>
            <Stack spacing={1}>
              {quick_actions.trials_expiring_soon > 0 && (
                <Typography variant="body2">
                  <strong>{quick_actions.trials_expiring_soon}</strong> trial subscriptions expiring
                  within 7 days
                </Typography>
              )}
              {quick_actions.grace_period_ending > 0 && (
                <Typography variant="body2">
                  <strong>{quick_actions.grace_period_ending}</strong> subscriptions with grace
                  period ending soon
                </Typography>
              )}
              {quick_actions.pending_onboarding > 0 && (
                <Typography variant="body2">
                  <strong>{quick_actions.pending_onboarding}</strong> institutions pending
                  onboarding
                </Typography>
              )}
            </Stack>
          </Paper>
        )}
    </Box>
  );
}
