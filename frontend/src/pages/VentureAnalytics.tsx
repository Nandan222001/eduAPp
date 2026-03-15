import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Paper,
  Stack,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  EmojiEvents as TrophyIcon,
  ShowChart as ChartIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import entrepreneurshipApi from '@/api/entrepreneurship';
import { StudentVenture } from '@/types/entrepreneurship';

export default function VentureAnalytics() {
  const [ventures, setVentures] = useState<StudentVenture[]>([]);
  const [selectedVentureId, setSelectedVentureId] = useState<number>(0);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const institutionId = parseInt(localStorage.getItem('institution_id') || '1');

  useEffect(() => {
    fetchVentures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedVentureId > 0) {
      fetchAnalytics(selectedVentureId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVentureId]);

  const fetchVentures = async () => {
    try {
      setLoading(true);
      const data = await entrepreneurshipApi.getVentures(institutionId);
      setVentures(data);
      if (data.length > 0) {
        setSelectedVentureId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch ventures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (ventureId: number) => {
    try {
      setLoading(true);
      const data = await entrepreneurshipApi.getVentureAnalytics(institutionId, ventureId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedVenture = ventures.find((v) => v.id === selectedVentureId);

  if (loading && !analytics) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Venture Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your venture&apos;s growth and performance metrics
            </Typography>
          </Box>
          {ventures.length > 0 && (
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Select Venture</InputLabel>
              <Select
                value={selectedVentureId}
                onChange={(e) => setSelectedVentureId(Number(e.target.value))}
                label="Select Venture"
              >
                {ventures.map((venture) => (
                  <MenuItem key={venture.id} value={venture.id}>
                    {venture.venture_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </Box>

      {selectedVenture && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              {selectedVenture.logo_url ? (
                <Avatar src={selectedVenture.logo_url} sx={{ width: 80, height: 80 }} />
              ) : (
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}>
                  {selectedVenture.venture_name.charAt(0)}
                </Avatar>
              )}
              <Box flex={1}>
                <Typography variant="h4" fontWeight={700}>
                  {selectedVenture.venture_name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {selectedVenture.tagline}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={selectedVenture.venture_status.replace('_', ' ').toUpperCase()}
                    color="primary"
                    size="small"
                  />
                  {selectedVenture.is_featured && (
                    <Chip label="Featured" color="warning" size="small" />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Customers
                      </Typography>
                      <Typography variant="h3" fontWeight={700}>
                        {selectedVenture.customers.toLocaleString()}
                      </Typography>
                      {selectedVenture.metrics?.customer_acquisition_rate && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                          <TrendingUpIcon fontSize="small" color="success" />
                          <Typography variant="caption" color="success.main">
                            +{selectedVenture.metrics.customer_acquisition_rate.toFixed(1)}% this
                            month
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                    <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
                      <PeopleIcon color="primary" />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Revenue
                      </Typography>
                      <Typography variant="h3" fontWeight={700}>
                        ${Number(selectedVenture.revenue).toLocaleString()}
                      </Typography>
                      {selectedVenture.metrics?.monthly_revenue_growth && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                          <TrendingUpIcon fontSize="small" color="success" />
                          <Typography variant="caption" color="success.main">
                            +{selectedVenture.metrics.monthly_revenue_growth.toFixed(1)}% growth
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                    <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1) }}>
                      <MoneyIcon color="success" />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Funding Received
                      </Typography>
                      <Typography variant="h3" fontWeight={700}>
                        ${Number(selectedVenture.funding_received).toLocaleString()}
                      </Typography>
                      {selectedVenture.funding_requested && (
                        <Typography variant="caption" color="text.secondary">
                          of ${Number(selectedVenture.funding_requested).toLocaleString()} requested
                        </Typography>
                      )}
                    </Box>
                    <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1) }}>
                      <TrophyIcon color="warning" />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Social Impact Score
                      </Typography>
                      <Typography variant="h3" fontWeight={700}>
                        {selectedVenture.metrics?.social_impact_score || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        out of 100
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.1) }}>
                      <HeartIcon color="info" />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Customer Acquisition" />
                <CardContent>
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.default',
                      borderRadius: 2,
                    }}
                  >
                    <Stack alignItems="center" spacing={2}>
                      <ChartIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Customer growth chart would appear here
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Acquisition Rate
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedVenture.metrics?.customer_acquisition_rate?.toFixed(1) || 0}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={selectedVenture.metrics?.customer_acquisition_rate || 0}
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Retention Rate
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedVenture.metrics?.user_retention_rate?.toFixed(1) || 0}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={selectedVenture.metrics?.user_retention_rate || 0}
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        color="success"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Revenue Growth" />
                <CardContent>
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.default',
                      borderRadius: 2,
                    }}
                  >
                    <Stack alignItems="center" spacing={2}>
                      <ChartIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Revenue trend chart would appear here
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Monthly Growth
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          +{selectedVenture.metrics?.monthly_revenue_growth?.toFixed(1) || 0}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(selectedVenture.metrics?.monthly_revenue_growth || 0, 100)}
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        color="success"
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Market Validation
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedVenture.metrics?.market_validation_score?.toFixed(0) || 0}/100
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={selectedVenture.metrics?.market_validation_score || 0}
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        color="warning"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {selectedVenture.social_impact && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Social Impact" />
                  <CardContent>
                    <Typography variant="body1" color="text.secondary">
                      {selectedVenture.social_impact}
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight={700} color="primary.main">
                            {selectedVenture.customers}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            People Reached
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight={700} color="success.main">
                            {selectedVenture.metrics?.social_impact_score || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Impact Score
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight={700} color="warning.main">
                            {selectedVenture.achievements?.length || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Achievements
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {selectedVenture.milestones && selectedVenture.milestones.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Milestones Progress" />
                  <CardContent>
                    <Stack spacing={2}>
                      {selectedVenture.milestones.map((milestone) => (
                        <Box key={milestone.id}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1 }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              {milestone.title}
                            </Typography>
                            <Chip
                              label={milestone.completed ? 'Completed' : 'In Progress'}
                              color={milestone.completed ? 'success' : 'warning'}
                              size="small"
                            />
                          </Stack>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            gutterBottom
                          >
                            {milestone.description}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={milestone.completed ? 100 : 50}
                            sx={{ height: 6, borderRadius: 3 }}
                            color={milestone.completed ? 'success' : 'primary'}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Container>
  );
}
