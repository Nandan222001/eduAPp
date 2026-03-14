import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import superAdminApi, {
  CrossInstitutionAnalyticsResponse,
  InstitutionMetrics,
  InstitutionRanking,
  AnomalyDetection,
  BestPractice,
} from '@/api/superAdmin';
import { format, subDays } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SuperAdminCrossInstitutionAnalytics() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<CrossInstitutionAnalyticsResponse | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState({
    region: '',
    plan: '',
    size: '',
    start_date: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionMetrics | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminApi.getCrossInstitutionAnalytics(filters);
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string) => (event: SelectChangeEvent<string>) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    try {
      const data = await superAdminApi.exportAnalyticsData({ ...filters, format });
      
      if (format === 'csv') {
        const blob = data as Blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cross_institution_analytics_${format(new Date(), 'yyyyMMdd')}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cross_institution_analytics_${format(new Date(), 'yyyyMMdd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    }
  };

  const getMetricColor = (value: number, benchmark: number): string => {
    if (value >= benchmark * 1.1) return theme.palette.success.main;
    if (value >= benchmark * 0.9) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchAnalytics}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const { institution_metrics, benchmarks, rankings, trends, anomalies, best_practices, cohort_analysis } = analyticsData;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Cross-Institution Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Compare performance metrics and identify best practices across all institutions
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Region</InputLabel>
                <Select value={filters.region} onChange={handleFilterChange('region')} label="Region">
                  <MenuItem value="">All Regions</MenuItem>
                  <MenuItem value="North">North</MenuItem>
                  <MenuItem value="South">South</MenuItem>
                  <MenuItem value="East">East</MenuItem>
                  <MenuItem value="West">West</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Plan</InputLabel>
                <Select value={filters.plan} onChange={handleFilterChange('plan')} label="Plan">
                  <MenuItem value="">All Plans</MenuItem>
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Pro">Pro</MenuItem>
                  <MenuItem value="Enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Size</InputLabel>
                <Select value={filters.size} onChange={handleFilterChange('size')} label="Size">
                  <MenuItem value="">All Sizes</MenuItem>
                  <MenuItem value="small">Small (&lt;100)</MenuItem>
                  <MenuItem value="medium">Medium (100-500)</MenuItem>
                  <MenuItem value="large">Large (&gt;500)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={fetchAnalytics}
                  fullWidth
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('csv')}
                >
                  Export
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Benchmark Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg Attendance
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {benchmarks.average_attendance.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                75th percentile: {benchmarks.percentile_75_attendance.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg Exam Pass Rate
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {benchmarks.average_exam_pass_rate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                75th percentile: {benchmarks.percentile_75_exam_pass_rate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg Engagement
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {benchmarks.average_engagement_score.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                75th percentile: {benchmarks.percentile_75_engagement_score.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg Teacher Effectiveness
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {benchmarks.average_teacher_effectiveness.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                75th percentile: {benchmarks.percentile_75_teacher_effectiveness.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
            <Tab icon={<TrophyIcon />} label="Rankings" iconPosition="start" />
            <Tab icon={<AnalyticsIcon />} label="Trends" iconPosition="start" />
            <Tab icon={<WarningIcon />} label="Anomalies" iconPosition="start" />
            <Tab icon={<LightbulbIcon />} label="Best Practices" iconPosition="start" />
            <Tab icon={<SchoolIcon />} label="Cohort Analysis" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Rankings Tab */}
        <TabPanel value={selectedTab} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell>Composite Score</TableCell>
                  <TableCell>Percentile</TableCell>
                  <TableCell>Attendance Rank</TableCell>
                  <TableCell>Exam Rank</TableCell>
                  <TableCell>Engagement Rank</TableCell>
                  <TableCell>Teacher Rank</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankings.slice(0, 20).map((ranking) => {
                  const institution = institution_metrics.find(m => m.institution_id === ranking.institution_id);
                  return (
                    <TableRow key={ranking.institution_id} hover>
                      <TableCell>
                        <Chip 
                          label={`#${ranking.overall_rank}`} 
                          color={ranking.overall_rank <= 3 ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{ranking.institution_name}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {ranking.composite_score.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flexGrow: 1, mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={ranking.percentile} 
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          <Typography variant="caption">{ranking.percentile.toFixed(0)}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{ranking.attendance_rank}</TableCell>
                      <TableCell>{ranking.exam_performance_rank}</TableCell>
                      <TableCell>{ranking.engagement_rank}</TableCell>
                      <TableCell>{ranking.teacher_effectiveness_rank}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedInstitution(institution || null);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Trends Tab */}
        <TabPanel value={selectedTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Trends Over Time
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends.monthly_trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="average_attendance" stroke={theme.palette.primary.main} name="Attendance %" />
                      <Line type="monotone" dataKey="average_exam_pass_rate" stroke={theme.palette.success.main} name="Exam Pass Rate %" />
                      <Line type="monotone" dataKey="average_engagement_score" stroke={theme.palette.warning.main} name="Engagement %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    {trends.attendance_trend_percentage >= 0 ? 
                      <TrendingUpIcon color="success" /> : 
                      <TrendingDownIcon color="error" />
                    }
                    <Typography variant="h6">Attendance Trend</Typography>
                  </Stack>
                  <Typography variant="h4" color={trends.attendance_trend_percentage >= 0 ? 'success.main' : 'error.main'}>
                    {trends.attendance_trend_percentage > 0 ? '+' : ''}{trends.attendance_trend_percentage.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    {trends.exam_performance_trend_percentage >= 0 ? 
                      <TrendingUpIcon color="success" /> : 
                      <TrendingDownIcon color="error" />
                    }
                    <Typography variant="h6">Exam Performance Trend</Typography>
                  </Stack>
                  <Typography variant="h4" color={trends.exam_performance_trend_percentage >= 0 ? 'success.main' : 'error.main'}>
                    {trends.exam_performance_trend_percentage > 0 ? '+' : ''}{trends.exam_performance_trend_percentage.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    {trends.engagement_trend_percentage >= 0 ? 
                      <TrendingUpIcon color="success" /> : 
                      <TrendingDownIcon color="error" />
                    }
                    <Typography variant="h6">Engagement Trend</Typography>
                  </Stack>
                  <Typography variant="h4" color={trends.engagement_trend_percentage >= 0 ? 'success.main' : 'error.main'}>
                    {trends.engagement_trend_percentage > 0 ? '+' : ''}{trends.engagement_trend_percentage.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Anomalies Tab */}
        <TabPanel value={selectedTab} index={2}>
          <Grid container spacing={2}>
            {anomalies.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  No anomalies detected. All institutions are performing within expected ranges.
                </Alert>
              </Grid>
            ) : (
              anomalies.map((anomaly, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Alert 
                    severity={anomaly.severity === 'high' ? 'error' : 'warning'}
                    icon={<WarningIcon />}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {anomaly.institution_name} - {anomaly.metric_name}
                    </Typography>
                    <Typography variant="body2">
                      {anomaly.description}
                    </Typography>
                    <Typography variant="caption" display="block" mt={1}>
                      Expected: {anomaly.expected_value.toFixed(1)} | Actual: {anomaly.actual_value.toFixed(1)} 
                      ({anomaly.deviation_percentage > 0 ? '+' : ''}{anomaly.deviation_percentage.toFixed(1)}% deviation)
                    </Typography>
                  </Alert>
                </Grid>
              ))
            )}
          </Grid>
        </TabPanel>

        {/* Best Practices Tab */}
        <TabPanel value={selectedTab} index={3}>
          <Grid container spacing={2}>
            {best_practices.map((practice, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <LightbulbIcon color="primary" />
                      <Chip 
                        label={practice.category.replace('_', ' ').toUpperCase()} 
                        size="small" 
                        color="primary"
                      />
                      <Chip 
                        label={`${practice.impact_level} impact`} 
                        size="small" 
                        color={practice.impact_level === 'high' ? 'success' : 'default'}
                      />
                    </Stack>
                    <Typography variant="h6" gutterBottom>
                      {practice.institution_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {practice.description}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Recommendation:
                    </Typography>
                    <Typography variant="body2">
                      {practice.recommendation}
                    </Typography>
                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary">
                        Metric Value: {practice.metric_value.toFixed(1)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Cohort Analysis Tab */}
        <TabPanel value={selectedTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance by Subscription Plan
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cohort_analysis.by_plan}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cohort" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="avg_attendance" fill={theme.palette.primary.main} name="Attendance %" />
                      <Bar dataKey="avg_exam_pass_rate" fill={theme.palette.success.main} name="Exam Pass Rate %" />
                      <Bar dataKey="avg_engagement" fill={theme.palette.warning.main} name="Engagement %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance by Institution Size
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cohort_analysis.by_size}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cohort" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="avg_attendance" fill={theme.palette.primary.main} name="Attendance %" />
                      <Bar dataKey="avg_exam_pass_rate" fill={theme.palette.success.main} name="Exam Pass Rate %" />
                      <Bar dataKey="avg_engagement" fill={theme.palette.warning.main} name="Engagement %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Institution Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedInstitution?.institution_name}
        </DialogTitle>
        <DialogContent>
          {selectedInstitution && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Region</Typography>
                <Typography variant="body1">{selectedInstitution.region}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Plan</Typography>
                <Typography variant="body1">{selectedInstitution.subscription_plan}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Size</Typography>
                <Typography variant="body1">{selectedInstitution.institution_size}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Students</Typography>
                <Typography variant="body1">{selectedInstitution.total_students}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Teachers</Typography>
                <Typography variant="body1">{selectedInstitution.total_teachers}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Performance Metrics</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Attendance</Typography>
                <Typography variant="h6" color={getMetricColor(selectedInstitution.average_attendance, benchmarks.average_attendance)}>
                  {selectedInstitution.average_attendance.toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Exam Pass Rate</Typography>
                <Typography variant="h6" color={getMetricColor(selectedInstitution.exam_pass_rate, benchmarks.average_exam_pass_rate)}>
                  {selectedInstitution.exam_pass_rate.toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Engagement</Typography>
                <Typography variant="h6" color={getMetricColor(selectedInstitution.student_engagement_score, benchmarks.average_engagement_score)}>
                  {selectedInstitution.student_engagement_score.toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Teacher Effectiveness</Typography>
                <Typography variant="h6" color={getMetricColor(selectedInstitution.teacher_effectiveness_score, benchmarks.average_teacher_effectiveness)}>
                  {selectedInstitution.teacher_effectiveness_score.toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
