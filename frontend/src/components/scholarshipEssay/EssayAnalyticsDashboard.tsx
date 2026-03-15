import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Stack,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as StableIcon,
  Timeline as TimelineIcon,
  Compare as CompareIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { scholarshipEssayApi } from '@/api/scholarshipEssay';
import type { EssayAnalytics } from '@/types/scholarshipEssay';

interface EssayAnalyticsDashboardProps {
  essayId: string;
}

export default function EssayAnalyticsDashboard({ essayId }: EssayAnalyticsDashboardProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<EssayAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [essayId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await scholarshipEssayApi.getEssayAnalytics(essayId);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />;
      case 'declining':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />;
      default:
        return <StableIcon sx={{ color: theme.palette.grey[500], fontSize: 20 }} />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return theme.palette.success.main;
      case 'declining':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analytics) {
    return <Alert severity="error">{error || 'No analytics available'}</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700}>
                      {analytics.revisionsCount}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Total Revisions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700}>
                      {Math.round(analytics.timeSpentWriting / 60)}h
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Time Spent Writing
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700}>
                      {analytics.peerReviewsReceived}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Peer Reviews
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700}>
                      {analytics.avgPeerRating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      Average Rating
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Improvement Metrics"
              subheader="Compare your early drafts to the final version"
              avatar={<TimelineIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={3}>
                {analytics.improvementMetrics.map((metric) => (
                  <Grid item xs={12} sm={6} md={4} key={metric.metric}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderLeft: `4px solid ${getTrendColor(metric.trend)}`,
                      }}
                    >
                      <Stack spacing={1}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="subtitle2">{metric.metric}</Typography>
                          {getTrendIcon(metric.trend)}
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                          }}
                        >
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Initial
                            </Typography>
                            <Typography variant="h6">{metric.initialValue}</Typography>
                          </Box>
                          <TrendingUpIcon sx={{ color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Current
                            </Typography>
                            <Typography variant="h6" color={getTrendColor(metric.trend)}>
                              {metric.currentValue}
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Change
                            </Typography>
                            <Typography
                              variant="caption"
                              fontWeight={600}
                              color={getTrendColor(metric.trend)}
                            >
                              {metric.change > 0 ? '+' : ''}
                              {metric.change}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.abs(metric.change)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(getTrendColor(metric.trend), 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getTrendColor(metric.trend),
                              },
                            }}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardHeader
              title="Version Comparison"
              subheader="Track improvements across all versions"
              avatar={<CompareIcon color="secondary" />}
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Version</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Word Count</TableCell>
                      <TableCell align="right">Readability</TableCell>
                      <TableCell align="right">Grammar Issues</TableCell>
                      <TableCell align="right">Structure</TableCell>
                      <TableCell align="right">Impact</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.versionsCompared.map((version) => (
                      <TableRow key={version.versionNumber}>
                        <TableCell>
                          <Chip
                            label={`v${version.versionNumber}`}
                            size="small"
                            color={
                              version.versionNumber === analytics.versionsCompared.length
                                ? 'primary'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{new Date(version.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right">{version.wordCount}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={version.readabilityScore}
                            size="small"
                            color={
                              version.readabilityScore >= 80
                                ? 'success'
                                : version.readabilityScore >= 60
                                  ? 'warning'
                                  : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={version.grammarIssues}
                            size="small"
                            color={
                              version.grammarIssues === 0
                                ? 'success'
                                : version.grammarIssues <= 5
                                  ? 'warning'
                                  : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={version.structureScore}
                            size="small"
                            color={
                              version.structureScore >= 80
                                ? 'success'
                                : version.structureScore >= 60
                                  ? 'warning'
                                  : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={version.impactScore}
                            size="small"
                            color={
                              version.impactScore >= 80
                                ? 'success'
                                : version.impactScore >= 60
                                  ? 'warning'
                                  : 'error'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: alpha(theme.palette.success.main, 0.05),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 32 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Great Progress!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your essay has improved significantly through {analytics.revisionsCount}{' '}
                  revisions. Keep refining based on peer feedback to make it even stronger.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
