import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import { Storage as StorageIcon, Warning as WarningIcon } from '@mui/icons-material';
import superAdminApi, { UsageMetric } from '@/api/superAdmin';

interface UsageMetricsPanelProps {
  institutionId: number;
}

export default function UsageMetricsPanel({ institutionId }: UsageMetricsPanelProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);

  useEffect(() => {
    fetchUsageMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  const fetchUsageMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminApi.getUsageMetrics(institutionId);
      setMetrics(data.usage_metrics);
    } catch (err) {
      setError('Failed to load usage metrics');
      console.error('Error fetching usage metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const getUsageColor = (percentage: number | undefined) => {
    if (!percentage) return theme.palette.primary.main;
    if (percentage >= 90) return theme.palette.error.main;
    if (percentage >= 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  return (
    <Paper sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Usage Metrics
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} key={index}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600}>
                  {metric.metric_name}
                </Typography>
                {metric.percentage_used && metric.percentage_used >= 80 && (
                  <Chip
                    icon={<WarningIcon />}
                    label={`${metric.percentage_used.toFixed(0)}% Used`}
                    size="small"
                    color={metric.percentage_used >= 90 ? 'error' : 'warning'}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  {metric.limit ? (
                    <>
                      <LinearProgress
                        variant="determinate"
                        value={metric.percentage_used || 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(getUsageColor(metric.percentage_used), 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getUsageColor(metric.percentage_used),
                            borderRadius: 4,
                          },
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {metric.current_value} / {metric.limit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {metric.percentage_used?.toFixed(1)}%
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StorageIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{metric.current_value} (No limit)</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Period: {new Date(metric.period_start).toLocaleDateString()} -{' '}
                {new Date(metric.period_end).toLocaleDateString()}
              </Typography>
            </Stack>
          </Grid>
        ))}

        {metrics.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">No usage metrics available</Alert>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
